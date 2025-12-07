import type { CellValue, TableData } from './types'

import { describe, expect, test } from 'bun:test'

import * as fc from 'fast-check'

import {
  applySnakeCaseToColumns,
  convertToSnakeCase,
  reorderColumns,
  sortByColumn,
  toggleColumnPin,
  updateCell,
} from './operations'

// Helper to create test table data
function createTestTable(): TableData {
  return {
    columns: [
      {
        id: 'col1',
        name: 'Name',
        originalName: 'Name',
        dataType: 'string',
        isPinned: false,
      },
      {
        id: 'col2',
        name: 'Age',
        originalName: 'Age',
        dataType: 'integer',
        isPinned: false,
      },
      {
        id: 'col3',
        name: 'City',
        originalName: 'City',
        dataType: 'string',
        isPinned: false,
      },
    ],
    rows: [
      {
        id: 'row1',
        cells: { col1: 'Alice', col2: 30, col3: 'NYC' },
      },
      {
        id: 'row2',
        cells: { col1: 'Bob', col2: 25, col3: 'LA' },
      },
      {
        id: 'row3',
        cells: { col1: 'Charlie', col2: 35, col3: 'Chicago' },
      },
    ],
  }
}

describe('reorderColumns', () => {
  test('should reorder columns from source to target index', () => {
    const table = createTestTable()
    const result = reorderColumns(table, 0, 2)

    expect(result.columns[0].id).toBe('col2')
    expect(result.columns[1].id).toBe('col3')
    expect(result.columns[2].id).toBe('col1')
    expect(result.rows).toEqual(table.rows) // Rows unchanged
  })

  test('should handle same source and target index', () => {
    const table = createTestTable()
    const result = reorderColumns(table, 1, 1)

    expect(result.columns).toEqual(table.columns)
  })

  test('should throw error for invalid source index', () => {
    const table = createTestTable()
    expect(() => reorderColumns(table, -1, 0)).toThrow('Invalid source index')
    expect(() => reorderColumns(table, 5, 0)).toThrow('Invalid source index')
  })

  test('should throw error for invalid target index', () => {
    const table = createTestTable()
    expect(() => reorderColumns(table, 0, -1)).toThrow('Invalid target index')
    expect(() => reorderColumns(table, 0, 5)).toThrow('Invalid target index')
  })

  /**
   * Feature: table-editor, Property 6: Column reordering preserves data integrity
   * Validates: Requirements 3.2, 3.3, 3.4
   *
   * For any table data and any valid source and target column indices,
   * reordering a column should preserve all cell values and their associations
   * with the correct rows. Each row's data should remain intact with cells
   * moving together with their column.
   */
  test('property: column reordering preserves data integrity', () => {
    // Generator for column definitions
    const columnArb = fc.record({
      id: fc.stringMatching(/^col\d+$/),
      name: fc.string({ minLength: 1, maxLength: 20 }),
      originalName: fc.string({ minLength: 1, maxLength: 20 }),
      dataType: fc.constantFrom('string', 'integer', 'decimal', 'boolean'),
      isPinned: fc.boolean(),
      sortDirection: fc.option(fc.constantFrom('asc', 'desc'), { nil: undefined }),
    })

    // Generator for cell values
    const cellValueArb = fc.oneof(
      fc.string(),
      fc.integer(),
      fc.double(),
      fc.boolean(),
      fc.constant(null),
    )

    // Generator for table data with at least 2 columns and 1 row
    const tableDataArb = fc.tuple(
      fc.array(columnArb, { minLength: 2, maxLength: 10 }),
      fc.integer({ min: 1, max: 20 }),
    ).chain(([columns, numRows]) => {
      // Ensure unique column IDs
      const uniqueColumns = columns.map((col, idx) => ({
        ...col,
        id: `col${idx}`,
      }))

      // Generate rows with cells for each column
      const rowsArb = fc.array(
        fc.record({
          id: fc.stringMatching(/^row\d+$/),
          cells: fc.record(
            Object.fromEntries(
              uniqueColumns.map(col => [col.id, cellValueArb]),
            ),
          ),
        }),
        { minLength: numRows, maxLength: numRows },
      ).map(rows =>
        rows.map((row, rowIdx) => ({
          ...row,
          id: `row${rowIdx}`,
        })),
      )

      return fc.record({
        columns: fc.constant(uniqueColumns),
        rows: rowsArb,
      })
    })

    fc.assert(
      fc.property(
        tableDataArb,
        fc.integer({ min: 0, max: 9 }),
        fc.integer({ min: 0, max: 9 }),
        (tableData: TableData, sourceIdx: number, targetIdx: number) => {
          // Constrain indices to valid range
          const numColumns = tableData.columns.length
          if (sourceIdx >= numColumns || targetIdx >= numColumns) {
            return true // Skip invalid indices
          }

          // Store original row data for verification
          const originalRowData = tableData.rows.map(row => ({
            id: row.id,
            cells: { ...row.cells },
          }))

          // Perform reordering
          const result = reorderColumns(tableData, sourceIdx, targetIdx)

          // Property 1: All rows should still exist with same IDs
          expect(result.rows.length).toBe(tableData.rows.length)
          expect(result.rows.map(r => r.id).sort()).toEqual(
            tableData.rows.map(r => r.id).sort(),
          )

          // Property 2: Each row should preserve all its cell values
          for (let i = 0; i < result.rows.length; i++) {
            const originalRow = originalRowData.find(r => r.id === result.rows[i].id)
            expect(originalRow).toBeDefined()

            // Check that all cell values are preserved
            for (const columnId of Object.keys(originalRow!.cells)) {
              expect(result.rows[i].cells[columnId]).toEqual(originalRow!.cells[columnId])
            }
          }

          // Property 3: Column count should remain the same
          expect(result.columns.length).toBe(tableData.columns.length)

          // Property 4: All columns should still exist (just reordered)
          const originalColumnIds = tableData.columns.map(c => c.id).sort()
          const resultColumnIds = result.columns.map(c => c.id).sort()
          expect(resultColumnIds).toEqual(originalColumnIds)

          // Property 5: The moved column should be at the target position
          expect(result.columns[targetIdx].id).toBe(tableData.columns[sourceIdx].id)

          return true
        },
      ),
      { numRuns: 100 },
    )
  })
})

describe('sortByColumn', () => {
  test('should sort rows by string column in ascending order', () => {
    const table = createTestTable()
    const result = sortByColumn(table, 'col1', 'asc')

    expect(result.rows[0].cells.col1).toBe('Alice')
    expect(result.rows[1].cells.col1).toBe('Bob')
    expect(result.rows[2].cells.col1).toBe('Charlie')
    expect(result.columns.find(c => c.id === 'col1')?.sortDirection).toBe('asc')
  })

  test('should sort rows by number column in descending order', () => {
    const table = createTestTable()
    const result = sortByColumn(table, 'col2', 'desc')

    expect(result.rows[0].cells.col2).toBe(35)
    expect(result.rows[1].cells.col2).toBe(30)
    expect(result.rows[2].cells.col2).toBe(25)
    expect(result.columns.find(c => c.id === 'col2')?.sortDirection).toBe('desc')
  })

  test('should handle null values by sorting them to the end', () => {
    const table = createTestTable()
    table.rows[1].cells.col2 = null

    const result = sortByColumn(table, 'col2', 'asc')

    expect(result.rows[0].cells.col2).toBe(30)
    expect(result.rows[1].cells.col2).toBe(35)
    expect(result.rows[2].cells.col2).toBe(null)
  })

  test('should clear sort direction from other columns', () => {
    const table = createTestTable()
    table.columns[0].sortDirection = 'asc'

    const result = sortByColumn(table, 'col2', 'desc')

    expect(result.columns.find(c => c.id === 'col1')?.sortDirection).toBeUndefined()
    expect(result.columns.find(c => c.id === 'col2')?.sortDirection).toBe('desc')
  })

  test('should throw error for non-existent column', () => {
    const table = createTestTable()
    expect(() => sortByColumn(table, 'invalid', 'asc')).toThrow('Column not found')
  })

  /**
   * Feature: table-editor, Property 7: Sorting preserves row integrity
   * Validates: Requirements 4.1, 4.4
   *
   * For any table data and any column, sorting by that column should reorder
   * rows while preserving the integrity of each row's data across all columns.
   * After sorting, each row should still contain the same set of cell values
   * it had before sorting.
   */
  test('property: sorting preserves row integrity', () => {
    // Generator for column definitions
    const columnArb = fc.record({
      id: fc.stringMatching(/^col\d+$/),
      name: fc.string({ minLength: 1, maxLength: 20 }),
      originalName: fc.string({ minLength: 1, maxLength: 20 }),
      dataType: fc.constantFrom('string', 'integer', 'decimal', 'boolean'),
      isPinned: fc.boolean(),
      sortDirection: fc.option(fc.constantFrom('asc', 'desc'), { nil: undefined }),
    })

    // Generator for cell values (excluding NaN which doesn't sort properly)
    const cellValueArb = fc.oneof(
      fc.string(),
      fc.integer(),
      fc.double().filter(n => !Number.isNaN(n)),
      fc.boolean(),
      fc.constant(null),
    )

    // Generator for table data with at least 1 column and 2 rows
    const tableDataArb = fc.tuple(
      fc.array(columnArb, { minLength: 1, maxLength: 10 }),
      fc.integer({ min: 2, max: 20 }),
    ).chain(([columns, numRows]) => {
      // Ensure unique column IDs
      const uniqueColumns = columns.map((col, idx) => ({
        ...col,
        id: `col${idx}`,
      }))

      // Generate rows with cells for each column
      const rowsArb = fc.array(
        fc.record({
          id: fc.stringMatching(/^row\d+$/),
          cells: fc.record(
            Object.fromEntries(
              uniqueColumns.map(col => [col.id, cellValueArb]),
            ),
          ),
        }),
        { minLength: numRows, maxLength: numRows },
      ).map(rows =>
        rows.map((row, rowIdx) => ({
          ...row,
          id: `row${rowIdx}`,
        })),
      )

      return fc.record({
        columns: fc.constant(uniqueColumns),
        rows: rowsArb,
      })
    })

    fc.assert(
      fc.property(
        tableDataArb,
        fc.constantFrom('asc', 'desc'),
        (tableData: TableData, direction: 'asc' | 'desc') => {
          // Pick a random column to sort by
          if (tableData.columns.length === 0) {
            return true // Skip empty tables
          }

          const columnToSort = tableData.columns[0] // Use first column for consistency

          // Store original row data for verification
          const originalRowData = new Map(
            tableData.rows.map(row => [
              row.id,
              { ...row.cells },
            ]),
          )

          // Perform sorting
          const result = sortByColumn(tableData, columnToSort.id, direction)

          // Property 1: All rows should still exist with same IDs
          expect(result.rows.length).toBe(tableData.rows.length)
          const resultRowIds = new Set(result.rows.map(r => r.id))
          const originalRowIds = new Set(tableData.rows.map(r => r.id))
          expect(resultRowIds).toEqual(originalRowIds)

          // Property 2: Each row should preserve all its cell values
          for (const resultRow of result.rows) {
            const originalCells = originalRowData.get(resultRow.id)
            expect(originalCells).toBeDefined()

            // Check that all cell values are preserved
            for (const columnId of Object.keys(originalCells!)) {
              expect(resultRow.cells[columnId]).toEqual(originalCells![columnId])
            }

            // Check that no extra cells were added
            expect(Object.keys(resultRow.cells).sort()).toEqual(
              Object.keys(originalCells!).sort(),
            )
          }

          // Property 3: Column count and IDs should remain the same
          expect(result.columns.length).toBe(tableData.columns.length)
          expect(result.columns.map(c => c.id).sort()).toEqual(
            tableData.columns.map(c => c.id).sort(),
          )

          // Property 4: The sorted column should have the correct sort direction
          const sortedColumn = result.columns.find(c => c.id === columnToSort.id)
          expect(sortedColumn?.sortDirection).toBe(direction)

          // Property 5: Verify rows are actually sorted by the column
          // (excluding null values which should be at the end)
          const nonNullRows = result.rows.filter(row => row.cells[columnToSort.id] !== null)
          for (let i = 0; i < nonNullRows.length - 1; i++) {
            const currentValue = nonNullRows[i].cells[columnToSort.id]
            const nextValue = nonNullRows[i + 1].cells[columnToSort.id]

            if (currentValue !== null && nextValue !== null) {
              let comparison = 0
              if (typeof currentValue === 'number' && typeof nextValue === 'number') {
                comparison = currentValue - nextValue
              } else if (typeof currentValue === 'boolean' && typeof nextValue === 'boolean') {
                comparison = (currentValue === nextValue) ? 0 : currentValue ? 1 : -1
              } else {
                comparison = String(currentValue).localeCompare(String(nextValue))
              }

              if (direction === 'asc') {
                expect(comparison).toBeLessThanOrEqual(0)
              } else {
                expect(comparison).toBeGreaterThanOrEqual(0)
              }
            }
          }

          return true
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: table-editor, Property 8: Sort direction toggle
   * Validates: Requirements 4.2
   *
   * For any table data and any column, sorting by a column twice consecutively
   * should produce the reverse order of rows compared to sorting once.
   */
  test('property: sort direction toggle', () => {
    // Generator for a single type of cell value (to ensure consistent column types)
    const typedCellValueArb = fc.oneof(
      // String column
      fc.tuple(
        fc.constant('string' as const),
        fc.array(fc.oneof(fc.string(), fc.constant(null)), { minLength: 2, maxLength: 20 }),
      ),
      // Integer column
      fc.tuple(
        fc.constant('integer' as const),
        fc.array(fc.oneof(fc.integer(), fc.constant(null)), { minLength: 2, maxLength: 20 }),
      ),
      // Decimal column
      fc.tuple(
        fc.constant('decimal' as const),
        fc.array(
          fc.oneof(fc.double().filter(n => !Number.isNaN(n)), fc.constant(null)),
          { minLength: 2, maxLength: 20 },
        ),
      ),
      // Boolean column
      fc.tuple(
        fc.constant('boolean' as const),
        fc.array(fc.oneof(fc.boolean(), fc.constant(null)), { minLength: 2, maxLength: 20 }),
      ),
    )

    // Generator for table data with a single column of consistent type
    const tableDataArb = typedCellValueArb.map(([dataType, cellValues]) => {
      const column = {
        id: 'col0',
        name: 'TestColumn',
        originalName: 'TestColumn',
        dataType,
        isPinned: false,
        sortDirection: undefined as 'asc' | 'desc' | undefined,
      }

      const rows = cellValues.map((value, idx) => ({
        id: `row${idx}`,
        cells: { col0: value },
      }))

      return {
        columns: [column],
        rows,
      } as TableData
    })

    fc.assert(
      fc.property(
        tableDataArb,
        (tableData: TableData) => {
          const columnToSort = tableData.columns[0]

          // Sort ascending first
          const sortedAsc = sortByColumn(tableData, columnToSort.id, 'asc')

          // Sort descending (toggle)
          const sortedDesc = sortByColumn(tableData, columnToSort.id, 'desc')

          // Property 1: The sort direction should be set correctly
          const ascColumn = sortedAsc.columns.find(c => c.id === columnToSort.id)
          const descColumn = sortedDesc.columns.find(c => c.id === columnToSort.id)

          expect(ascColumn?.sortDirection).toBe('asc')
          expect(descColumn?.sortDirection).toBe('desc')

          // Property 2: Null values should be at the end in both cases
          const ascNullRows = sortedAsc.rows.filter(row => row.cells[columnToSort.id] === null)
          const descNullRows = sortedDesc.rows.filter(row => row.cells[columnToSort.id] === null)

          if (ascNullRows.length > 0) {
            const ascLastRows = sortedAsc.rows.slice(-ascNullRows.length)
            for (const row of ascLastRows) {
              expect(row.cells[columnToSort.id]).toBe(null)
            }
          }

          if (descNullRows.length > 0) {
            const descLastRows = sortedDesc.rows.slice(-descNullRows.length)
            for (const row of descLastRows) {
              expect(row.cells[columnToSort.id]).toBe(null)
            }
          }

          // Property 3: For distinct values, the order should be reversed
          // Group rows by their cell value to identify distinct values
          const ascNonNullRows = sortedAsc.rows.filter(row => row.cells[columnToSort.id] !== null)
          const descNonNullRows = sortedDesc.rows.filter(row => row.cells[columnToSort.id] !== null)

          // Get unique values in ascending order
          const uniqueValues = Array.from(
            new Set(ascNonNullRows.map(row => JSON.stringify(row.cells[columnToSort.id]))),
          ).map(v => JSON.parse(v))

          // For each unique value, verify the order relationship
          for (let i = 0; i < uniqueValues.length - 1; i++) {
            const currentValue = uniqueValues[i]
            const nextValue = uniqueValues[i + 1]

            // Find first occurrence of each value in asc and desc sorts
            const ascCurrentIdx = ascNonNullRows.findIndex(
              row => JSON.stringify(row.cells[columnToSort.id]) === JSON.stringify(currentValue),
            )
            const ascNextIdx = ascNonNullRows.findIndex(
              row => JSON.stringify(row.cells[columnToSort.id]) === JSON.stringify(nextValue),
            )
            const descCurrentIdx = descNonNullRows.findIndex(
              row => JSON.stringify(row.cells[columnToSort.id]) === JSON.stringify(currentValue),
            )
            const descNextIdx = descNonNullRows.findIndex(
              row => JSON.stringify(row.cells[columnToSort.id]) === JSON.stringify(nextValue),
            )

            // In ascending order, current should come before next
            expect(ascCurrentIdx).toBeLessThan(ascNextIdx)

            // In descending order, next should come before current
            expect(descNextIdx).toBeLessThan(descCurrentIdx)
          }

          return true
        },
      ),
      { numRuns: 100 },
    )
  })
})

describe('toggleColumnPin', () => {
  test('should pin an unpinned column', () => {
    const table = createTestTable()
    const result = toggleColumnPin(table, 'col2')

    expect(result.columns.find(c => c.id === 'col2')?.isPinned).toBe(true)
  })

  test('should unpin a pinned column', () => {
    const table = createTestTable()
    table.columns[0].isPinned = true

    const result = toggleColumnPin(table, 'col1')

    expect(result.columns.find(c => c.id === 'col1')?.isPinned).toBe(false)
  })

  test('should move pinned column after other pinned columns', () => {
    const table = createTestTable()
    table.columns[0].isPinned = true

    const result = toggleColumnPin(table, 'col2')

    expect(result.columns[0].id).toBe('col1')
    expect(result.columns[1].id).toBe('col2')
    expect(result.columns[1].isPinned).toBe(true)
  })

  test('should throw error for non-existent column', () => {
    const table = createTestTable()
    expect(() => toggleColumnPin(table, 'invalid')).toThrow('Column not found')
  })
})

describe('updateCell', () => {
  test('should update a cell value', () => {
    const table = createTestTable()
    const result = updateCell(table, 'row1', 'col1', 'Alicia')

    expect(result.rows[0].cells.col1).toBe('Alicia')
    expect(result.rows[1].cells.col1).toBe('Bob') // Other rows unchanged
  })

  test('should update a cell to null', () => {
    const table = createTestTable()
    const result = updateCell(table, 'row2', 'col2', null)

    expect(result.rows[1].cells.col2).toBe(null)
  })

  test('should throw error for non-existent column', () => {
    const table = createTestTable()
    expect(() => updateCell(table, 'row1', 'invalid', 'value')).toThrow('Column not found')
  })

  test('should throw error for non-existent row', () => {
    const table = createTestTable()
    expect(() => updateCell(table, 'invalid', 'col1', 'value')).toThrow('Row not found')
  })

  /**
   * Feature: table-editor, Property 9: Cell edit consistency
   * Validates: Requirements 6.5
   *
   * For any table data, row, column, and new value, updating a cell should
   * result in that exact value appearing in all subsequent export formats.
   * This property verifies that cell updates preserve the exact value in the
   * table data structure, which is what all export formats would use.
   */
  test('property: cell edit consistency', () => {
    // Generator for column definitions
    const columnArb = fc.record({
      id: fc.stringMatching(/^col\d+$/),
      name: fc.string({ minLength: 1, maxLength: 20 }),
      originalName: fc.string({ minLength: 1, maxLength: 20 }),
      dataType: fc.constantFrom('string', 'integer', 'decimal', 'boolean'),
      isPinned: fc.boolean(),
      sortDirection: fc.option(fc.constantFrom('asc', 'desc'), { nil: undefined }),
    })

    // Generator for cell values
    const cellValueArb = fc.oneof(
      fc.string(),
      fc.integer(),
      fc.double(),
      fc.boolean(),
      fc.constant(null),
    )

    // Generator for table data with at least 1 column and 1 row
    const tableDataArb = fc.tuple(
      fc.array(columnArb, { minLength: 1, maxLength: 10 }),
      fc.integer({ min: 1, max: 20 }),
    ).chain(([columns, numRows]) => {
      // Ensure unique column IDs
      const uniqueColumns = columns.map((col, idx) => ({
        ...col,
        id: `col${idx}`,
      }))

      // Generate rows with cells for each column
      const rowsArb = fc.array(
        fc.record({
          id: fc.stringMatching(/^row\d+$/),
          cells: fc.record(
            Object.fromEntries(
              uniqueColumns.map(col => [col.id, cellValueArb]),
            ),
          ),
        }),
        { minLength: numRows, maxLength: numRows },
      ).map(rows =>
        rows.map((row, rowIdx) => ({
          ...row,
          id: `row${rowIdx}`,
        })),
      )

      return fc.record({
        columns: fc.constant(uniqueColumns),
        rows: rowsArb,
      })
    })

    fc.assert(
      fc.property(
        tableDataArb,
        cellValueArb,
        (tableData: TableData, newValue: CellValue) => {
          // Skip if table has no rows or columns
          if (tableData.rows.length === 0 || tableData.columns.length === 0) {
            return true
          }

          // Pick a random row and column to update
          const rowToUpdate = tableData.rows[0]
          const columnToUpdate = tableData.columns[0]

          // Perform the cell update
          const result = updateCell(tableData, rowToUpdate.id, columnToUpdate.id, newValue)

          // Property 1: The updated cell should contain the exact new value
          const updatedRow = result.rows.find(row => row.id === rowToUpdate.id)
          expect(updatedRow).toBeDefined()
          expect(updatedRow!.cells[columnToUpdate.id]).toBe(newValue)

          // Property 2: All other cells in the same row should remain unchanged
          for (const columnId of Object.keys(rowToUpdate.cells)) {
            if (columnId !== columnToUpdate.id) {
              expect(updatedRow!.cells[columnId]).toBe(rowToUpdate.cells[columnId])
            }
          }

          // Property 3: All other rows should remain completely unchanged
          for (const row of result.rows) {
            if (row.id !== rowToUpdate.id) {
              const originalRow = tableData.rows.find(r => r.id === row.id)
              expect(originalRow).toBeDefined()
              expect(row.cells).toEqual(originalRow!.cells)
            }
          }

          // Property 4: Column definitions should remain unchanged
          expect(result.columns).toEqual(tableData.columns)

          // Property 5: The number of rows and columns should remain the same
          expect(result.rows.length).toBe(tableData.rows.length)
          expect(result.columns.length).toBe(tableData.columns.length)

          // Property 6: The value should be retrievable (simulating export format access)
          // This ensures the value would be available to all export functions
          const retrievedValue = result.rows.find(r => r.id === rowToUpdate.id)?.cells[columnToUpdate.id]
          expect(retrievedValue).toBe(newValue)

          return true
        },
      ),
      { numRuns: 100 },
    )
  })
})

describe('convertToSnakeCase', () => {
  test('should convert spaces to underscores', () => {
    expect(convertToSnakeCase('First Name')).toBe('first_name')
  })

  test('should convert uppercase to lowercase', () => {
    expect(convertToSnakeCase('UserID')).toBe('userid')
  })

  test('should handle special characters', () => {
    expect(convertToSnakeCase('Email@Address')).toBe('email_address')
    expect(convertToSnakeCase('Price ($)')).toBe('price')
  })

  test('should remove consecutive underscores', () => {
    expect(convertToSnakeCase('First  Name')).toBe('first_name')
  })

  test('should remove leading and trailing underscores', () => {
    expect(convertToSnakeCase(' Name ')).toBe('name')
    expect(convertToSnakeCase('_Name_')).toBe('name')
  })
})

describe('applySnakeCaseToColumns', () => {
  test('should convert all column names to snake_case', () => {
    const table = createTestTable()
    table.columns[0].name = 'First Name'
    table.columns[1].name = 'User Age'

    const result = applySnakeCaseToColumns(table)

    expect(result.columns[0].name).toBe('first_name')
    expect(result.columns[1].name).toBe('user_age')
    expect(result.columns[2].name).toBe('city')
  })

  test('should preserve original names', () => {
    const table = createTestTable()
    const result = applySnakeCaseToColumns(table)

    expect(result.columns[0].originalName).toBe('Name')
  })
})
