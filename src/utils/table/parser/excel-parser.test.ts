import { describe, expect, it } from 'vitest'

import { parseExcelFile } from './excel-parser'

type FixtureCell = string | number | boolean | Date | null

async function createExcelFile(
  sheets: Array<{ name: string; rows: FixtureCell[][] }>,
  fileName = 'test.xlsx',
): Promise<File> {
  const { writeXlsx } = await import('hucre/xlsx')
  const buffer = await writeXlsx({ sheets })
  return new File([new Uint8Array(buffer)], fileName, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

describe('parseExcelFile', () => {
  it('should parse a simple Excel file with basic data', async () => {
    const file = await createExcelFile([
      {
        name: 'Sheet1',
        rows: [
          ['id', 'name', 'age'],
          [1, 'Alice', 30],
          [2, 'Bob', 25],
          [3, 'Charlie', 35],
        ],
      },
    ])

    // Parse the file
    const result = await parseExcelFile(file)

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.data!.columns).toHaveLength(3)
    expect(result.data!.rows).toHaveLength(3)

    // Check column names
    expect(result.data!.columns[0].name).toBe('id')
    expect(result.data!.columns[1].name).toBe('name')
    expect(result.data!.columns[2].name).toBe('age')

    // Check first row data
    const firstRow = result.data!.rows[0]
    const col0Id = result.data!.columns[0].id
    const col1Id = result.data!.columns[1].id
    const col2Id = result.data!.columns[2].id

    expect(firstRow.cells[col0Id]).toBe(1)
    expect(firstRow.cells[col1Id]).toBe('Alice')
    expect(firstRow.cells[col2Id]).toBe(30)
  })

  it('should handle Excel files with null/empty cells', async () => {
    const file = await createExcelFile([
      {
        name: 'Sheet1',
        rows: [
          ['id', 'name', 'notes'],
          [1, 'Alice', ''],
          [2, '', 'Some note'],
          [3, 'Charlie', null],
        ],
      },
    ])

    const result = await parseExcelFile(file)

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()

    const col1Id = result.data!.columns[1].id
    const col2Id = result.data!.columns[2].id

    // Check empty/null cells are handled
    expect(result.data!.rows[0].cells[col2Id]).toBe(null)
    expect(result.data!.rows[1].cells[col1Id]).toBe(null)
    expect(result.data!.rows[2].cells[col2Id]).toBe(null)
  })

  it('should reject unsupported file formats', async () => {
    const file = new File(['not an excel file'], 'test.txt', { type: 'text/plain' })

    const result = await parseExcelFile(file)

    expect(result.success).toBe(false)
    expect(result.error?.message).toContain('Unsupported file format')
  })

  it('should handle corrupted Excel files', async () => {
    // Create a file with truly invalid binary content that can't be parsed
    const invalidData = new Uint8Array([0xff, 0xfe, 0xfd, 0xfc, 0xfb])
    const file = new File([invalidData], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const result = await parseExcelFile(file)

    expect(result.success).toBe(false)
    expect(result.error?.message).toBeDefined()
  })

  it('should handle empty sheets', async () => {
    const file = await createExcelFile([{ name: 'Sheet1', rows: [] }])

    const result = await parseExcelFile(file)

    expect(result.success).toBe(false)
    expect(result.error?.message).toContain('empty')
  })

  it('should parse the first sheet by default', async () => {
    const file = await createExcelFile([
      { name: 'First', rows: [['col1'], ['value1']] },
      { name: 'Second', rows: [['col2'], ['value2']] },
    ])

    const result = await parseExcelFile(file)

    expect(result.success).toBe(true)
    expect(result.data!.columns[0].name).toBe('col1')
    expect(result.data!.rows[0].cells[result.data!.columns[0].id]).toBe('value1')
  })

  it('should format date cells with the default date format', async () => {
    const file = await createExcelFile([
      {
        name: 'Sheet1',
        rows: [
          ['id', 'created'],
          [1, new Date(Date.UTC(2024, 0, 15, 9, 30, 0))],
        ],
      },
    ])

    const result = await parseExcelFile(file)

    expect(result.success).toBe(true)
    const col1Id = result.data!.columns[1].id
    expect(result.data!.rows[0].cells[col1Id]).toBe('2024-01-15 09:30:00')
  })

  it('should format date cells with a custom date format', async () => {
    const file = await createExcelFile([
      {
        name: 'Sheet1',
        rows: [
          ['id', 'created'],
          [1, new Date(Date.UTC(2024, 0, 15, 9, 30, 0))],
        ],
      },
    ])

    const result = await parseExcelFile(file, 0, true, 'MM/DD/YYYY')

    expect(result.success).toBe(true)
    const col1Id = result.data!.columns[1].id
    expect(result.data!.rows[0].cells[col1Id]).toBe('01/15/2024')
  })

  it('should parse a specific sheet by index', async () => {
    const file = await createExcelFile([
      { name: 'First', rows: [['col1'], ['value1']] },
      { name: 'Second', rows: [['col2'], ['value2']] },
    ])

    const result = await parseExcelFile(file, 1) // Parse second sheet
    expect(result.success).toBe(true)
    expect(result.data!.columns[0].name).toBe('col2')
    expect(result.data!.rows[0].cells[result.data!.columns[0].id]).toBe('value2')
  })

  it('should handle invalid sheet index', async () => {
    const file = await createExcelFile([{ name: 'Sheet1', rows: [['col1'], ['value1']] }])

    const result = await parseExcelFile(file, 5) // Invalid index

    expect(result.success).toBe(false)
    expect(result.error?.message).toContain('Invalid sheet index')
  })
})
