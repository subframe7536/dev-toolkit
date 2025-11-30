# Requirements Document

## Introduction

The Table Editor is a web-based utility tool that enables developers to parse tabular data from multiple input formats (MySQL output, Excel files), manipulate the data through an interactive table interface, and export the results to various output formats (SQL INSERT/UPDATE statements, Excel, CSV, Markdown tables). This tool provides a privacy-first, client-side solution for common data transformation tasks in development workflows.

## Glossary

- **Table Editor**: The web application component that provides the complete table manipulation functionality
- **Parser**: The component responsible for converting input formats (MySQL output, Excel) into a normalized table data structure
- **DataTable Component**: A reusable, all-in-one table component built with @tanstack/solid-table that displays parsed data in an interactive table format with column operations and cell editing
- **Table Renderer**: The DataTable component that displays the parsed data in an interactive table format
- **Column Operations**: Functions that allow reordering, sorting, and pinning of table columns
- **Cell Editor**: The interface component that enables inline editing of individual table cells
- **Export Generator**: The component that converts the table data structure into various output formats
- **MySQL Output**: Text-based table format produced by MySQL CLI with ASCII borders and aligned columns
- **Sticky Column**: A column that remains visible when horizontally scrolling the table
- **Snake Case**: A naming convention where words are lowercase and separated by underscores (e.g., user_name, created_at)
- **CREATE TABLE Statement**: SQL DDL statement that defines a new database table structure with column names and data types

## Requirements

### Requirement 1

**User Story:** As a developer, I want to paste MySQL CLI output text into the tool, so that I can work with query results in a more flexible format.

#### Acceptance Criteria

1. WHEN a user pastes MySQL CLI output text THEN the Parser SHALL extract column headers from the header row
2. WHEN a user pastes MySQL CLI output text THEN the Parser SHALL extract data rows while preserving cell values
3. WHEN the MySQL output contains special characters or whitespace THEN the Parser SHALL handle them correctly without data loss
4. WHEN the MySQL output is malformed or invalid THEN the Parser SHALL provide clear error feedback to the user
5. THE Table Editor SHALL render the parsed MySQL data in the Table Renderer immediately after successful parsing

### Requirement 2

**User Story:** As a developer, I want to upload Excel files to the tool, so that I can manipulate spreadsheet data without opening Excel.

#### Acceptance Criteria

1. WHEN a user uploads an Excel file THEN the Parser SHALL read the first worksheet by default
2. WHEN an Excel file contains multiple worksheets THEN the Table Editor SHALL allow the user to select which worksheet to parse
3. WHEN the Excel file contains formatted cells THEN the Parser SHALL extract the underlying cell values
4. WHEN the Excel file is corrupted or unsupported THEN the Parser SHALL provide clear error feedback to the user
5. THE Table Editor SHALL support Excel files in both .xlsx and .xls formats

### Requirement 3

**User Story:** As a developer, I want to reorder table columns by dragging, so that I can organize data in a meaningful sequence.

#### Acceptance Criteria

1. WHEN a user drags a column header THEN the Table Renderer SHALL provide visual feedback during the drag operation
2. WHEN a user drops a column header in a new position THEN the Table Renderer SHALL reorder the column and update all data rows accordingly
3. WHEN column reordering occurs THEN the Table Editor SHALL preserve all cell values and their associations with the correct rows
4. THE Table Renderer SHALL maintain column order consistency across all rows after reordering operations

### Requirement 4

**User Story:** As a developer, I want to sort table data by clicking column headers, so that I can analyze data in ascending or descending order.

#### Acceptance Criteria

1. WHEN a user clicks a column header THEN the Table Renderer SHALL sort the table rows by that column in ascending order
2. WHEN a user clicks the same column header again THEN the Table Renderer SHALL toggle the sort order to descending
3. WHEN a user clicks a different column header THEN the Table Renderer SHALL sort by the new column and reset the previous sort indicator
4. WHEN sorting occurs THEN the Table Editor SHALL preserve the integrity of each row's data across all columns
5. THE Table Renderer SHALL display a visual indicator showing the current sort column and direction

### Requirement 5

**User Story:** As a developer, I want to pin columns to keep them visible while scrolling, so that I can reference key fields while viewing other data.

#### Acceptance Criteria

1. WHEN a user pins a column THEN the Table Renderer SHALL fix that column's position on the left side of the table
2. WHEN the user scrolls horizontally THEN the Table Renderer SHALL keep pinned columns visible while other columns scroll
3. WHEN a user unpins a column THEN the Table Renderer SHALL return the column to its original position in the scrollable area
4. THE Table Editor SHALL allow multiple columns to be pinned simultaneously
5. WHEN multiple columns are pinned THEN the Table Renderer SHALL maintain their relative order from left to right

### Requirement 6

**User Story:** As a developer, I want to edit individual table cells by clicking on them, so that I can correct or modify data values.

#### Acceptance Criteria

1. WHEN a user clicks a table cell THEN the Cell Editor SHALL activate and allow text input
2. WHEN a user types in an active cell THEN the Cell Editor SHALL update the cell value in real-time
3. WHEN a user presses Enter or clicks outside the cell THEN the Cell Editor SHALL save the changes and deactivate
4. WHEN a user presses Escape while editing THEN the Cell Editor SHALL discard changes and restore the original value
5. THE Table Editor SHALL maintain data consistency across all export formats after cell edits

### Requirement 7

**User Story:** As a developer, I want to generate SQL INSERT statements from table data, so that I can quickly populate database tables.

#### Acceptance Criteria

1. WHEN a user requests SQL INSERT export THEN the Export Generator SHALL create INSERT statements with the table name specified by the user
2. WHEN generating SQL INSERT statements THEN the Export Generator SHALL include all column names in the column list
3. WHEN generating SQL INSERT statements THEN the Export Generator SHALL properly escape string values and handle NULL values
4. WHEN generating SQL INSERT statements THEN the Export Generator SHALL create one INSERT statement per table row
5. THE Export Generator SHALL format SQL INSERT statements with proper syntax for MySQL compatibility

### Requirement 8

**User Story:** As a developer, I want to generate SQL UPDATE statements from table data, so that I can modify existing database records.

#### Acceptance Criteria

1. WHEN a user requests SQL UPDATE export THEN the Export Generator SHALL prompt the user to specify which column(s) serve as the WHERE clause condition
2. WHEN generating SQL UPDATE statements THEN the Export Generator SHALL create SET clauses for all non-key columns
3. WHEN generating SQL UPDATE statements THEN the Export Generator SHALL properly escape string values and handle NULL values
4. WHEN generating SQL UPDATE statements THEN the Export Generator SHALL create one UPDATE statement per table row
5. THE Export Generator SHALL format SQL UPDATE statements with proper syntax for MySQL compatibility

### Requirement 9

**User Story:** As a developer, I want to export table data as Excel files, so that I can share data with non-technical stakeholders.

#### Acceptance Criteria

1. WHEN a user requests Excel export THEN the Export Generator SHALL create a downloadable .xlsx file
2. WHEN generating Excel files THEN the Export Generator SHALL include column headers in the first row
3. WHEN generating Excel files THEN the Export Generator SHALL preserve all cell values and data types
4. WHEN generating Excel files THEN the Export Generator SHALL apply basic formatting to make headers visually distinct
5. THE Export Generator SHALL trigger a browser download with a descriptive filename

### Requirement 10

**User Story:** As a developer, I want to export table data as CSV files, so that I can import data into other tools and systems.

#### Acceptance Criteria

1. WHEN a user requests CSV export THEN the Export Generator SHALL create a downloadable .csv file
2. WHEN generating CSV files THEN the Export Generator SHALL include column headers in the first row
3. WHEN generating CSV files THEN the Export Generator SHALL properly escape values containing commas, quotes, or newlines
4. WHEN generating CSV files THEN the Export Generator SHALL use standard CSV formatting with comma delimiters
5. THE Export Generator SHALL trigger a browser download with a descriptive filename

### Requirement 11

**User Story:** As a developer, I want to export table data as Markdown tables, so that I can include formatted data in documentation.

#### Acceptance Criteria

1. WHEN a user requests Markdown export THEN the Export Generator SHALL create properly formatted Markdown table syntax
2. WHEN generating Markdown tables THEN the Export Generator SHALL include a header row with column names
3. WHEN generating Markdown tables THEN the Export Generator SHALL include a separator row with alignment indicators
4. WHEN generating Markdown tables THEN the Export Generator SHALL format all data rows with proper column alignment
5. THE Export Generator SHALL copy the Markdown table to the clipboard or provide it as downloadable text

### Requirement 12

**User Story:** As a developer, I want to generate CREATE TABLE SQL statements from table data, so that I can quickly set up database table schemas.

#### Acceptance Criteria

1. WHEN a user requests CREATE TABLE export THEN the Export Generator SHALL prompt the user to specify a table name
2. WHEN generating CREATE TABLE statements THEN the Export Generator SHALL infer appropriate data types based on the cell values in each column
3. WHEN generating CREATE TABLE statements THEN the Export Generator SHALL include all columns with their inferred data types
4. WHEN a column contains only numeric values THEN the Export Generator SHALL infer an appropriate numeric type (INT, DECIMAL, etc.)
5. WHEN a column contains text values THEN the Export Generator SHALL infer an appropriate string type (VARCHAR, TEXT)
6. THE Export Generator SHALL format CREATE TABLE statements with proper SQL syntax for MySQL compatibility

### Requirement 13

**User Story:** As a developer, I want to automatically convert column names to snake_case format, so that they follow database naming conventions.

#### Acceptance Criteria

1. WHEN a user enables snake_case conversion THEN the Table Editor SHALL convert all column names to snake_case format
2. WHEN converting to snake_case THEN the Table Editor SHALL replace spaces with underscores
3. WHEN converting to snake_case THEN the Table Editor SHALL convert all uppercase letters to lowercase
4. WHEN converting to snake_case THEN the Table Editor SHALL handle special characters by removing or replacing them appropriately
5. WHEN snake_case conversion is applied THEN the Table Editor SHALL use the converted names in all export formats
6. THE Table Editor SHALL provide a toggle option to enable or disable automatic snake_case conversion
