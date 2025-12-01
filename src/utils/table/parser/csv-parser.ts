import type { CellValue, ColumnDefinition, ParseResult, TableData, TableRow } from '../types'

import { generateId } from '#/utils/random'
import Papa from 'papaparse'

import { inferDataType } from './type-inference'

/**
 * Parse CSV text into normalized table data
 *
 * Supports CSV format according to RFC 4180
 * Automatically detects headers and handles quoted values
 *
 * @param input - CSV text string
 * @param hasHeaders - Whether the CSV has headers (default: true, auto-detected)
 * @returns ParseResult with success status and data or error
 */
export function parseCSVText(input: string, hasHeaders: boolean = true): ParseResult {
  // Validate input
  if (!input || input.trim().length === 0) {
    return {
      success: false,
      error: {
        message: 'Please paste CSV text.',
      },
    }
  }

  try {
    // Parse CSV using Papa Parse
    const parseResult = Papa.parse<string[]>(input, {
      header: false, // Always parse as array of arrays for consistency
      skipEmptyLines: true,
      dynamicTyping: false, // Keep as strings, we'll infer types later
      transformHeader: undefined, // Not used when header: false
    })

    // Check for parsing errors
    if (parseResult.errors.length > 0) {
      const errorMessages = parseResult.errors.map(e => e.message).join(', ')
      return {
        success: false,
        error: {
          message: 'CSV parsing error',
          details: errorMessages,
        },
      }
    }

    const rawData = parseResult.data

    // Check if CSV is empty
    if (rawData.length === 0) {
      return {
        success: false,
        error: {
          message: 'CSV file is empty.',
        },
      }
    }

    // Determine if first row is header
    // If hasHeaders is explicitly false, treat first row as data
    // Otherwise, assume first row is header
    const firstRowIsHeader = hasHeaders !== false

    // Extract column names
    let columnNames: string[] = []
    let dataStartIndex = 0

    if (firstRowIsHeader) {
      const headerRow = rawData[0]
      if (!headerRow || headerRow.length === 0) {
        return {
          success: false,
          error: {
            message: 'CSV has no column headers.',
          },
        }
      }

      // Extract column names from header row
      columnNames = headerRow.map((cell, index) => {
        const cellValue = cell === null || cell === undefined ? '' : String(cell).trim()
        return cellValue || `Column ${index + 1}`
      })

      dataStartIndex = 1
    } else {
      // No headers - generate column names based on first row length
      const firstRow = rawData[0]
      if (!firstRow || firstRow.length === 0) {
        return {
          success: false,
          error: {
            message: 'CSV has no data.',
          },
        }
      }

      columnNames = firstRow.map((_, index) => `Column ${index + 1}`)
      dataStartIndex = 0
    }

    if (columnNames.length === 0) {
      return {
        success: false,
        error: {
          message: 'CSV has no columns.',
        },
      }
    }

    // Create column definitions (data types will be inferred later)
    const columns: ColumnDefinition[] = columnNames.map(name => ({
      id: generateId(),
      name,
      originalName: name,
      dataType: 'string', // Will be inferred later
      isPinned: false,
    }))

    // Extract data rows
    const rows: TableRow[] = []
    const columnValues: CellValue[][] = columns.map(() => [])

    for (let i = dataStartIndex; i < rawData.length; i++) {
      const rowData = rawData[i]

      // Skip completely empty rows
      if (!rowData || rowData.every(cell => cell === null || cell === undefined || cell === '')) {
        continue
      }

      // Ensure row has same number of columns (pad with null if needed)
      const paddedRow: Array<string | null> = [...rowData]
      while (paddedRow.length < columnNames.length) {
        paddedRow.push(null)
      }

      // Create cells object mapped to column IDs
      const cells: Record<string, CellValue> = {}

      columns.forEach((col, colIndex) => {
        const cellValue = paddedRow[colIndex]

        // Convert cell value to appropriate type
        if (cellValue === null || cellValue === undefined || cellValue === '') {
          cells[col.id] = null
        } else {
          // Keep as string for now, type inference will handle conversion
          const trimmed = String(cellValue).trim()
          cells[col.id] = trimmed || null
        }

        // Collect values for type inference
        columnValues[colIndex].push(cells[col.id])
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
          message: 'CSV contains only headers with no data rows.',
        },
      }
    }

    // Infer data types for each column
    const columnsWithTypes = columns.map((col, index) => ({
      ...col,
      dataType: inferDataType(columnValues[index]),
    }))

    const tableData: TableData = {
      columns: columnsWithTypes,
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
        message: 'Failed to parse CSV text.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
}

/**
 * Parse CSV file into normalized table data
 *
 * @param file - CSV file to parse
 * @param hasHeaders - Whether the CSV has headers (default: true, auto-detected)
 * @returns Promise resolving to ParseResult with success status and data or error
 */
export async function parseCSVFile(file: File, hasHeaders: boolean = true): Promise<ParseResult> {
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
  if (!fileName.endsWith('.csv')) {
    return {
      success: false,
      error: {
        message: 'Unsupported file format. Please upload .csv files.',
      },
    }
  }

  try {
    // Read file as text
    const text = await file.text()

    // Use the text parser
    return parseCSVText(text, hasHeaders)
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'Failed to read CSV file.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
}
