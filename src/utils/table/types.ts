// Core data type enum
export type DataType = 'string' | 'integer' | 'decimal' | 'boolean' | 'date' | 'datetime'

// Export format enum
export type ExportFormat = 'sql-insert' | 'sql-update' | 'sql-create' | 'excel' | 'csv' | 'markdown'

// Cell value type
export type CellValue = string | number | boolean | null

// Column definition
export interface ColumnDefinition {
  id: string // Unique identifier
  name: string // Display name
  originalName: string // Original name before transformations
  dataType: DataType // Inferred data type
  isPinned: boolean // Pin state
  sortDirection?: 'asc' | 'desc' // Current sort direction
}

// Table row
export interface TableRow {
  id: string // Unique row identifier
  cells: Record<string, CellValue> // Column ID → cell value mapping
}

// Normalized table data structure
export interface TableData {
  columns: ColumnDefinition[]
  rows: TableRow[]
}

// Parse error
export interface ParseError {
  message: string
  details?: string
  line?: number
}

// Parser result
export interface ParseResult {
  success: boolean
  data?: TableData
  error?: ParseError
}

// Export options
export interface ExportOptions {
  format: ExportFormat
  tableName?: string // For SQL exports
  keyColumns?: string[] // For UPDATE statements
  useSnakeCase?: boolean // Column name transformation
}

// Export result
export interface ExportResult {
  success: boolean
  output?: string | Blob
  error?: string
}

// Type guard: Check if value is a valid DataType
export function isDataType(value: unknown): value is DataType {
  return typeof value === 'string'
    && ['string', 'integer', 'decimal', 'boolean', 'date', 'datetime'].includes(value)
}

// Type guard: Check if value is a valid ExportFormat
export function isExportFormat(value: unknown): value is ExportFormat {
  return typeof value === 'string'
    && ['sql-insert', 'sql-update', 'sql-create', 'excel', 'csv', 'markdown'].includes(value)
}

// Type guard: Check if value is a valid CellValue
export function isCellValue(value: unknown): value is CellValue {
  return typeof value === 'string'
    || typeof value === 'number'
    || typeof value === 'boolean'
    || value === null
}

// Type guard: Check if object is a valid ColumnDefinition
export function isColumnDefinition(obj: unknown): obj is ColumnDefinition {
  if (typeof obj !== 'object' || obj === null) {
    return false
  }
  const col = obj as Record<string, unknown>
  return typeof col.id === 'string'
    && typeof col.name === 'string'
    && typeof col.originalName === 'string'
    && isDataType(col.dataType)
    && typeof col.isPinned === 'boolean'
    && (col.sortDirection === undefined || col.sortDirection === 'asc' || col.sortDirection === 'desc')
}

// Type guard: Check if object is a valid TableRow
export function isTableRow(obj: unknown): obj is TableRow {
  if (typeof obj !== 'object' || obj === null) {
    return false
  }
  const row = obj as Record<string, unknown>
  if (typeof row.id !== 'string') {
    return false
  }
  if (typeof row.cells !== 'object' || row.cells === null) {
    return false
  }

  // Check all cell values are valid CellValues
  const cells = row.cells as Record<string, unknown>
  return Object.values(cells).every(isCellValue)
}

// Type guard: Check if object is a valid TableData
export function isTableData(obj: unknown): obj is TableData {
  if (typeof obj !== 'object' || obj === null) {
    return false
  }
  const data = obj as Record<string, unknown>
  return Array.isArray(data.columns)
    && data.columns.every(isColumnDefinition)
    && Array.isArray(data.rows)
    && data.rows.every(isTableRow)
}
