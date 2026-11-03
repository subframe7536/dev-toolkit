import type { Workbook } from 'hucre/xlsx'

import { generateId } from '#/utils/random'

import type { CellValue, ColumnDefinition, ParseResult, TableData, TableRow } from '../types'

export const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss'

const DATE_TOKENS: Record<string, (date: Date) => string> = {
  YYYY: (date) => String(date.getUTCFullYear()),
  MM: (date) => String(date.getUTCMonth() + 1).padStart(2, '0'),
  DD: (date) => String(date.getUTCDate()).padStart(2, '0'),
  HH: (date) => String(date.getUTCHours()).padStart(2, '0'),
  mm: (date) => String(date.getUTCMinutes()).padStart(2, '0'),
  ss: (date) => String(date.getUTCSeconds()).padStart(2, '0'),
}

// Excel serial dates carry no timezone and hucre surfaces them as UTC dates,
// so format with UTC getters to preserve the stored wall-clock time
function formatDateCell(date: Date, format: string): string {
  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (token) => DATE_TOKENS[token](date))
}

async function readWorkbook(arrayBuffer: ArrayBuffer, fileName: string): Promise<Workbook> {
  const { readXlsx, readXls } = await import('hucre/xlsx')
  return fileName.endsWith('.xls') ? readXls(arrayBuffer) : readXlsx(arrayBuffer)
}

/**
 * Get list of sheet names from an Excel file
 *
 * @param file - Excel file (.xlsx or .xls)
 * @returns Promise resolving to array of sheet names
 */
export async function getExcelSheetNames(file: File): Promise<string[]> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = await readWorkbook(arrayBuffer, file.name.toLowerCase())
    return workbook.sheets.map((sheet) => sheet.name)
  } catch (error) {
    throw new Error(
      `Failed to read Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

/**
 * Parse Excel file into normalized table data
 *
 * Supports both .xlsx and .xls formats
 * Extracts underlying cell values, ignoring formatting and formulas
 *
 * @param file - Excel file to parse
 * @param sheetIndex - Index of sheet to parse (default: 0 for first sheet)
 * @param hasHeaders - Whether the first row is a header (default: true)
 * @param dateFormat - Pattern used to stringify date cells (default: YYYY-MM-DD HH:mm:ss)
 * @returns Promise resolving to ParseResult with success status and data or error
 */
export async function parseExcelFile(
  file: File,
  sheetIndex: number = 0,
  hasHeaders: boolean = true,
  dateFormat: string = DEFAULT_DATE_FORMAT,
): Promise<ParseResult> {
  // Validate file
  if (!file) {
    return {
      success: false,
      error: {
        message: 'No file provided.',
      },
    }
  }

  // Check file extension
  const fileName = file.name.toLowerCase()
  if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
    return {
      success: false,
      error: {
        message: 'Unsupported file format. Please upload .xlsx or .xls files.',
      },
    }
  }

  const toCellValue = (value: unknown): CellValue => {
    if (value === null || value === undefined || value === '') {
      return null
    }
    if (value instanceof Date) {
      return formatDateCell(value, dateFormat)
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return value
    }
    return String(value).trim()
  }

  try {
    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer()

    // Parse workbook
    let workbook: Workbook
    try {
      workbook = await readWorkbook(arrayBuffer, fileName)
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Failed to read Excel file. The file may be corrupted.',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }

    // Validate sheet index
    if (sheetIndex < 0 || sheetIndex >= workbook.sheets.length) {
      return {
        success: false,
        error: {
          message: `Invalid sheet index ${sheetIndex}. File has ${workbook.sheets.length} sheet(s).`,
        },
      }
    }

    // Get the specified sheet (default to first sheet)
    const sheet = workbook.sheets[sheetIndex]

    if (!sheet) {
      return {
        success: false,
        error: {
          message: `Sheet at index ${sheetIndex} not found in workbook.`,
        },
      }
    }

    // Rows are a dense rectangle of raw cell values with null for empty cells
    const rawData = sheet.rows

    // Check if sheet is empty
    if (rawData.length === 0) {
      return {
        success: false,
        error: {
          message: 'Selected sheet is empty.',
        },
      }
    }

    let columnNames: string[] = []
    let dataStartIndex = 0

    if (hasHeaders) {
      // First row is the header
      const headerRow = rawData[0]

      if (!headerRow || headerRow.length === 0) {
        return {
          success: false,
          error: {
            message: 'Sheet has no columns.',
          },
        }
      }

      // Extract column names from header row
      columnNames = headerRow.map((cell, index) => {
        const cellValue = toCellValue(cell)
        return cellValue === null ? `Column ${index + 1}` : String(cellValue)
      })
      dataStartIndex = 1
    } else {
      // No headers - generate column names based on max row length
      const maxCols = rawData.reduce((max, row) => Math.max(max, row ? row.length : 0), 0)
      columnNames = Array.from({ length: maxCols }, (_, i) => `Column ${i + 1}`)
      dataStartIndex = 0
    }

    // Create column definitions
    const columns: ColumnDefinition[] = columnNames.map((name) => ({
      id: generateId(),
      name,
      originalName: name,
      dataType: 'string', // Will be inferred later
      isPinned: false,
    }))

    // Extract data rows (skip header row if present)
    const rows: TableRow[] = []

    for (let i = dataStartIndex; i < rawData.length; i++) {
      const rowData = rawData[i]

      // Skip completely empty rows
      if (!rowData || rowData.every((cell) => cell === null || cell === '')) {
        continue
      }

      // Create cells object mapped to column IDs
      const cells: Record<string, CellValue> = {}

      columns.forEach((col, colIndex) => {
        cells[col.id] = toCellValue(rowData[colIndex])
      })

      rows.push({
        id: generateId(),
        cells,
      })
    }

    // Check if we have any data rows
    if (rows.length === 0) {
      return {
        success: false,
        error: {
          message: 'Sheet contains only headers with no data rows.',
        },
      }
    }

    const tableData: TableData = {
      columns,
      rows,
    }

    return {
      success: true,
      data: tableData,
    }
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'Failed to parse Excel file.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
}
