import type {
  CellValue,
  ColumnDefinition,
  DataType,
  ParseResult,
  TableRow,
} from '../types'

import { generateId } from '#/utils/random'
import { createUniqueId } from 'solid-js'

/**
 * Infers data type from a list of cell values.
 * Note: Date/datetime types are intentionally treated as 'string' per requirements.
 */
export function inferDataType(values: CellValue[]): DataType {
  // Filter out nulls and empty strings for type inference
  const nonEmptyValues = values.filter(v =>
    v !== null
    && (typeof v !== 'string' || v.trim() !== ''),
  )

  // If all values are empty/null, default to string
  if (nonEmptyValues.length === 0) {
    return 'string'
  }

  // Check for boolean values
  const allBoolean = nonEmptyValues.every((v) => {
    if (typeof v !== 'string') {
      return false
    }
    const lower = v.trim().toLowerCase()
    return ['true', 'false', '1', '0'].includes(lower)
  })
  if (allBoolean) {
    return 'boolean'
  }

  // Check for numeric values
  let allInteger = true
  let allDecimal = true

  for (const v of nonEmptyValues) {
    if (typeof v !== 'string') {
      allInteger = false
      allDecimal = false
      break
    }

    const numStr = v.trim()
    // Skip empty strings (already filtered but double-check)
    if (numStr === '') {
      continue
    }

    // Check integer pattern: optional sign followed by digits only
    if (!/^-?\d+$/.test(numStr)) {
      allInteger = false
    }

    // Check decimal pattern: optional sign, digits with optional decimal point
    if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(numStr)) {
      allDecimal = false
    }
  }

  if (allInteger) {
    return 'integer'
  }
  if (allDecimal) {
    return 'decimal'
  }

  // All other cases (including dates) are treated as strings per requirements
  return 'string'
}

/**
 * Parses MySQL ASCII table output into structured data.
 * Handles cell values with newlines and enforces strict column validation.
 */
export function parseMySQLOutput(tableStr: string): ParseResult {
  try {
    // Normalize line endings and remove empty lines
    const lines = tableStr
      .split(/(?<!\n)\r?\n(?!\r?\n)/g) // preserve multiple wrap line
      .map(line => line.replace(/\r/g, ''))
      .filter(line => line.trim() !== '')

    if (lines.length < 3) {
      return {
        success: false,
        error: {
          message: 'Invalid table format',
          details: 'Expected at least 3 non-empty lines (header separator, header, data separator)',
        },
      }
    }

    // Find separator lines (e.g., "+----+------+")
    const separatorIndices: number[] = []
    for (let i = 0; i < lines.length; i++) {
      const lineTrim = lines[i].trim()
      // Must start and end with '+', and contain only '+', '-', '=', and spaces
      if (
        lineTrim.startsWith('+')
        && lineTrim.endsWith('+')
        && !/[^+\-=\s]/.test(lineTrim)
      ) {
        separatorIndices.push(i)
      }
    }

    if (separatorIndices.length < 2) {
      return {
        success: false,
        error: {
          message: 'Invalid table format',
          details: 'Missing required separator lines',
        },
      }
    }

    const firstSepIndex = separatorIndices[0]
    const secondSepIndex = separatorIndices[1]

    // ✅ Correct column count calculation by splitting on '+' and filtering empty parts
    const separatorParts = lines[firstSepIndex]
      .trim()
      .split('+')
      .filter(part => part.trim() !== '')
    const columnCount = separatorParts.length

    if (columnCount === 0) {
      return {
        success: false,
        error: {
          message: 'Invalid table format',
          details: 'Cannot determine column count from separator line',
        },
      }
    }

    // Parse header row
    const headerLine = lines[firstSepIndex + 1]
    if (!headerLine || !/^\s*\|/.test(headerLine)) {
      return {
        success: false,
        error: {
          message: 'Invalid table format',
          details: 'Missing or invalid header row',
        },
      }
    }

    const headerParts = headerLine
      .split('|')
      .map(part => part.trim())
      .filter((part, index, array) =>
        index > 0 && index < array.length - 1, // Remove first and last empty parts
      )

    if (headerParts.length !== columnCount) {
      return {
        success: false,
        error: {
          message: 'Header column count mismatch',
          details: `Expected ${columnCount} columns, found ${headerParts.length} in header row`,
          line: firstSepIndex + 2,
        },
      }
    }

    // Reconstruct data rows (handling multi-line cells)
    const dataLines: string[] = []
    let currentRow = ''

    for (let i = secondSepIndex + 1; i < lines.length; i++) {
      const line = lines[i] // <- DO NOT trim here!

      // Check for end of table: line like "+----+------+"
      const trimmedLine = line.trim()
      if (trimmedLine.startsWith('+') && trimmedLine.endsWith('+') && !/[^+\-=\s]/.test(trimmedLine)) {
        break
      }

      // New row starts if the line begins with '|' (after optional whitespace)
      if (/^\s*\|/.test(line)) {
        if (currentRow !== '') {
          dataLines.push(currentRow)
        }
        currentRow = line
      } else if (currentRow !== '') {
        // Continuation of multi-line cell
        currentRow += `\n${line}`
      }
      // Ignore any line before first data row (should not happen)
    }

    if (currentRow !== '') {
      dataLines.push(currentRow)
    }

    // Parse and validate each data row
    const rawRows: string[][] = []
    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i]
      const parts = line
        .split('|')
        .map(part => part.trim())
        .filter((_, index, array) =>
          index > 0 && index < array.length - 1, // Remove first and last empty parts
        )

      if (parts.length !== columnCount) {
        return {
          success: false,
          error: {
            message: 'Data row column count mismatch',
            details: `Expected ${columnCount} columns, found ${parts.length} in row: "${line.trim()}"`,
            line: secondSepIndex + 2 + i,
          },
        }
      }
      rawRows.push(parts)
    }

    // Create column definitions with type inference
    const columns: ColumnDefinition[] = headerParts.map((name, idx) => {
      const colId = generateId()
      // Collect values for this column (only trim, don't convert yet)
      const columnValues = rawRows.map((row) => {
        const rawValue = row[idx]
        // Only convert explicit "NULL" to null, everything else remains string (including empty)
        return rawValue.trim().toLowerCase() === 'null' ? null : rawValue
      })

      const dataType = inferDataType(columnValues)
      return {
        id: colId,
        name,
        originalName: name,
        dataType,
        isPinned: false,
      }
    })

    // Create rows with appropriate type conversion
    const rows: TableRow[] = rawRows.map((rawRow) => {
      const cells: Record<string, CellValue> = {}

      rawRow.forEach((rawValue, colIndex) => {
        const trimmed = rawValue.trim()

        // Only convert explicit "NULL" to null
        if (trimmed.toLowerCase() === 'null') {
          cells[columns[colIndex].id] = null
        } else {
          cells[columns[colIndex].id] = trimmed
        }
      })

      return {
        id: generateId(),
        cells,
      }
    })

    return {
      success: true,
      data: {
        columns,
        rows,
      },
    }
  } catch (err) {
    return {
      success: false,
      error: {
        message: 'Unexpected parsing error',
        details: err instanceof Error ? err.message : String(err),
      },
    }
  }
}
