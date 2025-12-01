import type { CellValue, ColumnDefinition, ParseResult, TableData, TableRow } from '../types'

import { generateId } from '#/utils/random'
import * as XLSX from 'xlsx'

/**
 * Get list of sheet names from an Excel file
 *
 * @param file - Excel file (.xlsx or .xls)
 * @returns Promise resolving to array of sheet names
 */
export async function getExcelSheetNames(file: File): Promise<string[]> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    return workbook.SheetNames
  } catch (error) {
    throw new Error(`Failed to read Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
 * @returns Promise resolving to ParseResult with success status and data or error
 */
export async function parseExcelFile(file: File, sheetIndex: number = 0): Promise<ParseResult> {
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

  try {
    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer()

    // Parse workbook
    let workbook: XLSX.WorkBook
    try {
      workbook = XLSX.read(arrayBuffer, { type: 'array' })
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
    if (sheetIndex < 0 || sheetIndex >= workbook.SheetNames.length) {
      return {
        success: false,
        error: {
          message: `Invalid sheet index ${sheetIndex}. File has ${workbook.SheetNames.length} sheet(s).`,
        },
      }
    }

    // Get the specified sheet (default to first sheet)
    const sheetName = workbook.SheetNames[sheetIndex]
    const worksheet = workbook.Sheets[sheetName]

    if (!worksheet) {
      return {
        success: false,
        error: {
          message: `Sheet "${sheetName}" not found in workbook.`,
        },
      }
    }

    // Convert sheet to JSON array (array of arrays)
    // Using header: 1 to get raw array format without assuming first row is header
    const rawData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: null, // Use null for empty cells
      raw: false, // Get formatted values as strings
    })

    // Check if sheet is empty
    if (rawData.length === 0) {
      return {
        success: false,
        error: {
          message: 'Selected sheet is empty.',
        },
      }
    }

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
    const columnNames: string[] = headerRow.map((cell, index) => {
      // Convert cell to string, use default column name if empty
      const cellValue = cell === null || cell === undefined ? '' : String(cell).trim()
      return cellValue || `Column ${index + 1}`
    })

    // Create column definitions
    const columns: ColumnDefinition[] = columnNames.map(name => ({
      id: generateId(),
      name,
      originalName: name,
      dataType: 'string', // Will be inferred later
      isPinned: false,
    }))

    // Extract data rows (skip header row)
    const rows: TableRow[] = []

    for (let i = 1; i < rawData.length; i++) {
      const rowData = rawData[i]

      // Skip completely empty rows
      if (!rowData || rowData.every(cell => cell === null || cell === undefined || cell === '')) {
        continue
      }

      // Create cells object mapped to column IDs
      const cells: Record<string, CellValue> = {}

      columns.forEach((col, colIndex) => {
        const cellValue = rowData[colIndex]

        // Convert cell value to appropriate type
        if (cellValue === null || cellValue === undefined || cellValue === '') {
          cells[col.id] = null
        } else if (typeof cellValue === 'number') {
          cells[col.id] = cellValue
        } else if (typeof cellValue === 'boolean') {
          cells[col.id] = cellValue
        } else {
          // Convert to string and trim
          cells[col.id] = String(cellValue).trim()
        }
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
