import type { CellValue, DataType, TableData } from './types'

/**
 * Escape SQL string values by doubling single quotes and handling special characters
 */
export function escapeSQLString(value: string): string {
  // Replace single quotes with two single quotes (SQL standard escaping)
  // Also handle backslashes for MySQL compatibility
  return value
    .replace(/\\/g, '\\\\') // Escape backslashes first
    .replace(/'/g, '\'\'') // Escape single quotes
    .replace(/\n/g, '\\n') // Escape newlines
    .replace(/\r/g, '\\r') // Escape carriage returns
    .replace(/\t/g, '\\t') // Escape tabs
}

/**
 * Format a cell value for SQL based on its data type
 */
export function formatSQLValue(value: CellValue, dataType: DataType): string {
  // Handle NULL values
  if (value === null || value === undefined) {
    return 'NULL'
  }

  // Handle different data types
  switch (dataType) {
    case 'string':
    case 'integer':
    case 'decimal':
      // Numeric types don't need quotes
      return String(value)

    case 'boolean':
      // Convert boolean to 1/0 for MySQL compatibility
      return value ? '1' : '0'

    default:
      // Default to string handling
      return `'${escapeSQLString(String(value))}'`
  }
}

/**
 * Get SQL type string for CREATE TABLE based on data type
 */
export function getSQLType(dataType: DataType): string {
  switch (dataType) {
    case 'integer':
      return 'INT'
    case 'decimal':
      return 'DECIMAL(10,2)'
    case 'boolean':
      return 'BOOLEAN'
    case 'string':
    default:
      return 'VARCHAR(255)'
  }
}

/**
 * Generate SQL INSERT statements from table data
 */
export function generateSQLInsert(
  data: TableData,
  tableName: string,
  useSnakeCase: boolean = false,
): string {
  if (data.rows.length === 0) {
    return '-- No data to insert'
  }

  // Get column names (use snake_case if requested)
  const columnNames = data.columns.map(col => useSnakeCase ? col.name : col.originalName)
  const columnIds = data.columns.map(col => col.id)

  // Build column list
  const columnList = columnNames.map(name => `\`${name}\``).join(', ')

  // Generate INSERT statements for each row
  const statements = data.rows.map((row) => {
    const values = columnIds.map((colId, index) => {
      const value = row.cells[colId]
      const dataType = data.columns[index].dataType
      return formatSQLValue(value, dataType)
    }).join(', ')

    return `INSERT INTO \`${tableName}\` (${columnList}) VALUES (${values});`
  })

  return statements.join('\n')
}

/**
 * Generate SQL UPDATE statements from table data
 */
export function generateSQLUpdate(
  data: TableData,
  tableName: string,
  keyColumns: string[],
  useSnakeCase: boolean = false,
): string {
  if (data.rows.length === 0) {
    return '-- No data to update'
  }

  if (keyColumns.length === 0) {
    return '-- Error: No key columns specified for UPDATE statements'
  }

  // Find key column definitions
  const keyColumnDefs = data.columns.filter(col =>
    keyColumns.includes(col.id) || keyColumns.includes(col.name) || keyColumns.includes(col.originalName),
  )

  if (keyColumnDefs.length === 0) {
    return '-- Error: Specified key columns not found in table'
  }

  // Get non-key columns for SET clause
  const nonKeyColumns = data.columns.filter(col =>
    !keyColumnDefs.some(keyCol => keyCol.id === col.id),
  )

  if (nonKeyColumns.length === 0) {
    return '-- Error: No non-key columns available for SET clause'
  }

  // Generate UPDATE statements for each row
  const statements = data.rows.map((row) => {
    // Build SET clause with non-key columns
    const setClauses = nonKeyColumns.map((col) => {
      const columnName = useSnakeCase ? col.name : col.originalName
      const value = row.cells[col.id]
      const formattedValue = formatSQLValue(value, col.dataType)
      return `\`${columnName}\` = ${formattedValue}`
    }).join(', ')

    // Build WHERE clause with key columns
    const whereClauses = keyColumnDefs.map((col) => {
      const columnName = useSnakeCase ? col.name : col.originalName
      const value = row.cells[col.id]
      const formattedValue = formatSQLValue(value, col.dataType)
      return `\`${columnName}\` = ${formattedValue}`
    }).join(' AND ')

    return `UPDATE \`${tableName}\` SET ${setClauses} WHERE ${whereClauses};`
  })

  return statements.join('\n')
}

/**
 * Generate CREATE TABLE SQL statement from table data
 */
export function generateCreateTable(
  data: TableData,
  tableName: string,
  useSnakeCase: boolean = false,
): string {
  if (data.columns.length === 0) {
    return '-- No columns to create'
  }

  // Build column definitions
  const columnDefs = data.columns.map((col) => {
    const columnName = useSnakeCase ? col.name : col.originalName
    const sqlType = getSQLType(col.dataType)
    return `  \`${columnName}\` ${sqlType}`
  }).join(',\n')

  return `CREATE TABLE \`${tableName}\` (\n${columnDefs}\n);`
}

/**
 * Escape CSV value according to RFC 4180
 * - Values containing commas, quotes, or newlines must be quoted
 * - Quotes within values must be doubled
 */
export function escapeCSVValue(value: CellValue): string {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return ''
  }

  const stringValue = String(value)

  // Check if value needs quoting (contains comma, quote, newline, or carriage return)
  const needsQuoting = /[",\n\r]/.test(stringValue)

  if (needsQuoting) {
    // Double any quotes and wrap in quotes
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

/**
 * Export table data to CSV format
 */
export function exportToCSV(
  data: TableData,
  useSnakeCase: boolean = false,
): string {
  if (data.columns.length === 0) {
    return ''
  }

  // Get column names (use snake_case if requested)
  const columnNames = data.columns.map(col => useSnakeCase ? col.name : col.originalName)

  // Build header row
  const headerRow = columnNames.map(escapeCSVValue).join(',')

  // Build data rows
  const dataRows = data.rows.map((row) => {
    const values = data.columns.map(col => row.cells[col.id])
    return values.map(escapeCSVValue).join(',')
  })

  // Combine header and data rows
  return [headerRow, ...dataRows].join('\n')
}

/**
 * Escape Markdown table value
 * - Pipe characters must be escaped to avoid breaking table structure
 * - Newlines should be replaced with spaces
 */
export function escapeMarkdownValue(value: CellValue): string {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return ''
  }

  const stringValue = String(value)

  // Escape pipe characters and replace newlines with spaces
  return stringValue
    .replace(/\|/g, '\\|')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '')
}

/**
 * Export table data to Markdown table format
 */
export function exportToMarkdown(
  data: TableData,
  useSnakeCase: boolean = false,
): string {
  if (data.columns.length === 0) {
    return ''
  }

  // Get column names (use snake_case if requested)
  const columnNames = data.columns.map(col => useSnakeCase ? col.name : col.originalName)

  // Build header row
  const headerRow = `| ${columnNames.map(escapeMarkdownValue).join(' | ')} |`

  // Build separator row (alignment indicators - left-aligned by default)
  const separatorRow = `| ${columnNames.map(() => '---').join(' | ')} |`

  // Build data rows
  const dataRows = data.rows.map((row) => {
    const values = data.columns.map(col => row.cells[col.id])
    return `| ${values.map(escapeMarkdownValue).join(' | ')} |`
  })

  // Combine all rows
  return [headerRow, separatorRow, ...dataRows].join('\n')
}

/**
 * Export table data to Excel (.xlsx) format
 * Returns a Blob that can be downloaded by the browser
 */
export async function exportToExcel(
  data: TableData,
  useSnakeCase: boolean = false,
): Promise<Blob> {
  // Dynamically import xlsx library
  const XLSX = await import('xlsx')

  // Get column names (use snake_case if requested)
  const columnNames = data.columns.map(col => useSnakeCase ? col.name : col.originalName)

  // Build worksheet data as array of arrays
  // First row is the header
  const worksheetData: any[][] = [columnNames]

  // Add data rows
  for (const row of data.rows) {
    const rowData = data.columns.map((col) => {
      const value = row.cells[col.id]
      // Return the raw value (null, number, string, boolean)
      // xlsx library will handle the type conversion
      return value
    })
    worksheetData.push(rowData)
  }

  // Create worksheet from array of arrays
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  // Apply basic formatting to header row (bold)
  // Set column widths based on content
  const columnWidths = columnNames.map((name, colIndex) => {
    // Calculate max width for this column
    let maxWidth = name.length

    for (const row of data.rows) {
      const value = row.cells[data.columns[colIndex].id]
      if (value !== null && value !== undefined) {
        const valueLength = String(value).length
        if (valueLength > maxWidth) {
          maxWidth = valueLength
        }
      }
    }

    // Add some padding and cap at reasonable max
    return { wch: Math.min(maxWidth + 2, 50) }
  })

  worksheet['!cols'] = columnWidths

  // Create workbook and add worksheet
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')

  // Write workbook to binary string
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })

  // Create Blob from buffer
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}
