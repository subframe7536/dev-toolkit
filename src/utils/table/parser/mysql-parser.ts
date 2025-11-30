import type { CellValue, ColumnDefinition, ParseResult, TableData, TableRow } from '../types'

/**
 * Generate a unique ID for columns and rows
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Extract column positions from a MySQL separator line
 * Returns array of [start, end] positions for each column
 */
function extractColumnPositions(separatorLine: string): Array<[number, number]> {
  const positions: Array<[number, number]> = []
  let start = -1

  for (let i = 0; i < separatorLine.length; i++) {
    const char = separatorLine[i]

    if (char === '+' || char === '|') {
      if (start !== -1) {
        // End of a column
        positions.push([start, i])
      }
      // Start of next column
      start = i
    }
  }

  return positions
}

/**
 * Extract values from a MySQL table line using column positions
 * Trims whitespace from each value
 */
function extractValuesFromLine(
  line: string,
  positions: Array<[number, number]>,
): string[] {
  const values: string[] = []

  for (const [start, end] of positions) {
    // Extract substring between positions
    let value = line.substring(start, end)

    // Remove leading and trailing | characters
    value = value.replace(/^\|/, '').replace(/\|$/, '')

    // Trim whitespace
    value = value.trim()

    values.push(value)
  }

  return values
}

/**
 * Parse MySQL CLI output text into normalized table data
 *
 * MySQL CLI output format:
 * +----+----------+-------+
 * | id | name     | age   |
 * +----+----------+-------+
 * |  1 | Alice    |    30 |
 * |  2 | Bob      |    25 |
 * +----+----------+-------+
 *
 * @param input - MySQL CLI output text
 * @returns ParseResult with success status and data or error
 */
export function parseMySQLOutput(input: string): ParseResult {
  // Validate input
  if (!input || input.trim().length === 0) {
    return {
      success: false,
      error: {
        message: 'Please paste MySQL output text.',
      },
    }
  }

  const lines = input.split('\n').map(line => line.trimEnd())

  // Filter out empty lines
  const nonEmptyLines = lines.filter(line => line.length > 0)

  if (nonEmptyLines.length < 3) {
    return {
      success: false,
      error: {
        message: 'Invalid MySQL output format. Expected table with +---+ borders.',
        details: 'MySQL output should have at least a separator, header, and separator line.',
      },
    }
  }

  // Find separator lines (lines that start with + and contain only +, -, and |)
  const separatorPattern = /^\+[-+|]+\+$/
  const separatorIndices: number[] = []

  nonEmptyLines.forEach((line, index) => {
    if (separatorPattern.test(line)) {
      separatorIndices.push(index)
    }
  })

  if (separatorIndices.length < 2) {
    return {
      success: false,
      error: {
        message: 'Invalid MySQL output format. Expected table with +---+ borders.',
        details: 'Could not find header separator lines.',
      },
    }
  }

  // The header row should be between the first two separator lines
  const firstSeparatorIndex = separatorIndices[0]
  const secondSeparatorIndex = separatorIndices[1]

  if (secondSeparatorIndex - firstSeparatorIndex !== 2) {
    return {
      success: false,
      error: {
        message: 'Invalid MySQL output format. Expected table with +---+ borders.',
        details: 'Header row should be immediately after the first separator.',
      },
    }
  }

  const headerLine = nonEmptyLines[firstSeparatorIndex + 1]
  const firstSeparatorLine = nonEmptyLines[firstSeparatorIndex]

  // Extract column positions from the separator line
  const columnPositions = extractColumnPositions(firstSeparatorLine)

  if (columnPositions.length === 0) {
    return {
      success: false,
      error: {
        message: 'Invalid MySQL output format. Could not determine column positions.',
      },
    }
  }

  // Extract column names from header line
  const columnNames = extractValuesFromLine(headerLine, columnPositions)

  if (columnNames.length === 0) {
    return {
      success: false,
      error: {
        message: 'Invalid MySQL output format. Could not extract column headers.',
      },
    }
  }

  // Create column definitions
  const columns: ColumnDefinition[] = columnNames.map(name => ({
    id: generateId(),
    name,
    originalName: name,
    dataType: 'string', // Will be inferred later
    isPinned: false,
  }))

  // Extract data rows (all lines after the second separator, excluding the last separator if present)
  const dataStartIndex = secondSeparatorIndex + 1
  const rows: TableRow[] = []

  for (let i = dataStartIndex; i < nonEmptyLines.length; i++) {
    const line = nonEmptyLines[i]

    // Skip separator lines
    if (separatorPattern.test(line)) {
      continue
    }

    // Check if line looks like a data row (starts with |)
    if (!line.startsWith('|')) {
      return {
        success: false,
        error: {
          message: `Malformed row at line ${i + 1}. Expected row to start with '|'.`,
          line: i + 1,
        },
      }
    }

    // Check if line has enough pipes for the expected columns
    const pipeCount = (line.match(/\|/g) || []).length
    const expectedPipes = columnNames.length + 1 // One more pipe than columns
    if (pipeCount < expectedPipes) {
      return {
        success: false,
        error: {
          message: `Row ${rows.length + 1} has mismatched column count. Expected ${columnNames.length}, got ${pipeCount - 1}.`,
          line: i + 1,
        },
      }
    }

    // Extract cell values
    const cellValues = extractValuesFromLine(line, columnPositions)

    if (cellValues.length !== columnNames.length) {
      return {
        success: false,
        error: {
          message: `Row ${rows.length + 1} has mismatched column count. Expected ${columnNames.length}, got ${cellValues.length}.`,
          line: i + 1,
        },
      }
    }

    // Create row with cells mapped to column IDs
    const cells: Record<string, CellValue> = {}
    columns.forEach((col, index) => {
      cells[col.id] = cellValues[index]
    })

    rows.push({
      id: generateId(),
      cells,
    })
  }

  const tableData: TableData = {
    columns,
    rows,
  }

  return {
    success: true,
    data: tableData,
  }
}
