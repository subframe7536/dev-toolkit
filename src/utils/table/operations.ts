import type { CellValue, TableData } from './types'

/**
 * Reorder columns by moving a column from source index to target index
 * Preserves all cell values and their associations with rows
 *
 * @param data - The table data to reorder
 * @param sourceIndex - The current index of the column to move
 * @param targetIndex - The desired index for the column
 * @returns New TableData with reordered columns
 */
export function reorderColumns(
  data: TableData,
  sourceIndex: number,
  targetIndex: number,
): TableData {
  // Validate indices
  if (sourceIndex < 0 || sourceIndex >= data.columns.length) {
    throw new Error(`Invalid source index: ${sourceIndex}`)
  }
  if (targetIndex < 0 || targetIndex >= data.columns.length) {
    throw new Error(`Invalid target index: ${targetIndex}`)
  }

  // If source and target are the same, return unchanged data
  if (sourceIndex === targetIndex) {
    return data
  }

  // Create new columns array with reordered columns
  const newColumns = [...data.columns]
  const [movedColumn] = newColumns.splice(sourceIndex, 1)
  newColumns.splice(targetIndex, 0, movedColumn)

  // Rows don't need to change - they use column IDs, not positions
  return {
    columns: newColumns,
    rows: data.rows,
  }
}

/**
 * Sort table rows by a specific column in ascending or descending order
 * Preserves row integrity - all cell values stay with their row
 *
 * @param data - The table data to sort
 * @param columnId - The ID of the column to sort by
 * @param direction - Sort direction ('asc' or 'desc')
 * @returns New TableData with sorted rows and updated column sort direction
 */
export function sortByColumn(
  data: TableData,
  columnId: string,
  direction: 'asc' | 'desc',
): TableData {
  // Find the column
  const column = data.columns.find(col => col.id === columnId)
  if (!column) {
    throw new Error(`Column not found: ${columnId}`)
  }

  // Create sorted rows array
  const sortedRows = [...data.rows].sort((a, b) => {
    const aValue = a.cells[columnId]
    const bValue = b.cells[columnId]

    // Handle null values - always sort to the end
    if (aValue === null && bValue === null) {
      return 0
    }
    if (aValue === null) {
      return 1
    }
    if (bValue === null) {
      return -1
    }

    // Compare values based on type
    let comparison = 0
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue
    } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
      comparison = (aValue === bValue) ? 0 : aValue ? 1 : -1
    } else {
      // Convert to string for comparison
      comparison = String(aValue).localeCompare(String(bValue))
    }

    // Apply direction
    return direction === 'asc' ? comparison : -comparison
  })

  // Update columns to reflect sort state
  const newColumns = data.columns.map(col => ({
    ...col,
    sortDirection: col.id === columnId ? direction : undefined,
  }))

  return {
    columns: newColumns,
    rows: sortedRows,
  }
}

/**
 * Toggle the pin state of a column
 * Pinned columns are fixed on the left side during horizontal scrolling
 *
 * @param data - The table data
 * @param columnId - The ID of the column to toggle
 * @returns New TableData with updated pin state
 */
export function toggleColumnPin(
  data: TableData,
  columnId: string,
): TableData {
  // Find the column
  const columnIndex = data.columns.findIndex(col => col.id === columnId)
  if (columnIndex === -1) {
    throw new Error(`Column not found: ${columnId}`)
  }

  const column = data.columns[columnIndex]
  const newPinState = !column.isPinned

  // Update the column's pin state
  const newColumns = data.columns.map(col =>
    col.id === columnId
      ? { ...col, isPinned: newPinState }
      : col,
  )

  // If pinning, move column to the end of pinned columns
  // If unpinning, leave it in place
  if (newPinState) {
    // Find the last pinned column index
    const lastPinnedIndex = newColumns.reduce((lastIndex, col, index) => {
      return col.isPinned && index !== columnIndex ? index : lastIndex
    }, -1)

    // Move the column after the last pinned column
    const targetIndex = lastPinnedIndex + 1
    if (targetIndex !== columnIndex) {
      const [movedColumn] = newColumns.splice(columnIndex, 1)
      newColumns.splice(targetIndex, 0, movedColumn)
    }
  }

  return {
    columns: newColumns,
    rows: data.rows,
  }
}

/**
 * Update a single cell value in the table
 * Maintains data consistency across the table
 *
 * @param data - The table data
 * @param rowId - The ID of the row containing the cell
 * @param columnId - The ID of the column containing the cell
 * @param value - The new cell value
 * @returns New TableData with updated cell value
 */
export function updateCell(
  data: TableData,
  rowId: string,
  columnId: string,
  value: CellValue,
): TableData {
  // Validate column exists
  const columnExists = data.columns.some(col => col.id === columnId)
  if (!columnExists) {
    throw new Error(`Column not found: ${columnId}`)
  }

  // Validate row exists
  const rowIndex = data.rows.findIndex(row => row.id === rowId)
  if (rowIndex === -1) {
    throw new Error(`Row not found: ${rowId}`)
  }

  // Create new rows array with updated cell
  const newRows = data.rows.map(row =>
    row.id === rowId
      ? {
          ...row,
          cells: {
            ...row.cells,
            [columnId]: value,
          },
        }
      : row,
  )

  return {
    columns: data.columns,
    rows: newRows,
  }
}

/**
 * Convert a column name to snake_case format
 * Replaces spaces with underscores, converts to lowercase, handles special characters
 *
 * @param columnName - The column name to convert
 * @returns The snake_case version of the column name
 */
export function convertToSnakeCase(columnName: string): string {
  return columnName
    // Replace spaces with underscores
    .replace(/\s+/g, '_')
    // Convert to lowercase
    .toLowerCase()
    // Remove or replace special characters (keep alphanumeric and underscores)
    .replace(/[^a-z0-9_]/g, '_')
    // Remove consecutive underscores
    .replace(/_+/g, '_')
    // Remove leading/trailing underscores
    .replace(/^_+|_+$/g, '')
}

/**
 * Apply snake_case conversion to all column names in the table
 *
 * @param data - The table data
 * @returns New TableData with snake_case column names
 */
export function applySnakeCaseToColumns(data: TableData): TableData {
  const newColumns = data.columns.map(col => ({
    ...col,
    name: convertToSnakeCase(col.name),
  }))

  return {
    columns: newColumns,
    rows: data.rows,
  }
}
