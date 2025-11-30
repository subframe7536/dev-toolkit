import { describe, expect, it } from 'bun:test'
import * as fc from 'fast-check'

import { getExcelSheetNames, parseExcelFile } from './excel-parser'

describe('parseExcelFile', () => {
  it('should parse a simple Excel file with basic data', async () => {
    // Create a simple Excel file using xlsx library
    const XLSX = await import('xlsx')

    // Create worksheet data
    const data = [
      ['id', 'name', 'age'],
      [1, 'Alice', 30],
      [2, 'Bob', 25],
      [3, 'Charlie', 35],
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')

    // Convert to binary string and then to Blob/File
    const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
    const file = new File([excelBuffer], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

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

    expect(firstRow.cells[col0Id]).toBe('1')
    expect(firstRow.cells[col1Id]).toBe('Alice')
    expect(firstRow.cells[col2Id]).toBe('30')
  })

  it('should handle Excel files with null/empty cells', async () => {
    const XLSX = await import('xlsx')

    const data = [
      ['id', 'name', 'notes'],
      [1, 'Alice', ''],
      [2, '', 'Some note'],
      [3, 'Charlie', null],
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')

    const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
    const file = new File([excelBuffer], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

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
    // Create a file with truly invalid binary content that xlsx can't parse
    const invalidData = new Uint8Array([0xFF, 0xFE, 0xFD, 0xFC, 0xFB])
    const file = new File([invalidData], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const result = await parseExcelFile(file)

    expect(result.success).toBe(false)
    expect(result.error?.message).toBeDefined()
  })

  it('should handle empty sheets', async () => {
    const XLSX = await import('xlsx')

    // Create an empty worksheet
    const worksheet = XLSX.utils.aoa_to_sheet([])
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')

    const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
    const file = new File([excelBuffer], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const result = await parseExcelFile(file)

    expect(result.success).toBe(false)
    expect(result.error?.message).toContain('empty')
  })

  it('should parse the first sheet by default', async () => {
    const XLSX = await import('xlsx')

    // Create workbook with multiple sheets
    const data1 = [['col1'], ['value1']]
    const data2 = [['col2'], ['value2']]

    const worksheet1 = XLSX.utils.aoa_to_sheet(data1)
    const worksheet2 = XLSX.utils.aoa_to_sheet(data2)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet1, 'First')
    XLSX.utils.book_append_sheet(workbook, worksheet2, 'Second')

    const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
    const file = new File([excelBuffer], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const result = await parseExcelFile(file)

    expect(result.success).toBe(true)
    expect(result.data!.columns[0].name).toBe('col1')
    expect(result.data!.rows[0].cells[result.data!.columns[0].id]).toBe('value1')
  })

  it('should support both .xlsx and .xls formats', async () => {
    const XLSX = await import('xlsx')

    const data = [
      ['id', 'name', 'value'],
      [1, 'Test', 100],
      [2, 'Example', 200],
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')

    // Test .xlsx format
    const xlsxBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
    const xlsxFile = new File([xlsxBuffer], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const xlsxResult = await parseExcelFile(xlsxFile)

    expect(xlsxResult.success).toBe(true)
    expect(xlsxResult.data).toBeDefined()
    expect(xlsxResult.data!.columns).toHaveLength(3)
    expect(xlsxResult.data!.rows).toHaveLength(2)

    // Test .xls format
    const xlsBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xls' })
    const xlsFile = new File([xlsBuffer], 'test.xls', {
      type: 'application/vnd.ms-excel',
    })

    const xlsResult = await parseExcelFile(xlsFile)

    expect(xlsResult.success).toBe(true)
    expect(xlsResult.data).toBeDefined()
    expect(xlsResult.data!.columns).toHaveLength(3)
    expect(xlsResult.data!.rows).toHaveLength(2)
  })

  it('should parse a specific sheet by index', async () => {
    const XLSX = await import('xlsx')

    // Create workbook with multiple sheets
    const data1 = [['col1'], ['value1']]
    const data2 = [['col2'], ['value2']]

    const worksheet1 = XLSX.utils.aoa_to_sheet(data1)
    const worksheet2 = XLSX.utils.aoa_to_sheet(data2)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet1, 'First')
    XLSX.utils.book_append_sheet(workbook, worksheet2, 'Second')

    const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
    const file = new File([excelBuffer], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const result = await parseExcelFile(file, 1) // Parse second sheet

    expect(result.success).toBe(true)
    expect(result.data!.columns[0].name).toBe('col2')
    expect(result.data!.rows[0].cells[result.data!.columns[0].id]).toBe('value2')
  })

  it('should handle invalid sheet index', async () => {
    const XLSX = await import('xlsx')

    const data = [['col1'], ['value1']]
    const worksheet = XLSX.utils.aoa_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')

    const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
    const file = new File([excelBuffer], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const result = await parseExcelFile(file, 5) // Invalid index

    expect(result.success).toBe(false)
    expect(result.error?.message).toContain('Invalid sheet index')
  })
})
