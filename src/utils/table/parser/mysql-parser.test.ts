import type { TableData } from '../types'

import { describe, expect, it } from 'bun:test'
import * as fc from 'fast-check'

import { parseMySQLOutput } from './mysql-parser'

describe('parseMySQLOutput', () => {
  it('should parse valid MySQL output with basic data', () => {
    const input = `+----+----------+-------+
| id | name     | age   |
+----+----------+-------+
|  1 | Alice    |    30 |
|  2 | Bob      |    25 |
+----+----------+-------+`

    const result = parseMySQLOutput(input)

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.data!.columns).toHaveLength(3)
    expect(result.data!.rows).toHaveLength(2)

    // Check column names
    expect(result.data!.columns[0].name).toBe('id')
    expect(result.data!.columns[1].name).toBe('name')
    expect(result.data!.columns[2].name).toBe('age')

    // Check first row data
    const firstRow = result.data!.rows[0]
    const col0Id = result.data!.columns[0].id
    const col1Id = result.data!.columns[1].id
    const col2Id = result.data!.columns[2].id

    expect(firstRow.cells[col0Id]).toBe('1')
    expect(firstRow.cells[col1Id]).toBe('Alice')
    expect(firstRow.cells[col2Id]).toBe('30')

    // Check second row data
    const secondRow = result.data!.rows[1]
    expect(secondRow.cells[col0Id]).toBe('2')
    expect(secondRow.cells[col1Id]).toBe('Bob')
    expect(secondRow.cells[col2Id]).toBe('25')
  })

  it('should handle empty input', () => {
    const result = parseMySQLOutput('')

    expect(result.success).toBe(false)
    expect(result.error?.message).toBe('Invalid table format')
  })

  it('should handle whitespace-only input', () => {
    const result = parseMySQLOutput('   \n  \n  ')

    expect(result.success).toBe(false)
    expect(result.error?.message).toBe('Invalid table format')
  })

  it('should handle invalid format without separators', () => {
    const input = `id | name | age
1 | Alice | 30
2 | Bob | 25`

    const result = parseMySQLOutput(input)

    expect(result.success).toBe(false)
    expect(result.error?.message).toContain('Invalid table format')
  })

  it('should handle special characters in cell values', () => {
    const input = `+----+----------+-------+
| id | name     | email |
+----+----------+-------+
|  1 | O'Brien  | a@b.c |
|  2 | Smith&Co | x@y.z |
+----+----------+-------+`

    const result = parseMySQLOutput(input)

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()

    const col1Id = result.data!.columns[1].id
    const col2Id = result.data!.columns[2].id

    expect(result.data!.rows[0].cells[col1Id]).toBe('O\'Brien')
    expect(result.data!.rows[0].cells[col2Id]).toBe('a@b.c')
    expect(result.data!.rows[1].cells[col1Id]).toBe('Smith&Co')
  })

  it('should handle empty cells', () => {
    const input = `+----+----------+-------+
| id | name     | notes |
+----+----------+-------+
|  1 | Alice    |       |
|  2 |          | test  |
+----+----------+-------+`

    const result = parseMySQLOutput(input)

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()

    const col1Id = result.data!.columns[1].id
    const col2Id = result.data!.columns[2].id

    expect(result.data!.rows[0].cells[col2Id]).toBe('')
    expect(result.data!.rows[1].cells[col1Id]).toBe('')
  })

  it('should handle mismatched column count', () => {
    // This input has a row with only 2 pipes (1 column) instead of 3 columns
    const input = `+----+----------+-------+
| id | name     | age   |
+----+----------+-------+
|  1 | Alice    |    30 |
|  2 | Bob
+----+----------+-------+`

    const result = parseMySQLOutput(input)

    expect(result.success).toBe(false)
    expect(result.error?.message).toContain('Data row column count mismatch')
  })

  it('should preserve whitespace within cell values', () => {
    const input = `+----+---------------+
| id | description   |
+----+---------------+
|  1 | Hello  World  |
+----+---------------+`

    const result = parseMySQLOutput(input)

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()

    const col1Id = result.data!.columns[1].id
    expect(result.data!.rows[0].cells[col1Id]).toBe('Hello  World')
  })
})

describe('parseMySQLOutput - Property-Based Tests', () => {
  /**
   * Property 1: MySQL header extraction completeness
   * For any valid MySQL CLI output, parsing should extract all column headers
   * that appear in the header row, preserving their names exactly.
   * Validates: Requirements 1.1
   */
  it('Property 1: should extract all column headers preserving their names exactly', () => {
    // Generator for valid column names (alphanumeric, underscores, spaces)
    const columnNameArb = fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z][\w ]*$/i.test(s))

    // Generator for a list of 1-10 column names
    const columnNamesArb = fc.array(columnNameArb, { minLength: 1, maxLength: 10 })

    // Generator for valid MySQL output with arbitrary column names
    const mysqlOutputArb = columnNamesArb.map((columnNames) => {
      // Calculate column widths (at least as wide as the column name + 2 for padding)
      const columnWidths = columnNames.map(name => Math.max(name.length + 2, 4))

      // Build separator line
      const separatorParts = columnWidths.map(width => '-'.repeat(width))
      const separator = `+${separatorParts.join('+')}+`

      // Build header line with proper padding
      const headerParts = columnNames.map((name, i) => {
        const width = columnWidths[i]
        const padding = width - name.length
        const leftPad = Math.floor(padding / 2)
        const rightPad = padding - leftPad
        return ' '.repeat(leftPad) + name + ' '.repeat(rightPad)
      })
      const header = `|${headerParts.join('|')}|`

      // Build a simple data row (optional, but makes it more realistic)
      const dataParts = columnWidths.map((width) => {
        const value = '1'
        const padding = width - value.length
        const leftPad = Math.floor(padding / 2)
        const rightPad = padding - leftPad
        return ' '.repeat(leftPad) + value + ' '.repeat(rightPad)
      })
      const dataRow = `|${dataParts.join('|')}|`

      return {
        columnNames,
        output: `${separator}\n${header}\n${separator}\n${dataRow}\n${separator}`,
      }
    })

    fc.assert(
      fc.property(mysqlOutputArb, ({ columnNames, output }) => {
        const result = parseMySQLOutput(output)

        // The parse should succeed
        expect(result.success).toBe(true)
        expect(result.data).toBeDefined()

        // Should extract exactly the same number of columns
        expect(result.data!.columns).toHaveLength(columnNames.length)

        // Each column name should be preserved exactly (after trimming)
        result.data!.columns.forEach((col, index) => {
          expect(col.name).toBe(columnNames[index].trim())
          expect(col.originalName).toBe(columnNames[index].trim())
        })
      }),
      { numRuns: 100 },
    )
  })

  /**
   * Property 2: MySQL data preservation
   * For any valid MySQL CLI output, parsing should extract all cell values without modification,
   * maintaining the exact content from the original output.
   * Validates: Requirements 1.2
   */
  it('Property 2: should preserve all cell values exactly as they appear in the input', () => {
    // Generator for valid column names
    const columnNameArb = fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z]\w*$/i.test(s))

    // Generator for cell values that can appear in MySQL output
    // Include various types: numbers, strings with special chars, empty strings, etc.
    const cellValueArb = fc.oneof(
      fc.integer({ min: -999999, max: 999999 }).map(String), // Numbers
      fc.string({ minLength: 0, maxLength: 30 }).filter(s => /^[a-z0-9 ]*$/i.test(s)), // Alphanumeric with spaces
      fc.string({ minLength: 0, maxLength: 20 }).filter(s => /^[\w@.\-'&]*$/.test(s)), // Special characters common in data
      fc.constant(''), // Empty strings
      fc.string({ minLength: 2, maxLength: 15 }).filter(s => /^[a-z ]+$/i.test(s)), // Words with spaces
    )

    // Generator for a table structure with columns and rows
    const tableStructureArb = fc
      .tuple(
        fc.array(columnNameArb, { minLength: 1, maxLength: 8 }), // Column names
        fc.array(
          fc.array(cellValueArb, { minLength: 1, maxLength: 8 }), // Rows of cell values
          { minLength: 1, maxLength: 10 },
        ),
      )
      .chain(([columnNames, rowsData]) => {
        // Ensure each row has the same number of cells as columns
        const normalizedRows = rowsData.map(row =>
          row.slice(0, columnNames.length).concat(
            Array.from({ length: Math.max(0, columnNames.length - row.length) }).fill('') as string[],
          ),
        )
        return fc.constant({ columnNames, rows: normalizedRows })
      })

    // Generator for complete MySQL output
    const mysqlOutputArb = tableStructureArb.map(({ columnNames, rows }) => {
      // Calculate column widths based on content
      const columnWidths = columnNames.map((name, colIndex) => {
        const maxDataWidth = Math.max(
          ...rows.map(row => row[colIndex].length),
          name.length,
        )
        return Math.max(maxDataWidth + 2, 4) // At least 4 chars wide, +2 for padding
      })

      // Build separator line
      const separatorParts = columnWidths.map(width => '-'.repeat(width))
      const separator = `+${separatorParts.join('+')}+`

      // Build header line
      const headerParts = columnNames.map((name, i) => {
        const width = columnWidths[i]
        const padding = width - name.length
        const leftPad = Math.floor(padding / 2)
        const rightPad = padding - leftPad
        return ' '.repeat(leftPad) + name + ' '.repeat(rightPad)
      })
      const header = `|${headerParts.join('|')}|`

      // Build data rows
      const dataRows = rows.map((row) => {
        const rowParts = row.map((value, i) => {
          const width = columnWidths[i]
          const padding = width - value.length
          const leftPad = Math.floor(padding / 2)
          const rightPad = padding - leftPad
          return ' '.repeat(leftPad) + value + ' '.repeat(rightPad)
        })
        return `|${rowParts.join('|')}|`
      })

      const output = [separator, header, separator, ...dataRows, separator].join('\n')

      return { columnNames, rows, output }
    })

    fc.assert(
      fc.property(mysqlOutputArb, ({ rows, output }) => {
        const result = parseMySQLOutput(output)

        // The parse should succeed
        expect(result.success).toBe(true)
        expect(result.data).toBeDefined()

        // Should have the correct number of rows
        expect(result.data!.rows).toHaveLength(rows.length)

        // Verify each cell value is preserved exactly
        result.data!.rows.forEach((parsedRow, rowIndex) => {
          const originalRow = rows[rowIndex]

          result.data!.columns.forEach((col, colIndex) => {
            const parsedValue = parsedRow.cells[col.id]
            const originalValue = originalRow[colIndex]

            // Cell values should be preserved exactly (trimmed, as MySQL output has padding)
            expect(String(parsedValue)).toBe(originalValue.trim())
          })
        })
      }),
      { numRuns: 100 },
    )
  })
})

/**
 * Helper to validate parsed table structure
 */
function validateTable(
  result: ReturnType<typeof parseMySQLOutput>,
  expectedRows: number,
  expectedCols: number,
  cellChecks: (data: TableData) => void,
) {
  expect(result.success).toBe(true)
  expect(result.data).toBeDefined()

  const data = result.data!
  expect(data.columns).toHaveLength(expectedCols)
  expect(data.rows).toHaveLength(expectedRows)

  cellChecks(data)
}

describe('MySQL ASCII Table Parser – Multi-line Cell Support', () => {
  it('should correctly parse a cell containing a single newline', () => {
    const input = `+----+---------------+
| id | description   |
+----+---------------+
|  1 | Line1
Line2 |
|  2 | Normal        |
+----+---------------+`

    const result = parseMySQLOutput(input)

    validateTable(result, 2, 2, (data) => {
      const row0 = data.rows[0]
      const descCol = data.columns.find(c => c.name === 'description')!

      // The cell should contain the literal newline
      expect(row0.cells[descCol.id]).toBe('Line1\nLine2')

      // Second row should be unaffected
      const row1 = data.rows[1]
      expect(row1.cells[descCol.id]).toBe('Normal')
    })
  })

  it('should handle multiple newlines in a single cell', () => {
    const input = `+----+------------------+
| id | notes            |
+----+------------------+
| 10 | First line
Second line
Third line |
| 20 | OK               |
+----+------------------+`

    const result = parseMySQLOutput(input)

    validateTable(result, 2, 2, (data) => {
      const notesCol = data.columns.find(c => c.name === 'notes')!
      const value = data.rows[0].cells[notesCol.id] as string

      expect(value).toBe('First line\nSecond line\nThird line')
    })
  })

  it('should parse a table where the first cell has a newline', () => {
    const input = `+------------------+------+
| message          | code |
+------------------+------+
| Start
Middle
End | 200  |
| OK               | 201  |
+------------------+------+`

    const result = parseMySQLOutput(input)

    validateTable(result, 2, 2, (data) => {
      const msgCol = data.columns.find(c => c.name === 'message')!
      expect(data.rows[0].cells[msgCol.id]).toBe('Start\nMiddle\nEnd')
      expect(data.rows[1].cells[msgCol.id]).toBe('OK')
    })
  })

  it('should handle empty lines within a cell', () => {
    const input = `+----+--------------+
| id | content      |
+----+--------------+
|  1 | Text

Blank line above |
|  2 | Simple       |
+----+--------------+`

    const result = parseMySQLOutput(input)

    validateTable(result, 2, 2, (data) => {
      const contentCol = data.columns.find(c => c.name === 'content')!
      const value = data.rows[0].cells[contentCol.id] as string

      // Note: MySQL CLI usually preserves the blank line as an empty line
      expect(value).toBe('Text\n\nBlank line above')
    })
  })

  it('should not trim internal whitespace or newlines', () => {
    const input = `+----+------------------+
| id | spaced           |
+----+------------------+
|  1 |  A
 B  |
|  2 |   C   |
+----+------------------+`

    const result = parseMySQLOutput(input)

    validateTable(result, 2, 2, (data) => {
      const col = data.columns.find(c => c.name === 'spaced')!
      // Only leading/trailing spaces (from MySQL padding) are trimmed
      // Internal spaces and newlines are preserved
      expect(data.rows[0].cells[col.id]).toBe('A\n B')
      expect(data.rows[1].cells[col.id]).toBe('C')
    })
  })
})
