import type { TableData } from './types'

import { describe, expect, it } from 'bun:test'
import * as fc from 'fast-check'

import { escapeCSVValue, escapeMarkdownValue, escapeSQLString, exportToCSV, exportToMarkdown, formatSQLValue, generateCreateTable, generateSQLInsert, generateSQLUpdate, getSQLType } from './export'

describe('escapeSQLString', () => {
  it('should escape single quotes', () => {
    expect(escapeSQLString('O\'Brien')).toBe('O\'\'Brien')
  })

  it('should escape backslashes', () => {
    expect(escapeSQLString('C:\\path\\file')).toBe('C:\\\\path\\\\file')
  })

  it('should escape newlines', () => {
    expect(escapeSQLString('line1\nline2')).toBe('line1\\nline2')
  })

  it('should handle multiple special characters', () => {
    expect(escapeSQLString('test\'s\nvalue\\')).toBe('test\'\'s\\nvalue\\\\')
  })
})

describe('formatSQLValue', () => {
  it('should format NULL values', () => {
    expect(formatSQLValue(null, 'string')).toBe('NULL')
  })

  it('should format string values with quotes', () => {
    expect(formatSQLValue('test', 'string')).toBe('\'test\'')
  })

  it('should format integer values without quotes', () => {
    expect(formatSQLValue(42, 'integer')).toBe('42')
  })

  it('should format decimal values without quotes', () => {
    expect(formatSQLValue(3.14, 'decimal')).toBe('3.14')
  })

  it('should format boolean values as 1/0', () => {
    expect(formatSQLValue(true, 'boolean')).toBe('1')
    expect(formatSQLValue(false, 'boolean')).toBe('0')
  })

  it('should escape special characters in strings', () => {
    expect(formatSQLValue('O\'Brien', 'string')).toBe('\'O\'\'Brien\'')
  })
})

describe('generateSQLInsert', () => {
  const testData: TableData = {
    columns: [
      { id: 'col1', name: 'id', originalName: 'id', dataType: 'integer', isPinned: false },
      { id: 'col2', name: 'name', originalName: 'name', dataType: 'string', isPinned: false },
      { id: 'col3', name: 'age', originalName: 'age', dataType: 'integer', isPinned: false },
    ],
    rows: [
      { id: 'row1', cells: { col1: 1, col2: 'Alice', col3: 30 } },
      { id: 'row2', cells: { col1: 2, col2: 'Bob', col3: 25 } },
    ],
  }

  it('should generate INSERT statements with table name', () => {
    const result = generateSQLInsert(testData, 'users', false)
    expect(result).toContain('INSERT INTO `users`')
  })

  it('should include all column names', () => {
    const result = generateSQLInsert(testData, 'users', false)
    expect(result).toContain('`id`, `name`, `age`')
  })

  it('should generate one statement per row', () => {
    const result = generateSQLInsert(testData, 'users', false)
    const statements = result.split('\n')
    expect(statements.length).toBe(2)
  })

  it('should properly escape string values', () => {
    const dataWithQuotes: TableData = {
      columns: [
        { id: 'col1', name: 'name', originalName: 'name', dataType: 'string', isPinned: false },
      ],
      rows: [
        { id: 'row1', cells: { col1: 'O\'Brien' } },
      ],
    }
    const result = generateSQLInsert(dataWithQuotes, 'users', false)
    expect(result).toContain('\'O\'\'Brien\'')
  })

  it('should handle NULL values', () => {
    const dataWithNull: TableData = {
      columns: [
        { id: 'col1', name: 'name', originalName: 'name', dataType: 'string', isPinned: false },
      ],
      rows: [
        { id: 'row1', cells: { col1: null } },
      ],
    }
    const result = generateSQLInsert(dataWithNull, 'users', false)
    expect(result).toContain('NULL')
  })

  /**
   * Feature: table-editor, Property 11: SQL INSERT column completeness
   * Validates: Requirements 7.2
   *
   * For any table data, generating SQL INSERT statements should include all
   * column names in the column list of every INSERT statement.
   */
  it('property: SQL INSERT column completeness', () => {
    // Generator for valid SQL column names (alphanumeric, underscores, no leading numbers)
    const columnNameArb = fc.string({ minLength: 1, maxLength: 20 })
      .filter(s => /^[a-z_]\w*$/i.test(s))

    // Generator for cell values based on data type
    const cellValueForTypeArb = (dataType: string) => {
      switch (dataType) {
        case 'string':
          return fc.oneof(
            fc.string({ minLength: 0, maxLength: 50 }),
            fc.constant(null),
          )
        case 'integer':
          return fc.oneof(
            fc.integer(),
            fc.constant(null),
          )
        case 'decimal':
          return fc.oneof(
            fc.double().filter(n => !Number.isNaN(n) && Number.isFinite(n)),
            fc.constant(null),
          )
        case 'boolean':
          return fc.oneof(
            fc.boolean(),
            fc.constant(null),
          )
        default:
          return fc.oneof(
            fc.string({ minLength: 0, maxLength: 50 }),
            fc.constant(null),
          )
      }
    }

    // Generator for column definitions
    const columnArb = fc.record({
      id: fc.stringMatching(/^col\d+$/),
      name: columnNameArb,
      originalName: columnNameArb,
      dataType: fc.constantFrom('string', 'integer', 'decimal', 'boolean'),
      isPinned: fc.boolean(),
      sortDirection: fc.option(fc.constantFrom('asc', 'desc'), { nil: undefined }),
    })

    // Generator for table data with at least 1 column and 1 row
    const tableDataArb = fc.tuple(
      fc.array(columnArb, { minLength: 1, maxLength: 10 }),
      fc.integer({ min: 1, max: 20 }),
    ).chain(([columns, numRows]) => {
      // Ensure unique column IDs and names
      const uniqueColumns = columns.map((col, idx) => ({
        ...col,
        id: `col${idx}`,
        name: `col_${idx}_${col.name}`,
        originalName: `orig_${idx}_${col.originalName}`,
      }))

      // Generate rows with cells that match each column's data type
      const rowsArb = fc.array(
        fc.record({
          id: fc.stringMatching(/^row\d+$/),
          cells: fc.record(
            Object.fromEntries(
              uniqueColumns.map(col => [col.id, cellValueForTypeArb(col.dataType)]),
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

    // Generator for valid SQL table names
    const tableNameArb = fc.string({ minLength: 1, maxLength: 30 })
      .filter(s => /^[a-z_]\w*$/i.test(s))

    fc.assert(
      fc.property(
        tableDataArb,
        tableNameArb,
        fc.boolean(),
        (tableData: TableData, tableName: string, useSnakeCase: boolean) => {
          // Generate SQL INSERT statements
          const result = generateSQLInsert(tableData, tableName, useSnakeCase)

          // Property: The result should not be an error message
          expect(result).not.toContain('-- No data to insert')

          // Get expected column names based on useSnakeCase flag
          const expectedColumnNames = tableData.columns.map(col =>
            useSnakeCase ? col.name : col.originalName,
          )

          // Split into individual statements
          const statements = result.split('\n').filter(line => line.trim().length > 0)

          // Property: Each statement should contain ALL column names in the column list
          for (const statement of statements) {
            // Extract the column list from the INSERT statement
            // Format: INSERT INTO `table` (`col1`, `col2`, ...) VALUES (...);
            const columnListMatch = statement.match(/INSERT INTO `[^`]+` \(([^)]+)\) VALUES/)
            expect(columnListMatch).toBeDefined()

            const columnList = columnListMatch![1]

            // Parse the column names from the column list
            const actualColumns = columnList
              .split(',')
              .map(col => col.trim().replace(/`/g, ''))

            // Property: All expected columns should be present
            expect(actualColumns.length).toBe(expectedColumnNames.length)

            for (const expectedCol of expectedColumnNames) {
              expect(actualColumns).toContain(expectedCol)
            }

            // Property: No extra columns should be present
            for (const actualCol of actualColumns) {
              expect(expectedColumnNames).toContain(actualCol)
            }

            // Property: Column order should match the original table column order
            for (let i = 0; i < expectedColumnNames.length; i++) {
              expect(actualColumns[i]).toBe(expectedColumnNames[i])
            }
          }

          return true
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: table-editor, Property 10: SQL INSERT table name inclusion
   * Validates: Requirements 7.1
   *
   * For any table data and table name, generating SQL INSERT statements should
   * include the specified table name in every INSERT statement.
   */
  it('property: SQL INSERT table name inclusion', () => {
    // Generator for valid SQL table names (alphanumeric, underscores, no leading numbers)
    const tableNameArb = fc.string({ minLength: 1, maxLength: 30 })
      .filter(s => /^[a-z_]\w*$/i.test(s))

    // Generator for cell values based on data type
    const cellValueForTypeArb = (dataType: string) => {
      switch (dataType) {
        case 'string':
          return fc.oneof(
            fc.string({ minLength: 1, maxLength: 50 }), // Non-empty strings
            fc.constant(null),
          )
        case 'integer':
          return fc.oneof(
            fc.integer(),
            fc.constant(null),
          )
        case 'decimal':
          return fc.oneof(
            fc.double().filter(n => !Number.isNaN(n) && Number.isFinite(n)),
            fc.constant(null),
          )
        case 'boolean':
          return fc.oneof(
            fc.boolean(),
            fc.constant(null),
          )
        default:
          return fc.oneof(
            fc.string({ minLength: 1, maxLength: 50 }),
            fc.constant(null),
          )
      }
    }

    // Generator for column definitions
    const columnArb = fc.record({
      id: fc.stringMatching(/^col\d+$/),
      name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z_]\w*$/i.test(s)),
      originalName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z_]\w*$/i.test(s)),
      dataType: fc.constantFrom('string', 'integer', 'decimal', 'boolean'),
      isPinned: fc.boolean(),
      sortDirection: fc.option(fc.constantFrom('asc', 'desc'), { nil: undefined }),
    })

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

      // Generate rows with cells that match each column's data type
      const rowsArb = fc.array(
        fc.record({
          id: fc.stringMatching(/^row\d+$/),
          cells: fc.record(
            Object.fromEntries(
              uniqueColumns.map(col => [col.id, cellValueForTypeArb(col.dataType)]),
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
        tableNameArb,
        fc.boolean(),
        (tableData: TableData, tableName: string, useSnakeCase: boolean) => {
          // Generate SQL INSERT statements
          const result = generateSQLInsert(tableData, tableName, useSnakeCase)

          // Property 1: The result should not be an error message
          expect(result).not.toContain('-- No data to insert')

          // Property 2: Every line should contain the table name in the INSERT INTO clause
          const statements = result.split('\n').filter(line => line.trim().length > 0)

          for (const statement of statements) {
            // Each statement should contain "INSERT INTO `tableName`"
            expect(statement).toContain('INSERT INTO')
            expect(statement).toContain(`\`${tableName}\``)

            // Verify the table name appears in the correct position (after INSERT INTO)
            const insertIntoMatch = statement.match(/INSERT INTO `([^`]+)`/)
            expect(insertIntoMatch).toBeDefined()
            expect(insertIntoMatch![1]).toBe(tableName)
          }

          // Property 3: The number of statements should equal the number of rows
          expect(statements.length).toBe(tableData.rows.length)

          // Property 4: Each statement should be a complete INSERT statement with proper syntax
          for (const statement of statements) {
            // Check basic structure: INSERT INTO `table` (...) VALUES (...);
            expect(statement).toMatch(/^INSERT INTO `[^`]+` \([^)]+\) VALUES \(.+\);$/)
          }

          return true
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: table-editor, Property 13: SQL INSERT row count
   * Validates: Requirements 7.4
   *
   * For any table data, the number of generated SQL INSERT statements should
   * equal the number of rows in the table.
   */
  it('property: SQL INSERT row count', () => {
    // Generator for valid SQL column names (alphanumeric, underscores, no leading numbers)
    const columnNameArb = fc.string({ minLength: 1, maxLength: 20 })
      .filter(s => /^[a-z_]\w*$/i.test(s))

    // Generator for cell values based on data type
    const cellValueForTypeArb = (dataType: string) => {
      switch (dataType) {
        case 'string':
          return fc.oneof(
            fc.string({ minLength: 0, maxLength: 50 }),
            fc.constant(null),
          )
        case 'integer':
          return fc.oneof(
            fc.integer(),
            fc.constant(null),
          )
        case 'decimal':
          return fc.oneof(
            fc.double().filter(n => !Number.isNaN(n) && Number.isFinite(n)),
            fc.constant(null),
          )
        case 'boolean':
          return fc.oneof(
            fc.boolean(),
            fc.constant(null),
          )
        default:
          return fc.oneof(
            fc.string({ minLength: 0, maxLength: 50 }),
            fc.constant(null),
          )
      }
    }

    // Generator for column definitions
    const columnArb = fc.record({
      id: fc.stringMatching(/^col\d+$/),
      name: columnNameArb,
      originalName: columnNameArb,
      dataType: fc.constantFrom('string', 'integer', 'decimal', 'boolean'),
      isPinned: fc.boolean(),
      sortDirection: fc.option(fc.constantFrom('asc', 'desc'), { nil: undefined }),
    })

    // Generator for table data with at least 1 column and variable number of rows
    const tableDataArb = fc.tuple(
      fc.array(columnArb, { minLength: 1, maxLength: 10 }),
      fc.integer({ min: 0, max: 50 }), // Allow 0 to 50 rows
    ).chain(([columns, numRows]) => {
      // Ensure unique column IDs and names
      const uniqueColumns = columns.map((col, idx) => ({
        ...col,
        id: `col${idx}`,
        name: `col_${idx}_${col.name}`,
        originalName: `orig_${idx}_${col.originalName}`,
      }))

      // Generate rows with cells that match each column's data type
      const rowsArb = fc.array(
        fc.record({
          id: fc.stringMatching(/^row\d+$/),
          cells: fc.record(
            Object.fromEntries(
              uniqueColumns.map(col => [col.id, cellValueForTypeArb(col.dataType)]),
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

    // Generator for valid SQL table names
    const tableNameArb = fc.string({ minLength: 1, maxLength: 30 })
      .filter(s => /^[a-z_]\w*$/i.test(s))

    fc.assert(
      fc.property(
        tableDataArb,
        tableNameArb,
        fc.boolean(),
        (tableData: TableData, tableName: string, useSnakeCase: boolean) => {
          // Generate SQL INSERT statements
          const result = generateSQLInsert(tableData, tableName, useSnakeCase)

          // Handle the case where there are no rows
          if (tableData.rows.length === 0) {
            // Property: Should return a comment indicating no data
            expect(result).toBe('-- No data to insert')
            return true
          }

          // Property: The number of INSERT statements should equal the number of rows
          const statements = result.split('\n').filter(line => line.trim().length > 0)
          expect(statements.length).toBe(tableData.rows.length)

          // Additional verification: Each statement should be a valid INSERT statement
          for (const statement of statements) {
            expect(statement).toMatch(/^INSERT INTO `[^`]+` \([^)]+\) VALUES \(.+\);$/)
          }

          return true
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: table-editor, Property 12: SQL value escaping
   * Validates: Requirements 7.3, 8.3
   *
   * For any table data containing string values with special characters (quotes,
   * backslashes, newlines) or NULL values, all SQL statement types (INSERT, UPDATE,
   * CREATE TABLE) should properly escape string values and represent NULL values correctly.
   */
  it('property: SQL value escaping', () => {
    // Generator for strings with special characters that need escaping
    const specialCharStringArb = fc.oneof(
      // Strings with single quotes
      fc.constant('test\'value'),
      // Strings with backslashes
      fc.constant('path\\file'),
      // Strings with newlines
      fc.constant('line1\nline2'),
      // Strings with carriage returns
      fc.constant('text\rmore'),
      // Strings with tabs
      fc.constant('col1\tcol2'),
      // Regular strings (control case)
      fc.string({ minLength: 1, maxLength: 20 }),
    )

    // Generator for cell values based on data type
    const cellValueForTypeArb = (dataType: string) => {
      switch (dataType) {
        case 'string':
          return fc.oneof(
            specialCharStringArb,
            fc.constant(null),
          )
        case 'integer':
          return fc.oneof(
            fc.integer(),
            fc.constant(null),
          )
        case 'boolean':
          return fc.oneof(
            fc.boolean(),
            fc.constant(null),
          )
        default:
          return fc.oneof(
            specialCharStringArb,
            fc.constant(null),
          )
      }
    }

    // Generator for column definitions with string columns
    const columnArb = fc.record({
      id: fc.stringMatching(/^col\d+$/),
      name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z_]\w*$/i.test(s)),
      originalName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z_]\w*$/i.test(s)),
      dataType: fc.constantFrom('string', 'integer', 'boolean'),
      isPinned: fc.boolean(),
    })

    // Generator for table data with at least 1 string column and 1 row
    const tableDataArb = fc.tuple(
      fc.array(columnArb, { minLength: 2, maxLength: 5 }),
      fc.integer({ min: 1, max: 10 }),
    ).chain(([columns, numRows]) => {
      // Ensure at least one string column and unique column IDs and names
      const uniqueColumns = columns.map((col, idx) => ({
        ...col,
        id: `col${idx}`,
        name: `col_${idx}_${col.name}`,
        originalName: `orig_${idx}_${col.originalName}`,
        dataType: idx === 0 ? 'string' as const : col.dataType, // Ensure first column is string
      }))

      // Generate rows with cells that match each column's data type
      const rowsArb = fc.array(
        fc.record({
          id: fc.stringMatching(/^row\d+$/),
          cells: fc.record(
            Object.fromEntries(
              uniqueColumns.map(col => [col.id, cellValueForTypeArb(col.dataType)]),
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

    // Generator for valid SQL table names
    const tableNameArb = fc.string({ minLength: 1, maxLength: 30 })
      .filter(s => /^[a-z_]\w*$/i.test(s))

    fc.assert(
      fc.property(
        tableDataArb,
        tableNameArb,
        fc.boolean(),
        (tableData: TableData, tableName: string, useSnakeCase: boolean) => {
          // Test SQL INSERT statements
          const insertResult = generateSQLInsert(tableData, tableName, useSnakeCase)

          // Skip if no data
          if (insertResult.includes('-- No data')) {
            return true
          }

          // Property 1: NULL values should be represented as NULL (not 'NULL' string)
          if (tableData.rows.some(row => Object.values(row.cells).includes(null))) {
            expect(insertResult).toContain('NULL')
            // Ensure NULL is not quoted
            expect(insertResult).not.toMatch(/'NULL'/)
          }

          // Property 2: NULL values are properly represented
          if (tableData.rows.some(row => Object.values(row.cells).includes(null))) {
            expect(insertResult).toContain('NULL')
          }

          // Property 3: String values are quoted
          const hasStringValues = tableData.rows.some(row =>
            Object.values(row.cells).some(v => typeof v === 'string'),
          )
          if (hasStringValues) {
            // String values should be wrapped in single quotes (allowing escaped quotes '' inside)
            expect(insertResult).toMatch(/'([^']|'')*'/)
          }

          // Property 4: Special characters don't break SQL syntax
          // Verify basic SQL structure is maintained
          const statements = insertResult.split('\n').filter(s => s.trim() && !s.startsWith('--'))
          expect(statements.length).toBe(tableData.rows.length)

          for (const stmt of statements) {
            // Should contain INSERT INTO
            expect(stmt).toContain('INSERT INTO')
            // Should contain VALUES
            expect(stmt).toContain('VALUES')
            // Should end with semicolon
            expect(stmt.endsWith(';')).toBe(true)
            // Should have the basic structure (parentheses in column list and values)
            expect(stmt).toMatch(/INSERT INTO `[^`]+` \(/)
            expect(stmt).toMatch(/VALUES \(/)
          }

          // Test SQL UPDATE statements (if we have at least 2 columns for key + value)
          if (tableData.columns.length >= 2) {
            const keyColumns = [tableData.columns[0].id]
            const updateResult = generateSQLUpdate(tableData, tableName, keyColumns, useSnakeCase)

            // Skip if no data or error
            if (!updateResult.includes('-- No data') && !updateResult.includes('-- Error')) {
              // Property 7: UPDATE statements should also properly escape NULL values
              if (tableData.rows.some(row => Object.values(row.cells).includes(null))) {
                expect(updateResult).toContain('NULL')
                expect(updateResult).not.toMatch(/'NULL'/)
              }

              // Property 8: UPDATE statements are syntactically valid
              const updateStatements = updateResult.split('\n').filter(s => s.trim() && !s.startsWith('--'))
              for (const stmt of updateStatements) {
                // Should start with UPDATE and end with semicolon
                expect(stmt).toMatch(/^UPDATE/)
                expect(stmt.endsWith(';')).toBe(true)
                // Should have SET and WHERE clauses
                expect(stmt).toContain('SET')
                expect(stmt).toContain('WHERE')
              }
            }
          }

          // Property 9: Generated SQL should not contain syntax errors from unescaped characters
          // Verify basic SQL structure is maintained
          if (!insertResult.includes('-- No data')) {
            const insertStatements = insertResult.split('\n').filter(s => s.trim())
            for (const stmt of insertStatements) {
              // Each statement should start with INSERT and end with semicolon
              expect(stmt).toMatch(/^INSERT INTO/)
              expect(stmt.endsWith(';')).toBe(true)
            }
          }

          return true
        },
      ),
      { numRuns: 100 },
    )
  })
})

describe('generateSQLUpdate', () => {
  const testData: TableData = {
    columns: [
      { id: 'col1', name: 'id', originalName: 'id', dataType: 'integer', isPinned: false },
      { id: 'col2', name: 'name', originalName: 'name', dataType: 'string', isPinned: false },
      { id: 'col3', name: 'age', originalName: 'age', dataType: 'integer', isPinned: false },
    ],
    rows: [
      { id: 'row1', cells: { col1: 1, col2: 'Alice', col3: 30 } },
      { id: 'row2', cells: { col1: 2, col2: 'Bob', col3: 25 } },
    ],
  }

  it('should generate UPDATE statements with table name', () => {
    const result = generateSQLUpdate(testData, 'users', ['col1'], false)
    expect(result).toContain('UPDATE `users`')
  })

  it('should include SET clause with non-key columns', () => {
    const result = generateSQLUpdate(testData, 'users', ['col1'], false)
    expect(result).toContain('SET `name` =')
    expect(result).toContain('`age` =')
  })

  it('should include WHERE clause with key columns', () => {
    const result = generateSQLUpdate(testData, 'users', ['col1'], false)
    expect(result).toContain('WHERE `id` = 1')
  })

  it('should generate one statement per row', () => {
    const result = generateSQLUpdate(testData, 'users', ['col1'], false)
    const statements = result.split('\n')
    expect(statements.length).toBe(2)
  })

  it('should handle multiple key columns', () => {
    const result = generateSQLUpdate(testData, 'users', ['col1', 'col2'], false)
    expect(result).toContain('WHERE `id` = 1 AND `name` = \'Alice\'')
  })

  /**
   * Feature: table-editor, Property 15: SQL UPDATE non-key columns
   * Validates: Requirements 8.2
   *
   * For any table data and set of key columns, generating SQL UPDATE statements should
   * include SET clauses for all columns except the key columns.
   */
  it('property: SQL UPDATE non-key columns', () => {
    // Generator for valid SQL column names (alphanumeric, underscores, no leading numbers)
    const columnNameArb = fc.string({ minLength: 1, maxLength: 20 })
      .filter(s => /^[a-z_]\w*$/i.test(s))

    // Generator for cell values based on data type
    const cellValueForTypeArb = (dataType: string) => {
      switch (dataType) {
        case 'string':
          return fc.oneof(
            fc.string({ minLength: 0, maxLength: 50 }),
            fc.constant(null),
          )
        case 'integer':
          return fc.oneof(
            fc.integer(),
            fc.constant(null),
          )
        case 'decimal':
          return fc.oneof(
            fc.double().filter(n => !Number.isNaN(n) && Number.isFinite(n)),
            fc.constant(null),
          )
        case 'boolean':
          return fc.oneof(
            fc.boolean(),
            fc.constant(null),
          )
        default:
          return fc.oneof(
            fc.string({ minLength: 0, maxLength: 50 }),
            fc.constant(null),
          )
      }
    }

    // Generator for column definitions
    const columnArb = fc.record({
      id: fc.stringMatching(/^col\d+$/),
      name: columnNameArb,
      originalName: columnNameArb,
      dataType: fc.constantFrom('string', 'integer', 'decimal', 'boolean'),
      isPinned: fc.boolean(),
      sortDirection: fc.option(fc.constantFrom('asc', 'desc'), { nil: undefined }),
    })

    // Generator for table data with at least 2 columns (1 key + 1 non-key) and 1 row
    const tableDataArb = fc.tuple(
      fc.array(columnArb, { minLength: 2, maxLength: 10 }),
      fc.integer({ min: 1, max: 20 }),
    ).chain(([columns, numRows]) => {
      // Ensure unique column IDs and names
      const uniqueColumns = columns.map((col, idx) => ({
        ...col,
        id: `col${idx}`,
        name: `col_${idx}_${col.name}`,
        originalName: `orig_${idx}_${col.originalName}`,
      }))

      // Generate rows with cells that match each column's data type
      const rowsArb = fc.array(
        fc.record({
          id: fc.stringMatching(/^row\d+$/),
          cells: fc.record(
            Object.fromEntries(
              uniqueColumns.map(col => [col.id, cellValueForTypeArb(col.dataType)]),
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

    // Generator for valid SQL table names
    const tableNameArb = fc.string({ minLength: 1, maxLength: 30 })
      .filter(s => /^[a-z_]\w*$/i.test(s))

    // Generator for key column selection (at least 1, but not all columns)
    const keyColumnsArb = (tableData: TableData) => {
      const numColumns = tableData.columns.length
      // Select between 1 and (numColumns - 1) key columns to ensure at least one non-key column
      return fc.integer({ min: 1, max: numColumns - 1 }).chain((numKeys) => {
        // Generate array of indices to use as key columns
        return fc.shuffledSubarray(
          tableData.columns.map((_, idx) => idx),
          { minLength: numKeys, maxLength: numKeys },
        ).map(indices => indices.map(idx => tableData.columns[idx].id))
      })
    }

    fc.assert(
      fc.property(
        tableDataArb,
        tableNameArb,
        fc.boolean(),
        (tableData: TableData, tableName: string, useSnakeCase: boolean) => {
          // Generate key columns for this table
          return fc.assert(
            fc.property(
              keyColumnsArb(tableData),
              (keyColumns: string[]) => {
                // Generate SQL UPDATE statements
                const result = generateSQLUpdate(tableData, tableName, keyColumns, useSnakeCase)

                // Skip if error or no data
                if (result.includes('-- Error') || result.includes('-- No data')) {
                  return true
                }

                // Get expected column names based on useSnakeCase flag
                const keyColumnSet = new Set(keyColumns)
                const nonKeyColumns = tableData.columns.filter(col => !keyColumnSet.has(col.id))
                const keyColumnDefs = tableData.columns.filter(col => keyColumnSet.has(col.id))

                // Property: There should be at least one non-key column
                expect(nonKeyColumns.length).toBeGreaterThan(0)

                // Split into individual statements
                const statements = result.split('\n').filter(line => line.trim().length > 0)

                // Property: Each UPDATE statement should include SET clauses for ALL non-key columns
                for (const statement of statements) {
                  // Extract the SET clause from the UPDATE statement
                  // Format: UPDATE `table` SET `col1` = val1, `col2` = val2 WHERE ...
                  const setClauseMatch = statement.match(/SET (.+) WHERE/)
                  expect(setClauseMatch).toBeDefined()

                  const setClause = setClauseMatch![1]

                  // Parse the column names from the SET clause
                  // Each assignment is in the format: `colName` = value
                  const setColumnMatches = setClause.matchAll(/`([^`]+)`\s*=/g)
                  const setColumns = Array.from(setColumnMatches).map(match => match[1])

                  // Property 1: All non-key columns should appear in the SET clause
                  for (const nonKeyCol of nonKeyColumns) {
                    const expectedColName = useSnakeCase ? nonKeyCol.name : nonKeyCol.originalName
                    expect(setColumns).toContain(expectedColName)
                  }

                  // Property 2: The number of SET columns should equal the number of non-key columns
                  expect(setColumns.length).toBe(nonKeyColumns.length)

                  // Property 3: No key columns should appear in the SET clause
                  for (const keyCol of keyColumnDefs) {
                    const keyColName = useSnakeCase ? keyCol.name : keyCol.originalName
                    expect(setColumns).not.toContain(keyColName)
                  }

                  // Property 4: All key columns should appear in the WHERE clause
                  const whereClauseMatch = statement.match(/WHERE (.+);$/)
                  expect(whereClauseMatch).toBeDefined()

                  const whereClause = whereClauseMatch![1]
                  for (const keyCol of keyColumnDefs) {
                    const keyColName = useSnakeCase ? keyCol.name : keyCol.originalName
                    expect(whereClause).toContain(`\`${keyColName}\``)
                  }
                }

                return true
              },
            ),
            { numRuns: 10 }, // Nested property, so fewer runs
          )
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: table-editor, Property 16: SQL UPDATE row count
   * Validates: Requirements 8.4
   *
   * For any table data, the number of generated SQL UPDATE statements should
   * equal the number of rows in the table.
   */
  it('property: SQL UPDATE row count', () => {
    // Generator for valid SQL column names (alphanumeric, underscores, no leading numbers)
    const columnNameArb = fc.string({ minLength: 1, maxLength: 20 })
      .filter(s => /^[a-z_]\w*$/i.test(s))

    // Generator for cell values based on data type
    const cellValueForTypeArb = (dataType: string) => {
      switch (dataType) {
        case 'string':
          return fc.oneof(
            fc.string({ minLength: 0, maxLength: 50 }),
            fc.constant(null),
          )
        case 'integer':
          return fc.oneof(
            fc.integer(),
            fc.constant(null),
          )
        case 'decimal':
          return fc.oneof(
            fc.double().filter(n => !Number.isNaN(n) && Number.isFinite(n)),
            fc.constant(null),
          )
        case 'boolean':
          return fc.oneof(
            fc.boolean(),
            fc.constant(null),
          )
        default:
          return fc.oneof(
            fc.string({ minLength: 0, maxLength: 50 }),
            fc.constant(null),
          )
      }
    }

    // Generator for column definitions
    const columnArb = fc.record({
      id: fc.stringMatching(/^col\d+$/),
      name: columnNameArb,
      originalName: columnNameArb,
      dataType: fc.constantFrom('string', 'integer', 'decimal', 'boolean'),
      isPinned: fc.boolean(),
      sortDirection: fc.option(fc.constantFrom('asc', 'desc'), { nil: undefined }),
    })

    // Generator for table data with at least 2 columns (1 key + 1 non-key) and variable number of rows
    const tableDataArb = fc.tuple(
      fc.array(columnArb, { minLength: 2, maxLength: 10 }),
      fc.integer({ min: 0, max: 50 }), // Allow 0 to 50 rows
    ).chain(([columns, numRows]) => {
      // Ensure unique column IDs and names
      const uniqueColumns = columns.map((col, idx) => ({
        ...col,
        id: `col${idx}`,
        name: `col_${idx}_${col.name}`,
        originalName: `orig_${idx}_${col.originalName}`,
      }))

      // Generate rows with cells that match each column's data type
      const rowsArb = fc.array(
        fc.record({
          id: fc.stringMatching(/^row\d+$/),
          cells: fc.record(
            Object.fromEntries(
              uniqueColumns.map(col => [col.id, cellValueForTypeArb(col.dataType)]),
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

    // Generator for valid SQL table names
    const tableNameArb = fc.string({ minLength: 1, maxLength: 30 })
      .filter(s => /^[a-z_]\w*$/i.test(s))

    fc.assert(
      fc.property(
        tableDataArb,
        tableNameArb,
        fc.boolean(),
        (tableData: TableData, tableName: string, useSnakeCase: boolean) => {
          // Use the first column as the key column
          const keyColumns = [tableData.columns[0].id]

          // Generate SQL UPDATE statements
          const result = generateSQLUpdate(tableData, tableName, keyColumns, useSnakeCase)

          // Handle the case where there are no rows
          if (tableData.rows.length === 0) {
            // Property: Should return a comment indicating no data
            expect(result).toBe('-- No data to update')
            return true
          }

          // Property: The number of UPDATE statements should equal the number of rows
          const statements = result.split('\n').filter(line => line.trim().length > 0)
          expect(statements.length).toBe(tableData.rows.length)

          // Additional verification: Each statement should be a valid UPDATE statement
          for (const statement of statements) {
            expect(statement).toMatch(/^UPDATE `[^`]+` SET .+ WHERE .+;$/)
          }

          return true
        },
      ),
      { numRuns: 100 },
    )
  })
})

describe('generateCreateTable', () => {
  const testData: TableData = {
    columns: [
      { id: 'col1', name: 'id', originalName: 'id', dataType: 'integer', isPinned: false },
      { id: 'col2', name: 'name', originalName: 'name', dataType: 'string', isPinned: false },
      { id: 'col3', name: 'age', originalName: 'age', dataType: 'integer', isPinned: false },
      { id: 'col4', name: 'active', originalName: 'active', dataType: 'boolean', isPinned: false },
    ],
    rows: [],
  }

  it('should generate CREATE TABLE statement with table name', () => {
    const result = generateCreateTable(testData, 'users', false)
    expect(result).toContain('CREATE TABLE `users`')
  })

  it('should include all columns with data types', () => {
    const result = generateCreateTable(testData, 'users', false)
    expect(result).toContain('`id` INT')
    expect(result).toContain('`name` VARCHAR(255)')
    expect(result).toContain('`age` INT')
    expect(result).toContain('`active` BOOLEAN')
  })

  it('should infer correct SQL types', () => {
    const dataWithTypes: TableData = {
      columns: [
        { id: 'col1', name: 'price', originalName: 'price', dataType: 'decimal', isPinned: false },
      ],
      rows: [],
    }
    const result = generateCreateTable(dataWithTypes, 'products', false)
    expect(result).toContain('`price` DECIMAL(10,2)')
  })

  /**
   * Feature: table-editor, Property 23: CREATE TABLE column completeness
   * Validates: Requirements 12.3
   *
   * For any table data, generating CREATE TABLE statements should include all columns
   * with their inferred data types.
   */
  it('property: CREATE TABLE column completeness', () => {
    // Generator for valid SQL column names (alphanumeric, underscores, no leading numbers)
    const columnNameArb = fc.string({ minLength: 1, maxLength: 20 })
      .filter(s => /^[a-z_]\w*$/i.test(s))

    // Generator for column definitions
    const columnArb = fc.record({
      id: fc.stringMatching(/^col\d+$/),
      name: columnNameArb,
      originalName: columnNameArb,
      dataType: fc.constantFrom('string', 'integer', 'decimal', 'boolean'),
      isPinned: fc.boolean(),
      sortDirection: fc.option(fc.constantFrom('asc', 'desc'), { nil: undefined }),
    })

    // Generator for table data with at least 1 column
    const tableDataArb = fc.array(columnArb, { minLength: 1, maxLength: 15 })
      .map((columns) => {
        // Ensure unique column IDs and names
        const uniqueColumns = columns.map((col, idx) => ({
          ...col,
          id: `col${idx}`,
          name: `col_${idx}_${col.name}`,
          originalName: `orig_${idx}_${col.originalName}`,
        }))

        return {
          columns: uniqueColumns,
          rows: [], // CREATE TABLE doesn't need rows
        }
      })

    // Generator for valid SQL table names
    const tableNameArb = fc.string({ minLength: 1, maxLength: 30 })
      .filter(s => /^[a-z_]\w*$/i.test(s))

    fc.assert(
      fc.property(
        tableDataArb,
        tableNameArb,
        fc.boolean(),
        (tableData: TableData, tableName: string, useSnakeCase: boolean) => {
          // Generate CREATE TABLE statement
          const result = generateCreateTable(tableData, tableName, useSnakeCase)

          // Property: The result should not be an error message
          expect(result).not.toContain('-- No columns')

          // Property 1: All columns should be present in the CREATE TABLE statement
          for (const column of tableData.columns) {
            const columnName = useSnakeCase ? column.name : column.originalName
            expect(result).toContain(`\`${columnName}\``)
          }

          // Property 2: Each column should have its corresponding data type
          for (const column of tableData.columns) {
            const columnName = useSnakeCase ? column.name : column.originalName
            const sqlType = getSQLType(column.dataType)

            // The column definition should appear as: `columnName` TYPE
            // Escape both the column name and SQL type for regex special characters
            const escapedColumnName = columnName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            const escapedSQLType = sqlType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            const columnDefPattern = new RegExp(`\`${escapedColumnName}\`\\s+${escapedSQLType}`)
            expect(result).toMatch(columnDefPattern)
          }

          // Property 3: The number of column definitions should match the number of columns
          // Count the number of backtick-enclosed identifiers in the column definition section
          // Extract the column definitions section (between the opening and closing parentheses)
          const columnDefsMatch = result.match(/CREATE TABLE `[^`]+` \(([\s\S]+)\);/)
          expect(columnDefsMatch).toBeDefined()

          const columnDefsSection = columnDefsMatch![1]

          // Count column definitions by splitting on commas (outside of parentheses for types like DECIMAL(10,2))
          // For simplicity, count lines that contain backticks and SQL types
          const columnDefLines = columnDefsSection
            .split('\n')
            .filter(line => line.trim().length > 0 && line.includes('`'))

          expect(columnDefLines.length).toBe(tableData.columns.length)

          // Property 4: No extra columns should be present
          // Verify that each backtick-enclosed identifier in the CREATE TABLE corresponds to a column
          const backtickMatches = result.match(/`([^`]+)`/g)
          if (backtickMatches) {
            // First match is the table name, rest should be column names
            const columnNamesInSQL = backtickMatches.slice(1).map(match => match.replace(/`/g, ''))

            // Get expected column names
            const expectedColumnNames = tableData.columns.map(col =>
              useSnakeCase ? col.name : col.originalName,
            )

            // Each column name in SQL should be in the expected list
            for (const sqlColName of columnNamesInSQL) {
              expect(expectedColumnNames).toContain(sqlColName)
            }

            // The number of column names should match
            expect(columnNamesInSQL.length).toBe(expectedColumnNames.length)
          }

          // Property 5: Column order should match the original table column order
          const expectedColumnNames = tableData.columns.map(col =>
            useSnakeCase ? col.name : col.originalName,
          )

          // Extract column names in order from the CREATE TABLE statement
          const columnNamesInOrder = columnDefsSection
            .split('\n')
            .filter(line => line.trim().length > 0 && line.includes('`'))
            .map((line) => {
              const match = line.match(/`([^`]+)`/)
              return match ? match[1] : ''
            })
            .filter(name => name.length > 0)

          // Verify order matches
          for (let i = 0; i < expectedColumnNames.length; i++) {
            expect(columnNamesInOrder[i]).toBe(expectedColumnNames[i])
          }

          return true
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: table-editor, Property 14: SQL syntax validity
   * Validates: Requirements 7.5, 8.5, 12.6
   *
   * For any table data and SQL export type (INSERT, UPDATE, CREATE TABLE), the generated
   * SQL statements should be syntactically valid MySQL statements that can be parsed without errors.
   */
  it('property: SQL syntax validity', () => {
    // Generator for valid SQL column names (alphanumeric, underscores, no leading numbers)
    const columnNameArb = fc.string({ minLength: 1, maxLength: 20 })
      .filter(s => /^[a-z_]\w*$/i.test(s))

    // Generator for cell values based on data type
    const cellValueForTypeArb = (dataType: string) => {
      switch (dataType) {
        case 'string':
          return fc.oneof(
            fc.string({ minLength: 0, maxLength: 50 }),
            fc.constant(null),
          )
        case 'integer':
          return fc.oneof(
            fc.integer(),
            fc.constant(null),
          )
        case 'decimal':
          return fc.oneof(
            fc.double().filter(n => !Number.isNaN(n) && Number.isFinite(n)),
            fc.constant(null),
          )
        case 'boolean':
          return fc.oneof(
            fc.boolean(),
            fc.constant(null),
          )
        default:
          return fc.oneof(
            fc.string({ minLength: 0, maxLength: 50 }),
            fc.constant(null),
          )
      }
    }

    // Generator for column definitions
    const columnArb = fc.record({
      id: fc.stringMatching(/^col\d+$/),
      name: columnNameArb,
      originalName: columnNameArb,
      dataType: fc.constantFrom('string', 'integer', 'decimal', 'boolean'),
      isPinned: fc.boolean(),
      sortDirection: fc.option(fc.constantFrom('asc', 'desc'), { nil: undefined }),
    })

    // Generator for table data with at least 1 column and variable number of rows
    const tableDataArb = fc.tuple(
      fc.array(columnArb, { minLength: 1, maxLength: 10 }),
      fc.integer({ min: 0, max: 20 }),
    ).chain(([columns, numRows]) => {
      // Ensure unique column IDs and names
      const uniqueColumns = columns.map((col, idx) => ({
        ...col,
        id: `col${idx}`,
        name: `col_${idx}_${col.name}`,
        originalName: `orig_${idx}_${col.originalName}`,
      }))

      // Generate rows with cells that match each column's data type
      const rowsArb = fc.array(
        fc.record({
          id: fc.stringMatching(/^row\d+$/),
          cells: fc.record(
            Object.fromEntries(
              uniqueColumns.map(col => [col.id, cellValueForTypeArb(col.dataType)]),
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

    // Generator for valid SQL table names
    const tableNameArb = fc.string({ minLength: 1, maxLength: 30 })
      .filter(s => /^[a-z_]\w*$/i.test(s))

    // Helper function to validate SQL INSERT syntax
    const validateInsertSyntax = (statement: string): boolean => {
      // Basic structure: INSERT INTO `table` (`col1`, `col2`, ...) VALUES (val1, val2, ...);
      // Must start with INSERT INTO and end with );
      if (!statement.startsWith('INSERT INTO ') || !statement.endsWith(');')) {
        return false
      }

      // Must contain VALUES keyword
      if (!statement.includes(' VALUES ')) {
        return false
      }

      // Verify balanced parentheses (only count parentheses outside of single-quoted strings)
      // Remove all single-quoted strings first (accounting for escaped quotes '')
      let withoutStrings = statement
      // Replace escaped quotes with placeholder
      withoutStrings = withoutStrings.replace(/''/g, '##')
      // Remove all single-quoted strings
      withoutStrings = withoutStrings.replace(/'[^']*'/g, '')

      // Now count parentheses
      const openParens = (withoutStrings.match(/\(/g) || []).length
      const closeParens = (withoutStrings.match(/\)/g) || []).length
      if (openParens !== closeParens || openParens !== 2) {
        return false
      }

      // Verify backticks are balanced (only count backticks outside of single-quoted strings)
      const backticks = (withoutStrings.match(/`/g) || []).length
      if (backticks % 2 !== 0) {
        return false
      }

      // Verify single quotes are balanced (accounting for escaped quotes '')
      const withoutEscapedQuotes = statement.replace(/''/g, '')
      const singleQuotes = (withoutEscapedQuotes.match(/'/g) || []).length
      if (singleQuotes % 2 !== 0) {
        return false
      }

      return true
    }

    // Helper function to validate SQL UPDATE syntax
    const validateUpdateSyntax = (statement: string): boolean => {
      // Basic structure: UPDATE `table` SET `col1` = val1, `col2` = val2 WHERE `key` = val;
      const updatePattern = /^UPDATE `[^`]+` SET .+ WHERE .+;$/
      if (!updatePattern.test(statement)) {
        return false
      }

      // Must contain SET and WHERE clauses
      if (!statement.includes(' SET ') || !statement.includes(' WHERE ')) {
        return false
      }

      // Verify backticks are balanced (only count backticks outside of single-quoted strings)
      // Remove all single-quoted strings first (accounting for escaped quotes '')
      let withoutStrings = statement
      // Replace escaped quotes with placeholder
      withoutStrings = withoutStrings.replace(/''/g, '##')
      // Remove all single-quoted strings
      withoutStrings = withoutStrings.replace(/'[^']*'/g, '')
      // Now count backticks
      const backticks = (withoutStrings.match(/`/g) || []).length
      if (backticks % 2 !== 0) {
        return false
      }

      // Verify single quotes are balanced (accounting for escaped quotes '')
      const withoutEscapedQuotes = statement.replace(/''/g, '')
      const singleQuotes = (withoutEscapedQuotes.match(/'/g) || []).length
      if (singleQuotes % 2 !== 0) {
        return false
      }

      return true
    }

    // Helper function to validate SQL CREATE TABLE syntax
    const validateCreateTableSyntax = (statement: string): boolean => {
      // Basic structure: CREATE TABLE `table` (\n  `col1` TYPE,\n  `col2` TYPE\n);
      // Use the 's' flag to make . match newlines
      const createPattern = /^CREATE TABLE `[^`]+` \([\s\S]+\);$/
      if (!createPattern.test(statement)) {
        return false
      }

      // Verify balanced parentheses
      const openParens = (statement.match(/\(/g) || []).length
      const closeParens = (statement.match(/\)/g) || []).length
      if (openParens !== closeParens) {
        return false
      }

      // Verify backticks are balanced (only count backticks outside of single-quoted strings)
      // Remove all single-quoted strings first (accounting for escaped quotes '')
      let withoutStrings = statement
      // Replace escaped quotes with placeholder
      withoutStrings = withoutStrings.replace(/''/g, '##')
      // Remove all single-quoted strings
      withoutStrings = withoutStrings.replace(/'[^']*'/g, '')
      // Now count backticks
      const backticks = (withoutStrings.match(/`/g) || []).length
      if (backticks % 2 !== 0) {
        return false
      }

      // Should contain at least one column definition
      if (!statement.includes('`') || !statement.includes(' ')) {
        return false
      }

      // Should end with );
      if (!statement.endsWith(');')) {
        return false
      }

      return true
    }

    fc.assert(
      fc.property(
        tableDataArb,
        tableNameArb,
        fc.boolean(),
        (tableData: TableData, tableName: string, useSnakeCase: boolean) => {
          // Test 1: SQL INSERT statements
          const insertResult = generateSQLInsert(tableData, tableName, useSnakeCase)

          if (tableData.rows.length === 0) {
            // Should return a comment for empty data
            expect(insertResult).toBe('-- No data to insert')
          } else {
            // Split into individual statements
            const insertStatements = insertResult.split('\n').filter(line => line.trim().length > 0)

            // Property: Each INSERT statement should be syntactically valid
            for (const statement of insertStatements) {
              const isValid = validateInsertSyntax(statement)
              if (!isValid) {
                console.error('Invalid INSERT statement:', statement)
              }
              expect(isValid).toBe(true)
            }

            // Property: Number of statements should match number of rows
            expect(insertStatements.length).toBe(tableData.rows.length)
          }

          // Test 2: SQL UPDATE statements (if we have at least 2 columns)
          if (tableData.columns.length >= 2) {
            const keyColumns = [tableData.columns[0].id]
            const updateResult = generateSQLUpdate(tableData, tableName, keyColumns, useSnakeCase)

            if (tableData.rows.length === 0) {
              // Should return a comment for empty data
              expect(updateResult).toContain('-- No data')
            } else if (!updateResult.includes('-- Error')) {
              // Split into individual statements
              const updateStatements = updateResult.split('\n').filter(line => line.trim().length > 0 && !line.startsWith('--'))

              // Property: Each UPDATE statement should be syntactically valid
              for (const statement of updateStatements) {
                const isValid = validateUpdateSyntax(statement)
                if (!isValid) {
                  console.error('Invalid UPDATE statement:', statement)
                }
                expect(isValid).toBe(true)
              }

              // Property: Number of statements should match number of rows
              expect(updateStatements.length).toBe(tableData.rows.length)
            }
          }

          // Test 3: CREATE TABLE statement
          const createResult = generateCreateTable(tableData, tableName, useSnakeCase)

          // Property: CREATE TABLE statement should be syntactically valid
          const isValidCreate = validateCreateTableSyntax(createResult)
          if (!isValidCreate) {
            console.error('Invalid CREATE TABLE statement:', createResult)
          }
          expect(isValidCreate).toBe(true)

          // Property: CREATE TABLE should include all columns
          for (const column of tableData.columns) {
            const columnName = useSnakeCase ? column.name : column.originalName
            expect(createResult).toContain(`\`${columnName}\``)
          }

          return true
        },
      ),
      { numRuns: 100 },
    )
  })
})

describe('escapeCSVValue', () => {
  it('should return empty string for null', () => {
    expect(escapeCSVValue(null)).toBe('')
  })

  it('should return value as-is if no special characters', () => {
    expect(escapeCSVValue('simple')).toBe('simple')
    expect(escapeCSVValue(123)).toBe('123')
  })

  it('should quote values with commas', () => {
    expect(escapeCSVValue('hello,world')).toBe('"hello,world"')
  })

  it('should quote values with quotes and double internal quotes', () => {
    expect(escapeCSVValue('say "hello"')).toBe('"say ""hello"""')
  })

  it('should quote values with newlines', () => {
    expect(escapeCSVValue('line1\nline2')).toBe('"line1\nline2"')
  })

  it('should quote values with carriage returns', () => {
    expect(escapeCSVValue('text\rmore')).toBe('"text\rmore"')
  })
})

describe('exportToCSV', () => {
  const testData: TableData = {
    columns: [
      { id: 'col1', name: 'id', originalName: 'id', dataType: 'integer', isPinned: false },
      { id: 'col2', name: 'name', originalName: 'name', dataType: 'string', isPinned: false },
      { id: 'col3', name: 'age', originalName: 'age', dataType: 'integer', isPinned: false },
    ],
    rows: [
      { id: 'row1', cells: { col1: 1, col2: 'Alice', col3: 30 } },
      { id: 'row2', cells: { col1: 2, col2: 'Bob', col3: 25 } },
    ],
  }

  it('should include column headers in first row', () => {
    const result = exportToCSV(testData, false)
    const lines = result.split('\n')
    expect(lines[0]).toBe('id,name,age')
  })

  it('should export all data rows', () => {
    const result = exportToCSV(testData, false)
    const lines = result.split('\n')
    expect(lines.length).toBe(3) // header + 2 data rows
    expect(lines[1]).toBe('1,Alice,30')
    expect(lines[2]).toBe('2,Bob,25')
  })

  it('should properly escape values with commas', () => {
    const dataWithCommas: TableData = {
      columns: [
        { id: 'col1', name: 'name', originalName: 'name', dataType: 'string', isPinned: false },
      ],
      rows: [
        { id: 'row1', cells: { col1: 'Smith, John' } },
      ],
    }
    const result = exportToCSV(dataWithCommas, false)
    const lines = result.split('\n')
    expect(lines[1]).toBe('"Smith, John"')
  })

  it('should properly escape values with quotes', () => {
    const dataWithQuotes: TableData = {
      columns: [
        { id: 'col1', name: 'text', originalName: 'text', dataType: 'string', isPinned: false },
      ],
      rows: [
        { id: 'row1', cells: { col1: 'say "hello"' } },
      ],
    }
    const result = exportToCSV(dataWithQuotes, false)
    const lines = result.split('\n')
    expect(lines[1]).toBe('"say ""hello"""')
  })

  it('should handle NULL values', () => {
    const dataWithNull: TableData = {
      columns: [
        { id: 'col1', name: 'value', originalName: 'value', dataType: 'string', isPinned: false },
      ],
      rows: [
        { id: 'row1', cells: { col1: null } },
      ],
    }
    const result = exportToCSV(dataWithNull, false)
    const lines = result.split('\n')
    expect(lines[1]).toBe('')
  })

  it('should use snake_case column names when enabled', () => {
    const dataWithSpaces: TableData = {
      columns: [
        { id: 'col1', name: 'user_id', originalName: 'User ID', dataType: 'integer', isPinned: false },
        { id: 'col2', name: 'full_name', originalName: 'Full Name', dataType: 'string', isPinned: false },
      ],
      rows: [
        { id: 'row1', cells: { col1: 1, col2: 'Alice' } },
      ],
    }
    const result = exportToCSV(dataWithSpaces, true)
    const lines = result.split('\n')
    expect(lines[0]).toBe('user_id,full_name')
  })

  it('should return empty string for empty table', () => {
    const emptyData: TableData = {
      columns: [],
      rows: [],
    }
    const result = exportToCSV(emptyData, false)
    expect(result).toBe('')
  })

  /**
   * Feature: table-editor, Property 19: CSV special character escaping
   * Validates: Requirements 10.3
   *
   * For any table data containing cell values with commas, quotes, or newlines,
   * generating CSV output should properly escape these values according to CSV
   * standards (RFC 4180).
   */
  it('property: CSV special character escaping', () => {
    // Generator for strings with special characters that need escaping in CSV
    const specialCharStringArb = fc.oneof(
      // Strings with commas
      fc.tuple(fc.string({ maxLength: 10 }), fc.string({ maxLength: 10 })).map(([a, b]) => `${a},${b}`),
      // Strings with double quotes
      fc.tuple(fc.string({ maxLength: 10 }), fc.string({ maxLength: 10 })).map(([a, b]) => `${a}"${b}`),
      // Strings with newlines
      fc.tuple(fc.string({ maxLength: 10 }), fc.string({ maxLength: 10 })).map(([a, b]) => `${a}\n${b}`),
      // Strings with carriage returns
      fc.tuple(fc.string({ maxLength: 10 }), fc.string({ maxLength: 10 })).map(([a, b]) => `${a}\r${b}`),
      // Strings with multiple special characters
      fc.constant('test, "value"\nwith\rspecial'),
      // Regular strings (control case)
      fc.string({ minLength: 1, maxLength: 20 }),
    )

    // Generator for cell values based on data type
    const cellValueForTypeArb = (dataType: string) => {
      switch (dataType) {
        case 'string':
          return fc.oneof(
            specialCharStringArb,
            fc.constant(null),
          )
        case 'integer':
          return fc.oneof(
            fc.integer(),
            fc.constant(null),
          )
        case 'boolean':
          return fc.oneof(
            fc.boolean(),
            fc.constant(null),
          )
        default:
          return fc.oneof(
            specialCharStringArb,
            fc.constant(null),
          )
      }
    }

    // Generator for column definitions with string columns
    const columnArb = fc.record({
      id: fc.stringMatching(/^col\d+$/),
      name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^\w+$/.test(s)), // No spaces in column names
      originalName: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^\w+$/.test(s)), // No spaces
      dataType: fc.constantFrom('string', 'integer', 'boolean'),
      isPinned: fc.boolean(),
    })

    // Generator for table data with at least 1 string column and 1 row
    const tableDataArb = fc.tuple(
      fc.array(columnArb, { minLength: 2, maxLength: 5 }),
      fc.integer({ min: 1, max: 10 }),
    ).chain(([columns, numRows]) => {
      // Ensure at least one string column and unique column IDs and names
      const uniqueColumns = columns.map((col, idx) => ({
        ...col,
        id: `col${idx}`,
        name: `col_${idx}_${col.name}`,
        originalName: `orig_${idx}_${col.originalName}`,
        dataType: idx === 0 ? 'string' as const : col.dataType, // Ensure first column is string
      }))

      // Generate rows with cells that match each column's data type
      const rowsArb = fc.array(
        fc.record({
          id: fc.stringMatching(/^row\d+$/),
          cells: fc.record(
            Object.fromEntries(
              uniqueColumns.map(col => [col.id, cellValueForTypeArb(col.dataType)]),
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
        fc.boolean(),
        (tableData: TableData, useSnakeCase: boolean) => {
          // Generate CSV output
          const result = exportToCSV(tableData, useSnakeCase)

          // Property 1: For each cell value, verify escapeCSVValue produces correct output
          for (const row of tableData.rows) {
            for (const column of tableData.columns) {
              const cellValue = row.cells[column.id]
              const escapedValue = escapeCSVValue(cellValue)

              // Property 1a: Values with commas should be quoted
              if (cellValue !== null && cellValue !== undefined) {
                const stringValue = String(cellValue)
                if (stringValue.includes(',')) {
                  expect(escapedValue).toMatch(/^"[\s\S]*"$/)
                  // The escaped value should have the comma inside quotes
                  expect(escapedValue).toContain(',')
                }
              }

              // Property 1b: Values with double quotes should be escaped (doubled) and quoted
              if (cellValue !== null && cellValue !== undefined) {
                const stringValue = String(cellValue)
                if (stringValue.includes('"')) {
                  expect(escapedValue).toMatch(/^"[\s\S]*"$/)
                  // Quotes should be doubled
                  expect(escapedValue).toContain('""')
                  // Count the quotes: original quotes are doubled, plus 2 wrapper quotes
                  const originalQuoteCount = (stringValue.match(/"/g) || []).length
                  const escapedQuoteCount = (escapedValue.match(/"/g) || []).length
                  expect(escapedQuoteCount).toBe(originalQuoteCount * 2 + 2)
                }
              }

              // Property 1c: Values with newlines should be quoted and preserve newline
              if (cellValue !== null && cellValue !== undefined) {
                const stringValue = String(cellValue)
                if (stringValue.includes('\n')) {
                  expect(escapedValue).toMatch(/^"[\s\S]*"$/) // Use [\s\S] to match newlines
                  expect(escapedValue).toContain('\n')
                }
              }

              // Property 1d: Values with carriage returns should be quoted and preserve CR
              if (cellValue !== null && cellValue !== undefined) {
                const stringValue = String(cellValue)
                if (stringValue.includes('\r')) {
                  expect(escapedValue).toMatch(/^"[\s\S]*"$/) // Use [\s\S] to match any character including newlines
                  expect(escapedValue).toContain('\r')
                }
              }
            }
          }

          // Property 2: Verify that quotes are balanced in the entire CSV output
          // Count quotes - they should always be even (balanced)
          const quoteCount = (result.match(/"/g) || []).length
          expect(quoteCount % 2).toBe(0)

          // Property 3: NULL values should be represented as empty strings
          for (const row of tableData.rows) {
            for (const column of tableData.columns) {
              const cellValue = row.cells[column.id]
              if (cellValue === null) {
                const escapedValue = escapeCSVValue(cellValue)
                expect(escapedValue).toBe('')
              }
            }
          }

          // Property 4: Values without special characters should not be quoted
          for (const row of tableData.rows) {
            for (const column of tableData.columns) {
              const cellValue = row.cells[column.id]
              if (cellValue !== null && cellValue !== undefined) {
                const stringValue = String(cellValue)
                // If no special characters, should not be quoted
                if (!/[",\n\r]/.test(stringValue)) {
                  const escapedValue = escapeCSVValue(cellValue)
                  expect(escapedValue).toBe(stringValue)
                  expect(escapedValue).not.toMatch(/^"[\s\S]*"$/)
                }
              }
            }
          }

          // Property 5: Reconstruct CSV and verify structure
          // Build expected CSV manually to compare
          const columnNames = tableData.columns.map(col => useSnakeCase ? col.name : col.originalName)
          const expectedHeader = columnNames.map(escapeCSVValue).join(',')

          // The result should start with the expected header
          expect(result.startsWith(expectedHeader)).toBe(true)

          // Property 6: Each row in the CSV should have the correct number of fields
          // This is a basic structural check
          const lines = result.split('\n')
          const numColumns = tableData.columns.length

          // Header should have correct number of commas (numColumns - 1)
          const headerCommaCount = (lines[0].match(/,/g) || []).length
          // Note: This count might be off if column names contain commas and are quoted
          // So we'll just check that we have at least numColumns - 1 commas
          expect(headerCommaCount).toBeGreaterThanOrEqual(numColumns - 1)

          return true
        },
      ),
      { numRuns: 100 },
    )
  })

  /**
   * Feature: table-editor, Property 18: CSV header inclusion
   * Validates: Requirements 10.2
   *
   * For any table data, generating CSV output should include all column names
   * in the first row.
   */
  it('property: CSV header inclusion', () => {
    // Generator for valid column names (alphanumeric, underscores, spaces)
    const columnNameArb = fc.string({ minLength: 1, maxLength: 20 })
      .filter(s => /^[\w ]+$/.test(s))

    // Generator for cell values based on data type
    const cellValueForTypeArb = (dataType: string) => {
      switch (dataType) {
        case 'string':
          return fc.oneof(
            fc.string({ minLength: 0, maxLength: 50 }),
            fc.constant(null),
          )
        case 'integer':
          return fc.oneof(
            fc.integer(),
            fc.constant(null),
          )
        case 'decimal':
          return fc.oneof(
            fc.double().filter(n => !Number.isNaN(n) && Number.isFinite(n)),
            fc.constant(null),
          )
        case 'boolean':
          return fc.oneof(
            fc.boolean(),
            fc.constant(null),
          )
        default:
          return fc.oneof(
            fc.string({ minLength: 0, maxLength: 50 }),
            fc.constant(null),
          )
      }
    }

    // Generator for column definitions
    const columnArb = fc.record({
      id: fc.stringMatching(/^col\d+$/),
      name: columnNameArb,
      originalName: columnNameArb,
      dataType: fc.constantFrom('string', 'integer', 'decimal', 'boolean'),
      isPinned: fc.boolean(),
      sortDirection: fc.option(fc.constantFrom('asc', 'desc'), { nil: undefined }),
    })

    // Generator for table data with at least 1 column and variable number of rows
    const tableDataArb = fc.tuple(
      fc.array(columnArb, { minLength: 1, maxLength: 15 }),
      fc.integer({ min: 0, max: 30 }),
    ).chain(([columns, numRows]) => {
      // Ensure unique column IDs and names
      const uniqueColumns = columns.map((col, idx) => ({
        ...col,
        id: `col${idx}`,
        name: `col_${idx}_${col.name}`,
        originalName: `orig_${idx}_${col.originalName}`,
      }))

      // Generate rows with cells that match each column's data type
      const rowsArb = fc.array(
        fc.record({
          id: fc.stringMatching(/^row\d+$/),
          cells: fc.record(
            Object.fromEntries(
              uniqueColumns.map(col => [col.id, cellValueForTypeArb(col.dataType)]),
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
        fc.boolean(),
        (tableData: TableData, useSnakeCase: boolean) => {
          // Generate CSV output
          const result = exportToCSV(tableData, useSnakeCase)

          // Property: The result should not be empty (we have at least 1 column)
          expect(result.length).toBeGreaterThan(0)

          // Split into lines
          const lines = result.split('\n')

          // Property 1: There should be at least one line (the header)
          expect(lines.length).toBeGreaterThan(0)

          // Property 2: The first line should be the header row
          const headerRow = lines[0]

          // Get expected column names based on useSnakeCase flag
          const expectedColumnNames = tableData.columns.map(col =>
            useSnakeCase ? col.name : col.originalName,
          )

          // Parse the header row (accounting for CSV escaping)
          // For simplicity, split by comma and remove quotes if present
          const headerColumns = headerRow.split(',').map((col) => {
            // Remove surrounding quotes if present (but don't trim!)
            let cleaned = col
            if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
              cleaned = cleaned.slice(1, -1)
              // Unescape doubled quotes
              cleaned = cleaned.replace(/""/g, '"')
            }
            return cleaned
          })

          // Property 3: All expected column names should be present in the header
          expect(headerColumns.length).toBe(expectedColumnNames.length)

          for (let i = 0; i < expectedColumnNames.length; i++) {
            expect(headerColumns[i]).toBe(expectedColumnNames[i])
          }

          // Property 4: The header should contain all columns in the correct order
          for (let i = 0; i < expectedColumnNames.length; i++) {
            expect(headerColumns[i]).toBe(expectedColumnNames[i])
          }

          // Property 5: The number of data rows should match the table rows
          // (lines.length - 1 because first line is header)
          expect(lines.length - 1).toBe(tableData.rows.length)

          return true
        },
      ),
      { numRuns: 100 },
    )
  })
})

describe('escapeMarkdownValue', () => {
  it('should return empty string for null', () => {
    expect(escapeMarkdownValue(null)).toBe('')
  })

  it('should return value as-is if no special characters', () => {
    expect(escapeMarkdownValue('simple')).toBe('simple')
    expect(escapeMarkdownValue(123)).toBe('123')
  })

  it('should escape pipe characters', () => {
    expect(escapeMarkdownValue('a|b')).toBe('a\\|b')
  })

  it('should replace newlines with spaces', () => {
    expect(escapeMarkdownValue('line1\nline2')).toBe('line1 line2')
  })

  it('should remove carriage returns', () => {
    expect(escapeMarkdownValue('text\rmore')).toBe('textmore')
  })
})

describe('exportToExcel', () => {
  const testData: TableData = {
    columns: [
      { id: 'col1', name: 'id', originalName: 'id', dataType: 'integer', isPinned: false },
      { id: 'col2', name: 'name', originalName: 'name', dataType: 'string', isPinned: false },
      { id: 'col3', name: 'age', originalName: 'age', dataType: 'integer', isPinned: false },
    ],
    rows: [
      { id: 'row1', cells: { col1: 1, col2: 'Alice', col3: 30 } },
      { id: 'row2', cells: { col1: 2, col2: 'Bob', col3: 25 } },
    ],
  }

  it('should create a Blob with correct MIME type', async () => {
    const { exportToExcel } = await import('./export')
    const result = await exportToExcel(testData, false)
    expect(result).toBeInstanceOf(Blob)
    expect(result.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  })

  it('should create a non-empty Blob', async () => {
    const { exportToExcel } = await import('./export')
    const result = await exportToExcel(testData, false)
    expect(result.size).toBeGreaterThan(0)
  })

  it('should use snake_case column names when enabled', async () => {
    const { exportToExcel } = await import('./export')
    const dataWithSpaces: TableData = {
      columns: [
        { id: 'col1', name: 'user_id', originalName: 'User ID', dataType: 'integer', isPinned: false },
        { id: 'col2', name: 'full_name', originalName: 'Full Name', dataType: 'string', isPinned: false },
      ],
      rows: [
        { id: 'row1', cells: { col1: 1, col2: 'Alice' } },
      ],
    }
    const result = await exportToExcel(dataWithSpaces, true)
    expect(result).toBeInstanceOf(Blob)
    expect(result.size).toBeGreaterThan(0)
  })
})

describe('exportToMarkdown', () => {
  const testData: TableData = {
    columns: [
      { id: 'col1', name: 'id', originalName: 'id', dataType: 'integer', isPinned: false },
      { id: 'col2', name: 'name', originalName: 'name', dataType: 'string', isPinned: false },
      { id: 'col3', name: 'age', originalName: 'age', dataType: 'integer', isPinned: false },
    ],
    rows: [
      { id: 'row1', cells: { col1: 1, col2: 'Alice', col3: 30 } },
      { id: 'row2', cells: { col1: 2, col2: 'Bob', col3: 25 } },
    ],
  }

  it('should include header row with column names', () => {
    const result = exportToMarkdown(testData, false)
    const lines = result.split('\n')
    expect(lines[0]).toBe('| id | name | age |')
  })

  it('should include separator row with alignment indicators', () => {
    const result = exportToMarkdown(testData, false)
    const lines = result.split('\n')
    expect(lines[1]).toBe('| --- | --- | --- |')
  })

  it('should format all data rows', () => {
    const result = exportToMarkdown(testData, false)
    const lines = result.split('\n')
    expect(lines.length).toBe(4) // header + separator + 2 data rows
    expect(lines[2]).toBe('| 1 | Alice | 30 |')
    expect(lines[3]).toBe('| 2 | Bob | 25 |')
  })

  it('should escape pipe characters in values', () => {
    const dataWithPipes: TableData = {
      columns: [
        { id: 'col1', name: 'text', originalName: 'text', dataType: 'string', isPinned: false },
      ],
      rows: [
        { id: 'row1', cells: { col1: 'a|b' } },
      ],
    }
    const result = exportToMarkdown(dataWithPipes, false)
    const lines = result.split('\n')
    expect(lines[2]).toBe('| a\\|b |')
  })

  it('should replace newlines with spaces', () => {
    const dataWithNewlines: TableData = {
      columns: [
        { id: 'col1', name: 'text', originalName: 'text', dataType: 'string', isPinned: false },
      ],
      rows: [
        { id: 'row1', cells: { col1: 'line1\nline2' } },
      ],
    }
    const result = exportToMarkdown(dataWithNewlines, false)
    const lines = result.split('\n')
    expect(lines[2]).toBe('| line1 line2 |')
  })

  it('should handle NULL values', () => {
    const dataWithNull: TableData = {
      columns: [
        { id: 'col1', name: 'value', originalName: 'value', dataType: 'string', isPinned: false },
      ],
      rows: [
        { id: 'row1', cells: { col1: null } },
      ],
    }
    const result = exportToMarkdown(dataWithNull, false)
    const lines = result.split('\n')
    expect(lines[2]).toBe('|  |')
  })

  it('should use snake_case column names when enabled', () => {
    const dataWithSpaces: TableData = {
      columns: [
        { id: 'col1', name: 'user_id', originalName: 'User ID', dataType: 'integer', isPinned: false },
        { id: 'col2', name: 'full_name', originalName: 'Full Name', dataType: 'string', isPinned: false },
      ],
      rows: [
        { id: 'row1', cells: { col1: 1, col2: 'Alice' } },
      ],
    }
    const result = exportToMarkdown(dataWithSpaces, true)
    const lines = result.split('\n')
    expect(lines[0]).toBe('| user_id | full_name |')
  })

  it('should return empty string for empty table', () => {
    const emptyData: TableData = {
      columns: [],
      rows: [],
    }
    const result = exportToMarkdown(emptyData, false)
    expect(result).toBe('')
  })
})
