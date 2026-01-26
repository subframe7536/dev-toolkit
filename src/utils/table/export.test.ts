import type { TableData } from './types'

import { describe, expect, it } from 'bun:test'

import { escapeCSVValue, escapeMarkdownValue, escapeSQLString, exportToCSV, exportToMarkdown, formatSQLValue, generateCreateTable, generateSQLInsert, generateSQLUpdate } from './export'

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
    const result = generateSQLInsert(testData, 'users', 'original')
    expect(result).toContain('INSERT INTO `users`')
  })

  it('should include all column names', () => {
    const result = generateSQLInsert(testData, 'users', 'original')
    expect(result).toContain('`id`, `name`, `age`')
  })

  it('should generate one statement per row', () => {
    const result = generateSQLInsert(testData, 'users', 'original')
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
    const result = generateSQLInsert(dataWithQuotes, 'users', 'original')
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
    const result = generateSQLInsert(dataWithNull, 'users', 'original')
    expect(result).toContain('NULL')
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
    const result = generateSQLUpdate(testData, 'users', ['col1'], 'original')
    expect(result).toContain('UPDATE `users`')
  })

  it('should include SET clause with non-key columns', () => {
    const result = generateSQLUpdate(testData, 'users', ['col1'], 'original')
    expect(result).toContain('SET `name` =')
    expect(result).toContain('`age` =')
  })

  it('should include WHERE clause with key columns', () => {
    const result = generateSQLUpdate(testData, 'users', ['col1'], 'original')
    expect(result).toContain('WHERE `id` = 1')
  })

  it('should generate one statement per row', () => {
    const result = generateSQLUpdate(testData, 'users', ['col1'], 'original')
    const statements = result.split('\n')
    expect(statements.length).toBe(2)
  })

  it('should handle multiple key columns', () => {
    const result = generateSQLUpdate(testData, 'users', ['col1', 'col2'], 'original')
    expect(result).toContain('WHERE `id` = 1 AND `name` = \'Alice\'')
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
    const result = generateCreateTable(testData, 'users', 'original')
    expect(result).toContain('CREATE TABLE `users`')
  })

  it('should include all columns with data types', () => {
    const result = generateCreateTable(testData, 'users', 'original')
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
    const result = generateCreateTable(dataWithTypes, 'products', 'original')
    expect(result).toContain('`price` DECIMAL(10,2)')
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
    const result = exportToCSV(testData, 'original')
    const lines = result.split('\n')
    expect(lines[0]).toBe('id,name,age')
  })

  it('should export all data rows', () => {
    const result = exportToCSV(testData, 'original')
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
    const result = exportToCSV(dataWithCommas, 'original')
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
    const result = exportToCSV(dataWithQuotes, 'original')
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
    const result = exportToCSV(dataWithNull, 'original')
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
    const result = exportToCSV(dataWithSpaces, 'snake_case')
    const lines = result.split('\n')
    expect(lines[0]).toBe('user_id,full_name')
  })

  it('should return empty string for empty table', () => {
    const emptyData: TableData = {
      columns: [],
      rows: [],
    }
    const result = exportToCSV(emptyData, 'original')
    expect(result).toBe('')
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
    const result = await exportToExcel(testData, 'original')
    expect(result).toBeInstanceOf(Blob)
    expect(result.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  })

  it('should create a non-empty Blob', async () => {
    const { exportToExcel } = await import('./export')
    const result = await exportToExcel(testData, 'original')
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
    const result = await exportToExcel(dataWithSpaces, 'snake_case')
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
    const result = exportToMarkdown(testData, 'original')
    const lines = result.split('\n')
    expect(lines[0]).toBe('| id | name | age |')
  })

  it('should include separator row with alignment indicators', () => {
    const result = exportToMarkdown(testData, 'original')
    const lines = result.split('\n')
    expect(lines[1]).toBe('| --- | --- | --- |')
  })

  it('should format all data rows', () => {
    const result = exportToMarkdown(testData, 'original')
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
    const result = exportToMarkdown(dataWithPipes, 'original')
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
    const result = exportToMarkdown(dataWithNewlines, 'original')
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
    const result = exportToMarkdown(dataWithNull, 'original')
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
    const result = exportToMarkdown(dataWithSpaces, 'snake_case')
    const lines = result.split('\n')
    expect(lines[0]).toBe('| user_id | full_name |')
  })

  it('should return empty string for empty table', () => {
    const emptyData: TableData = {
      columns: [],
      rows: [],
    }
    const result = exportToMarkdown(emptyData, 'original')
    expect(result).toBe('')
  })
})
