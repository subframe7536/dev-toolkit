# Implementation Plan - Table Editor

- [x] 1. Set up project dependencies and core data structures
  - Install required npm packages: `xlsx` for Excel file handling
  - Create TypeScript interfaces for TableData, ColumnDefinition, TableRow, ParseResult, ExportOptions in `src/utils/table/types.ts`
  - Define data type enums and helper type guards
  - _Requirements: All requirements depend on these core structures_

- [x] 2. Implement MySQL output parser
  - Create `src/utils/table/parser.ts` with `parseMySQLOutput` function
  - Implement logic to identify header row between separator lines
  - Extract column names by parsing positions between pipe characters
  - Parse data rows using column positions and trim whitespace
  - Handle edge cases: empty cells, special characters
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2.1 Write property test for MySQL header extraction
  - **Property 1: MySQL header extraction completeness**
  - **Validates: Requirements 1.1**

- [x] 2.2 Write property test for MySQL data preservation
  - **Property 2: MySQL data preservation**
  - **Validates: Requirements 1.2**

- [x] 2.3 Write property test for MySQL parser error handling
  - **Property 3: MySQL parser error handling**
  - **Validates: Requirements 1.4**

- [x] 3. Implement Excel file parser
  - Add `parseExcelFile` function to `src/utils/table/parser.ts`
  - Use xlsx library to read Excel files (.xlsx and .xls formats)
  - Implement `getExcelSheetNames` function to list available sheets
  - Extract cell values from specified sheet (default to first sheet)
  - Handle formatted cells by extracting underlying values
  - Implement error handling for corrupted or unsupported files
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3.1 Write property test for Excel value extraction
  - **Property 4: Excel value extraction**
  - **Validates: Requirements 2.3**

- [x] 3.2 Write property test for Excel parser error handling
  - **Property 5: Excel parser error handling**
  - **Validates: Requirements 2.4**

- [x] 3.3 Write example tests for Excel parser
  - Test default first worksheet selection (Requirement 2.1)
  - Test .xlsx and .xls format support (Requirement 2.5)

- [x] 4. Implement data type inference
  - Add `inferDataType` function to `src/utils/table/parser.ts`
  - Implement logic to analyze column values and determine SQL-compatible types
  - Handle integer, decimal, boolean, date, datetime, and string detection
  - Use inferred types for SQL generation
  - _Requirements: 12.2, 12.4, 12.5_

- [x] 4.1 Write property test for type inference
  - **Property 22: CREATE TABLE type inference**
  - **Validates: Requirements 12.2**

- [x] 4.2 Write example tests for type inference
  - Test integer detection (Requirement 12.4)
  - Test string detection (Requirement 12.5)

- [x] 5. Implement table manipulation operations
  - Create `src/utils/table/operations.ts` with core table operations
  - Implement `reorderColumns` function with index-based column reordering
  - Implement `sortByColumn` function with ascending/descending sort
  - Implement `toggleColumnPin` function to manage pin state
  - Implement `updateCell` function for cell value updates
  - Ensure all operations preserve data integrity
  - _Requirements: 3.2, 3.3, 3.4, 4.1, 4.2, 4.4, 5.1, 5.3, 6.5_

- [x] 5.1 Write property test for column reordering
  - **Property 6: Column reordering preserves data integrity**
  - **Validates: Requirements 3.2, 3.3, 3.4**

- [x] 5.2 Write property test for sorting row integrity
  - **Property 7: Sorting preserves row integrity**
  - **Validates: Requirements 4.1, 4.4**

- [x] 5.3 Write property test for sort direction toggle
  - **Property 8: Sort direction toggle**
  - **Validates: Requirements 4.2**

- [x] 5.4 Write property test for cell edit consistency
  - **Property 9: Cell edit consistency**
  - **Validates: Requirements 6.5**

- [x] 6. Implement snake_case conversion
  - Add `convertToSnakeCase` function to `src/utils/table/operations.ts`
  - Implement logic to replace spaces with underscores
  - Convert uppercase to lowercase
  - Remove or replace special characters
  - Add `applySnakeCaseToColumns` function to apply conversion to all columns
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ]* 6.1 Write property test for snake_case conversion
  - **Property 24: Snake_case conversion**
  - **Validates: Requirements 13.1**

- [ ]* 6.2 Write example tests for snake_case conversion
  - Test space to underscore conversion (Requirement 13.2)
  - Test uppercase to lowercase conversion (Requirement 13.3)
  - Test special character handling (Requirement 13.4)

- [x] 7. Implement SQL export utilities
  - Create `src/utils/table/export.ts` with SQL generation functions
  - Implement `escapeSQLString` helper for proper string escaping
  - Implement `formatSQLValue` helper to format values by data type
  - Implement `generateSQLInsert` function with table name and column list
  - Implement `generateSQLUpdate` function with key columns and SET clauses
  - Implement `generateCreateTable` function with type inference
  - Ensure all SQL functions handle NULL values and special characters
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.2, 8.3, 8.4, 8.5, 12.1, 12.3, 12.6_

- [x] 7.1 Write property test for SQL INSERT table name
  - **Property 10: SQL INSERT table name inclusion**
  - **Validates: Requirements 7.1**

- [x] 7.2 Write property test for SQL INSERT column completeness
  - **Property 11: SQL INSERT column completeness**
  - **Validates: Requirements 7.2**

- [x] 7.3 Write property test for SQL value escaping
  - **Property 12: SQL value escaping**
  - **Validates: Requirements 7.3, 8.3**

- [x] 7.4 Write property test for SQL INSERT row count
  - **Property 13: SQL INSERT row count**
  - **Validates: Requirements 7.4**

- [x] 7.5 Write property test for SQL syntax validity
  - **Property 14: SQL syntax validity**
  - **Validates: Requirements 7.5, 8.5, 12.6**

- [x] 7.6 Write property test for SQL UPDATE non-key columns
  - **Property 15: SQL UPDATE non-key columns**
  - **Validates: Requirements 8.2**

- [x] 7.7 Write property test for SQL UPDATE row count
  - **Property 16: SQL UPDATE row count**
  - **Validates: Requirements 8.4**

- [x] 7.8 Write property test for CREATE TABLE column completeness
  - **Property 23: CREATE TABLE column completeness**
  - **Validates: Requirements 12.3**

- [x] 8. Implement CSV and Markdown export utilities
  - Add `exportToCSV` function to `src/utils/table/export.ts`
  - Implement proper CSV escaping for commas, quotes, and newlines
  - Add `exportToMarkdown` function with header, separator, and data rows
  - Ensure both formats include column headers in first row
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 8.1 Write property test for CSV header inclusion
  - **Property 18: CSV header inclusion**
  - **Validates: Requirements 10.2**

- [x] 8.2 Write property test for CSV special character escaping
  - **Property 19: CSV special character escaping**
  - **Validates: Requirements 10.3**

- [ ]* 8.3 Write property test for CSV format compliance
  - **Property 20: CSV format compliance**
  - **Validates: Requirements 10.4**

- [ ]* 8.4 Write property test for Markdown table structure
  - **Property 21: Markdown table structure**
  - **Validates: Requirements 11.1, 11.2, 11.3, 11.4**

- [x] 9. Implement Excel export utility
  - Add `exportToExcel` function to `src/utils/table/export.ts`
  - Use xlsx library to create .xlsx files
  - Include column headers in first row with basic formatting
  - Preserve cell values and data types
  - Return Blob for browser download
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 9.1 Write property test for Excel round-trip preservation
  - **Property 17: Excel round-trip preservation**
  - **Validates: Requirements 9.2, 9.3**

- [x] 10. Implement snake_case export consistency
  - Update all export functions to respect snake_case conversion setting
  - Ensure SQL, CSV, Excel, and Markdown exports use converted column names when enabled
  - _Requirements: 13.5, 13.6_

- [ ]* 10.1 Write property test for snake_case export consistency
  - **Property 25: Snake_case export consistency**
  - **Validates: Requirements 13.5**

- [x] 11. Create table editor page component
  - Create `src/pages/(tools)/(utilities)/table-editor.tsx` with route definition
  - Set up route info with title, description, category, icon, and tags
  - Initialize component with SolidJS createStore for table data state
  - Create layout with three main sections: input panel, DataTable component, export panel
  - _Requirements: All requirements_

- [x] 12. Implement input panel UI and integrate DataTable
  - Create tab interface with "Text Input" and "File Upload" tabs
  - Add textarea for MySQL output pasting in text input tab
  - Integrate FileUpload component for Excel files in file upload tab
  - Add sheet selector dropdown for Excel files with multiple sheets
  - Wire up parser functions to handle input and update table data state
  - Display parsing errors using toast notifications
  - Integrate DataTable component to display parsed data
  - Pass table data and onDataChange handler to DataTable
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 13. Create reusable DataTable component with @tanstack/solid-table
  - Create `src/components/data-table.tsx` as an all-in-one table component
  - Set up TanStack Table with createSolidTable hook
  - Define DataTableProps interface (data, onDataChange, editable)
  - Configure column definitions with enableSorting, enablePinning, enableColumnOrdering
  - Implement table state management for columnOrder, sorting, columnPinning, columnVisibility
  - Use getCoreRowModel and getSortedRowModel from TanStack Table
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 13.1 Implement column header functionality in DataTable
  - Render column headers with drag-and-drop support for reordering
  - Add click handlers for sorting with visual indicators (↑↓)
  - Implement pin/unpin button or context menu for each column
  - Display pin icon for pinned columns
  - Provide visual feedback during drag operations
  - _Requirements: 3.1, 3.2, 4.1, 4.2, 4.3, 4.5, 5.1, 5.2_

- [x] 13.2 Implement table body and cell editing in DataTable
  - Render table body using TanStack Table's row model
  - Implement clickable cells that enter edit mode (when editable=true)
  - Create inline text input for cell editing with save/cancel (Enter/Escape)
  - Handle click outside to save changes
  - Apply CSS position: sticky for pinned columns with visual separator
  - Add horizontal scroll for non-pinned columns
  - Apply alternating row colors for readability
  - Emit onDataChange events when cells are edited
  - _Requirements: 3.3, 3.4, 4.4, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 14. Implement export panel UI
  - Create export format selector (dropdown or button group)
  - Add table name input field for SQL exports
  - Add key column selector for SQL UPDATE statements
  - Add snake_case conversion toggle switch
  - Implement export button handlers for each format
  - Wire up export functions and trigger downloads using downloadFile utility
  - For Markdown export, copy to clipboard and show toast notification
  - Display export errors using toast notifications
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.2, 10.3, 10.4, 10.5, 11.1, 11.2, 11.3, 11.4, 11.5, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 13.1, 13.5, 13.6_

- [x] 15. Add settings and polish
  - Create collapsible settings panel with column visibility toggles
  - Add reset button to clear all data and start over
  - Implement loading states for file parsing and export generation
  - Disable action buttons during processing
  - Add keyboard navigation support for table (arrow keys, Tab)
  - Ensure proper ARIA labels for accessibility
  - Test color contrast for pinned column separator and sort indicators
  - _Requirements: All requirements_

- [ ] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
