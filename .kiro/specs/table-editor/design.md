# Design Document - Table Editor

## Overview

The Table Editor is a client-side web application built with SolidJS that provides comprehensive table data manipulation capabilities. The tool accepts input from MySQL CLI output or Excel files, presents data in an interactive table interface with column operations (reorder, sort, pin) and cell editing, and exports to multiple formats including SQL statements (INSERT, UPDATE, CREATE TABLE), Excel, CSV, and Markdown tables.

The architecture follows the project's established patterns: pure utility functions in `src/utils/` handle all data processing logic, while the page component in `src/pages/(tools)/(utilities)/` manages UI state and user interactions. All processing occurs client-side for privacy and offline functionality.

## Architecture

### High-Level Component Structure

```
┌─────────────────────────────────────────────────────────┐
│                    Table Editor Page                     │
│                  (table-editor.tsx)                      │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │   Input    │  │  DataTable   │  │     Export      │ │
│  │   Panel    │  │  Component   │  │     Panel       │ │
│  └────────────┘  └──────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  DataTable Component                     │
│                  (data-table.tsx)                        │
│         Built with @tanstack/solid-table                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │  • Column reordering (drag-and-drop)             │  │
│  │  • Column sorting (asc/desc/none)                │  │
│  │  • Column pinning (left side)                    │  │
│  │  • Inline cell editing                           │  │
│  │  • Horizontal scrolling with sticky columns      │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Utility Functions Layer                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │  Parser  │  │  Table   │  │  Column  │  │ Export  ││
│  │  Utils   │  │  Utils   │  │  Utils   │  │  Utils  ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Input Phase**: User provides MySQL text or Excel file → Parser utilities convert to normalized table structure
2. **Manipulation Phase**: User interacts with table → Column/Table utilities update data structure → UI re-renders
3. **Export Phase**: User selects export format → Export utilities generate output → Browser downloads or copies result

## TanStack Table Integration

The DataTable component leverages `@tanstack/solid-table` for robust table functionality. TanStack Table is a headless UI library that provides:

- **Headless Architecture**: No built-in UI, full control over rendering
- **Type-Safe**: Full TypeScript support with type inference
- **Feature-Rich**: Built-in support for sorting, filtering, pagination, column ordering, pinning, etc.
- **Framework Agnostic**: Core logic works across React, Vue, Solid, Svelte, etc.

### TanStack Table Setup

```typescript
import { createSolidTable, getCoreRowModel, getSortedRowModel } from '@tanstack/solid-table'

const table = createSolidTable({
  get data() { return tableData.rows },
  columns: columnDefs,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  state: {
    get columnOrder() { return state.columnOrder },
    get sorting() { return state.sorting },
    get columnPinning() { return state.columnPinning },
  },
  onColumnOrderChange: (updater) => { /* update state */ },
  onSortingChange: (updater) => { /* update state */ },
  onColumnPinningChange: (updater) => { /* update state */ },
  enableColumnOrdering: true,
  enableSorting: true,
  enableColumnPinning: true,
})
```

### Column Definition

Each column in the table is defined with TanStack Table's column definition API:

```typescript
import { createColumnHelper } from '@tanstack/solid-table'

const columnHelper = createColumnHelper<TableRow>()

const columns = tableData.columns.map(col => 
  columnHelper.accessor(row => row.cells[col.id], {
    id: col.id,
    header: col.name,
    cell: (info) => {
      // Custom cell renderer with inline editing
      return <EditableCell value={info.getValue()} onChange={...} />
    },
    enableSorting: true,
    enablePinning: true,
  })
)
```

### State Management

TanStack Table manages its own state, but we need to sync it with our TableData structure:

- **Column Order**: When user reorders columns, update both TanStack state and TableData
- **Sorting**: TanStack handles sorting internally, but we need to reflect it in UI
- **Pinning**: TanStack provides pinning utilities, we apply CSS for visual effect
- **Cell Edits**: When user edits a cell, update TableData and emit onDataChange

## Components and Interfaces

### Core Data Structures

```typescript
// Normalized table data structure
interface TableData {
  columns: ColumnDefinition[]
  rows: TableRow[]
}

interface ColumnDefinition {
  id: string                    // Unique identifier
  name: string                  // Display name
  originalName: string          // Original name before transformations
  dataType: DataType            // Inferred data type
  isPinned: boolean             // Pin state
  sortDirection?: 'asc' | 'desc' // Current sort direction
}

interface TableRow {
  id: string                    // Unique row identifier
  cells: Record<string, CellValue> // Column ID → cell value mapping
}

type CellValue = string | number | boolean | null

type DataType = 'string' | 'integer' | 'decimal' | 'boolean' | 'date' | 'datetime'

// Parser result
interface ParseResult {
  success: boolean
  data?: TableData
  error?: ParseError
}

interface ParseError {
  message: string
  details?: string
  line?: number
}

// Export options
interface ExportOptions {
  format: ExportFormat
  tableName?: string            // For SQL exports
  keyColumns?: string[]         // For UPDATE statements
  useSnakeCase?: boolean        // Column name transformation
}

type ExportFormat = 'sql-insert' | 'sql-update' | 'sql-create' | 'excel' | 'csv' | 'markdown'

interface ExportResult {
  success: boolean
  output?: string | Blob
  error?: string
}
```

### Parser Utilities (`src/utils/table/parser.ts`)

```typescript
// Parse MySQL CLI output
function parseMySQLOutput(input: string): ParseResult

// Parse Excel file
function parseExcelFile(file: File, sheetIndex?: number): Promise<ParseResult>

// Get list of sheet names from Excel file
function getExcelSheetNames(file: File): Promise<string[]>

// Infer data type from cell values
function inferDataType(values: CellValue[]): DataType
```

### Table Manipulation Utilities (`src/utils/table/operations.ts`)

```typescript
// Reorder columns
function reorderColumns(
  data: TableData,
  sourceIndex: number,
  targetIndex: number
): TableData

// Sort table by column
function sortByColumn(
  data: TableData,
  columnId: string,
  direction: 'asc' | 'desc'
): TableData

// Pin/unpin column
function toggleColumnPin(
  data: TableData,
  columnId: string
): TableData

// Update cell value
function updateCell(
  data: TableData,
  rowId: string,
  columnId: string,
  value: CellValue
): TableData

// Convert column names to snake_case
function convertToSnakeCase(columnName: string): string

// Apply snake_case to all columns
function applySnakeCaseToColumns(data: TableData): TableData
```

### Export Utilities (`src/utils/table/export.ts`)

```typescript
// Generate SQL INSERT statements
function generateSQLInsert(
  data: TableData,
  tableName: string,
  useSnakeCase: boolean
): string

// Generate SQL UPDATE statements
function generateSQLUpdate(
  data: TableData,
  tableName: string,
  keyColumns: string[],
  useSnakeCase: boolean
): string

// Generate CREATE TABLE statement
function generateCreateTable(
  data: TableData,
  tableName: string,
  useSnakeCase: boolean
): string

// Export to Excel
function exportToExcel(data: TableData): Promise<Blob>

// Export to CSV
function exportToCSV(data: TableData): string

// Export to Markdown table
function exportToMarkdown(data: TableData): string

// Helper: Escape SQL string values
function escapeSQLString(value: string): string

// Helper: Format SQL value based on type
function formatSQLValue(value: CellValue, dataType: DataType): string
```

## Data Models

### MySQL Output Format

MySQL CLI produces ASCII-bordered tables:

```
+----+----------+-------+
| id | name     | age   |
+----+----------+-------+
|  1 | Alice    |    30 |
|  2 | Bob      |    25 |
+----+----------+-------+
```

Parser strategy:
1. Identify header row (between first two separator lines)
2. Extract column names by parsing positions between `|` characters
3. Parse data rows using same column positions
4. Trim whitespace from all values
5. Handle edge cases: empty cells, special characters, multi-line values

### Excel File Format

Using `xlsx` library (SheetJS) for parsing:
- Support both `.xlsx` (Office Open XML) and `.xls` (Binary Format)
- Read first sheet by default, allow sheet selection
- Extract cell values (not formulas or formatting)
- Handle merged cells by using top-left cell value
- Convert Excel date serial numbers to readable dates

### Table Data Normalization

All input formats convert to the unified `TableData` structure:
- Each column gets a unique ID (UUID or generated)
- Each row gets a unique ID
- Cell values stored in flat key-value structure for efficient updates
- Data types inferred from column values (used for SQL generation)

## Data Type Inference

The system infers SQL-compatible data types by analyzing column values:

```typescript
function inferDataType(values: CellValue[]): DataType {
  // Remove null values for analysis
  const nonNullValues = values.filter(v => v !== null)
  
  if (nonNullValues.length === 0) return 'string'
  
  // Check if all values are integers
  if (nonNullValues.every(v => Number.isInteger(v))) return 'integer'
  
  // Check if all values are numbers
  if (nonNullValues.every(v => typeof v === 'number')) return 'decimal'
  
  // Check if all values are booleans
  if (nonNullValues.every(v => typeof v === 'boolean')) return 'boolean'
  
  // Check for date patterns (ISO format, common date formats)
  if (nonNullValues.every(v => isDateString(v))) return 'date'
  
  // Check for datetime patterns
  if (nonNullValues.every(v => isDateTimeString(v))) return 'datetime'
  
  // Default to string
  return 'string'
}
```

SQL type mapping:
- `integer` → `INT`
- `decimal` → `DECIMAL(10,2)` or `DOUBLE`
- `boolean` → `BOOLEAN` or `TINYINT(1)`
- `date` → `DATE`
- `datetime` → `DATETIME`
- `string` → `VARCHAR(255)` or `TEXT` (based on max length)



## UI Component Design

### Input Panel

Two input modes with tab interface:
1. **Text Input Tab**: Textarea for pasting MySQL output
2. **File Upload Tab**: File upload component (reuse `FileUpload` from `src/components/file-upload.tsx`)

For Excel files with multiple sheets, show sheet selector dropdown after upload.

### Table Component (`src/components/data-table.tsx`)

A reusable, all-in-one table component built with `@tanstack/solid-table` that provides:

**Core Features**:
- Column reordering via drag-and-drop
- Column sorting (ascending/descending/none)
- Column pinning (left side)
- Inline cell editing
- Horizontal scrolling with sticky pinned columns
- Responsive design with proper overflow handling

**Component Interface**:
```typescript
interface DataTableProps {
  data: TableData
  onDataChange: (data: TableData) => void
  editable?: boolean
}
```

**TanStack Table Integration**:
- Use `createSolidTable` from `@tanstack/solid-table`
- Configure column definitions with:
  - `enableSorting: true` for sortable columns
  - `enablePinning: true` for pinnable columns
  - `enableColumnOrdering: true` for reorderable columns
- Implement custom cell renderer for inline editing
- Use table state management for:
  - `columnOrder`: Track column reordering
  - `sorting`: Track sort state (column + direction)
  - `columnPinning`: Track pinned columns (left)
  - `columnVisibility`: Track hidden/visible columns

**Column Headers**:
- Draggable for reordering (visual feedback during drag)
- Clickable for sorting with visual indicators (↑↓)
- Pin/unpin button or context menu
- Display pin icon for pinned columns

**Table Body**:
- Cells are clickable to enter edit mode (when editable=true)
- Edit mode: inline text input with save/cancel (Enter/Escape)
- Pinned columns fixed on left with visual separator
- Horizontal scroll for non-pinned columns
- Alternating row colors for readability

**Implementation Details**:
- Use TanStack Table's built-in state management
- Leverage `getCoreRowModel` for basic row rendering
- Use `getSortedRowModel` for client-side sorting
- Implement custom drag-and-drop handlers for column reordering
- CSS `position: sticky` for pinned columns (TanStack provides column pinning utilities)
- Emit `onDataChange` events when cells are edited or structure changes

### Export Panel

Dropdown or button group for export format selection:
- SQL INSERT
- SQL UPDATE (prompts for key columns)
- CREATE TABLE (prompts for table name)
- Excel (.xlsx download)
- CSV (.csv download)
- Markdown (copy to clipboard with toast notification)

Additional controls:
- Table name input (for SQL exports)
- Key column selector (for UPDATE statements)
- Snake_case toggle switch

### Settings Panel

Collapsible panel with:
- Snake_case conversion toggle
- Column visibility toggles (show/hide columns)
- Reset button (clear all data and start over)

## Error Handling

### Parser Errors

**MySQL Output**:
- Invalid format (missing separators): "Invalid MySQL output format. Expected table with +---+ borders."
- Empty input: "Please paste MySQL output text."
- Malformed rows: "Row {n} has mismatched column count. Expected {expected}, got {actual}."

**Excel Files**:
- Unsupported file type: "Unsupported file format. Please upload .xlsx or .xls files."
- Corrupted file: "Failed to read Excel file. The file may be corrupted."
- Empty sheet: "Selected sheet is empty."
- Read error: Display specific error from xlsx library

### Export Errors

**SQL UPDATE**:
- No key columns selected: "Please select at least one key column for UPDATE statements."
- Key column has null values: "Key column '{column}' contains null values. UPDATE statements require non-null keys."

**General**:
- Empty table: "No data to export. Please load data first."
- Invalid table name: "Please provide a valid table name (alphanumeric and underscores only)."

### User Feedback

- Use `toast` from `solid-sonner` for success/error messages
- Show loading states during file parsing and export generation
- Disable action buttons during processing
- Clear error messages with actionable guidance

## Testing Strategy

### Unit Testing

The project does not currently have a testing setup, but if tests are added, focus on utility functions:

**Parser Tests** (`src/utils/table/parser.test.ts`):
- Parse valid MySQL output with various data types
- Handle MySQL output with special characters
- Parse Excel files with different sheet structures
- Handle empty inputs and malformed data
- Data type inference accuracy

**Operations Tests** (`src/utils/table/operations.test.ts`):
- Column reordering preserves data integrity
- Sorting maintains row data associations
- Cell updates modify correct values
- Snake_case conversion handles edge cases

**Export Tests** (`src/utils/table/export.ts`):
- SQL INSERT generation with proper escaping
- SQL UPDATE generation with key columns
- CREATE TABLE with correct type inference
- CSV escaping for special characters
- Markdown table formatting

### Property-Based Testing

Property-based testing would be valuable for this feature but requires setup. If implemented, use `fast-check` library for JavaScript/TypeScript.



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Parser Properties

**Property 1: MySQL header extraction completeness**
*For any* valid MySQL CLI output, parsing should extract all column headers that appear in the header row, preserving their names exactly.
**Validates: Requirements 1.1**

**Property 2: MySQL data preservation**
*For any* valid MySQL CLI output, parsing should extract all cell values without modification, maintaining the exact content from the original output.
**Validates: Requirements 1.2**

**Property 3: MySQL parser error handling**
*For any* malformed or invalid MySQL output, the parser should return a ParseResult with success=false and a descriptive error message.
**Validates: Requirements 1.4**

**Property 4: Excel value extraction**
*For any* Excel file with formatted cells, parsing should extract the underlying cell values, ignoring formatting and formulas.
**Validates: Requirements 2.3**

**Property 5: Excel parser error handling**
*For any* corrupted or unsupported file, the parser should return a ParseResult with success=false and a descriptive error message.
**Validates: Requirements 2.4**

### Table Manipulation Properties

**Property 6: Column reordering preserves data integrity**
*For any* table data and any valid source and target column indices, reordering a column should preserve all cell values and their associations with the correct rows. Each row's data should remain intact with cells moving together with their column.
**Validates: Requirements 3.2, 3.3, 3.4**

**Property 7: Sorting preserves row integrity**
*For any* table data and any column, sorting by that column should reorder rows while preserving the integrity of each row's data across all columns. After sorting, each row should still contain the same set of cell values it had before sorting.
**Validates: Requirements 4.1, 4.4**

**Property 8: Sort direction toggle**
*For any* table data and any column, sorting by a column twice consecutively should produce the reverse order of rows compared to sorting once.
**Validates: Requirements 4.2**

**Property 9: Cell edit consistency**
*For any* table data, row, column, and new value, updating a cell should result in that exact value appearing in all subsequent export formats.
**Validates: Requirements 6.5**

### Export Properties

**Property 10: SQL INSERT table name inclusion**
*For any* table data and table name, generating SQL INSERT statements should include the specified table name in every INSERT statement.
**Validates: Requirements 7.1**

**Property 11: SQL INSERT column completeness**
*For any* table data, generating SQL INSERT statements should include all column names in the column list of every INSERT statement.
**Validates: Requirements 7.2**

**Property 12: SQL value escaping**
*For any* table data containing string values with special characters (quotes, backslashes, newlines) or NULL values, all SQL statement types (INSERT, UPDATE, CREATE TABLE) should properly escape string values and represent NULL values correctly.
**Validates: Requirements 7.3, 8.3**

**Property 13: SQL INSERT row count**
*For any* table data, the number of generated SQL INSERT statements should equal the number of rows in the table.
**Validates: Requirements 7.4**

**Property 14: SQL syntax validity**
*For any* table data and SQL export type (INSERT, UPDATE, CREATE TABLE), the generated SQL statements should be syntactically valid MySQL statements that can be parsed without errors.
**Validates: Requirements 7.5, 8.5, 12.6**

**Property 15: SQL UPDATE non-key columns**
*For any* table data and set of key columns, generating SQL UPDATE statements should include SET clauses for all columns except the key columns.
**Validates: Requirements 8.2**

**Property 16: SQL UPDATE row count**
*For any* table data, the number of generated SQL UPDATE statements should equal the number of rows in the table.
**Validates: Requirements 8.4**

**Property 17: Excel round-trip preservation**
*For any* table data, exporting to Excel and then parsing the resulting Excel file should produce table data with the same column names, row count, and cell values.
**Validates: Requirements 9.2, 9.3**

**Property 18: CSV header inclusion**
*For any* table data, generating CSV output should include all column names in the first row.
**Validates: Requirements 10.2**

**Property 19: CSV special character escaping**
*For any* table data containing cell values with commas, quotes, or newlines, generating CSV output should properly escape these values according to CSV standards (RFC 4180).
**Validates: Requirements 10.3**

**Property 20: CSV format compliance**
*For any* table data, generating CSV output should produce valid CSV format with comma delimiters that can be parsed by standard CSV parsers.
**Validates: Requirements 10.4**

**Property 21: Markdown table structure**
*For any* table data, generating Markdown output should produce a valid Markdown table with a header row, separator row with alignment indicators, and data rows with proper column alignment.
**Validates: Requirements 11.1, 11.2, 11.3, 11.4**

**Property 22: CREATE TABLE type inference**
*For any* table data, generating CREATE TABLE statements should infer data types for each column based on the values in that column, selecting appropriate SQL types (INT for integers, VARCHAR/TEXT for strings, DECIMAL for decimals, etc.).
**Validates: Requirements 12.2**

**Property 23: CREATE TABLE column completeness**
*For any* table data, generating CREATE TABLE statements should include all columns with their inferred data types.
**Validates: Requirements 12.3**

**Property 24: Snake_case conversion**
*For any* column name, converting to snake_case should replace spaces with underscores, convert uppercase letters to lowercase, and remove or replace special characters, producing a valid database identifier.
**Validates: Requirements 13.1**

**Property 25: Snake_case export consistency**
*For any* table data with snake_case conversion enabled, all export formats (SQL INSERT, UPDATE, CREATE TABLE, CSV, Excel, Markdown) should use the snake_case column names.
**Validates: Requirements 13.5**

### Example-Based Tests

The following are specific examples that should be tested but don't require property-based testing:

- **Example 1**: Excel parser reads first worksheet by default (Requirement 2.1)
- **Example 2**: Excel parser supports both .xlsx and .xls formats (Requirement 2.5)
- **Example 3**: Type inference identifies integers correctly (Requirement 12.4)
- **Example 4**: Type inference identifies strings correctly (Requirement 12.5)
- **Example 5**: Snake_case converts spaces to underscores (Requirement 13.2)
- **Example 6**: Snake_case converts uppercase to lowercase (Requirement 13.3)
- **Example 7**: Snake_case handles special characters (Requirement 13.4)

## Implementation Notes

### Third-Party Libraries

- **@tanstack/solid-table**: Headless table library for column operations, sorting, and pinning
- **xlsx** (SheetJS): Excel file parsing and generation
- **papaparse**: CSV parsing (already used in project)
- **fast-check**: Property-based testing library (if tests are implemented)

### TanStack Table Best Practices

1. **Memoization**: Use SolidJS memos for column definitions to prevent unnecessary re-renders
2. **State Synchronization**: Keep TanStack Table state in sync with TableData structure
3. **Custom Renderers**: Use custom cell renderers for inline editing functionality
4. **Pinning CSS**: Apply `position: sticky` with appropriate left offsets for pinned columns
5. **Drag-and-Drop**: Implement HTML5 drag events on column headers, update columnOrder state
6. **Type Safety**: Leverage TypeScript generics for type-safe column and row access

### Performance Considerations

- Large tables (1000+ rows): Use virtual scrolling for table rendering
- Excel export: Stream data for large files instead of building entire file in memory
- Column operations: Use immutable updates with structural sharing (SolidJS stores handle this)

### Browser Compatibility

- File upload: Use standard File API (supported in all modern browsers)
- Clipboard API: Use `navigator.clipboard.writeText()` for Markdown export (requires HTTPS)
- Download: Use `URL.createObjectURL()` and anchor element click

### Accessibility

- Table navigation: Support keyboard navigation (arrow keys, Tab)
- Screen readers: Use proper ARIA labels for table structure
- Focus management: Maintain focus during cell editing
- Color contrast: Ensure pinned column separator and sort indicators meet WCAG AA standards
