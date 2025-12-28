import type { TableData } from '#/utils/table/types'

import { DataTable } from '#/components/data-table'
import { InputSection } from '#/components/table-editor/input-section'
import { TableActions } from '#/components/table-editor/table-actions'
import { useSidebar } from '#/components/ui/sidebar'
import { createRoute } from 'solid-file-router'
import { batch, createSignal, Show } from 'solid-js'
import { createStore } from 'solid-js/store'
import { toast } from 'solid-sonner'

export default createRoute({
  info: {
    title: 'Table Editor',
    description: 'Parse, edit, and export tabular data from MySQL output or Excel files',
    category: 'Utilities',
    icon: 'lucide:table',
    tags: ['table', 'editor', 'mysql', 'excel', 'csv', 'sql', 'markdown'],
  },
  component: TableEditor,
})

function TableEditor() {
  // Table data state
  const [tableData, setTableData] = createStore<TableData>({
    columns: [],
    rows: [],
  })

  // Settings state
  const [columnVisibility, setColumnVisibility] = createSignal<Record<string, boolean>>({})
  const [hasHeaders, setHasHeaders] = createSignal(true)

  // Handle toggling "First row is header"
  const handleToggleHeaders = (checked: boolean) => {
    // If state isn't changing, do nothing
    if (checked === hasHeaders()) {
      return
    }

    batch(() => {
      setHasHeaders(checked)

      if (checked) {
        // Switching from "No Header" to "Has Header"
        // Promote first row to header
        if (tableData.rows.length === 0) {
          return
        }

        const firstRow = tableData.rows[0]
        const remainingRows = tableData.rows.slice(1)

        // Update columns with names from the first row
        const newColumns = tableData.columns.map((col) => {
          const cellValue = firstRow.cells[col.id]
          const newName = cellValue ? String(cellValue) : col.name
          return {
            ...col,
            name: newName,
            originalName: newName,
          }
        })

        setTableData({
          columns: newColumns,
          rows: remainingRows,
        })
      } else {
        // Switching from "Has Header" to "No Header"
        // Demote header to first row
        const newRowId = crypto.randomUUID()
        const newRowCells: Record<string, any> = {}

        const newColumns = tableData.columns.map((col, index) => {
          newRowCells[col.id] = col.name
          const genericName = `Column ${index + 1}`
          return {
            ...col,
            name: genericName,
            originalName: genericName,
          }
        })

        const newRow = {
          id: newRowId,
          cells: newRowCells,
        }

        setTableData({
          columns: newColumns,
          rows: [newRow, ...tableData.rows],
        })
      }
    })
  }

  // Reset handler - clears sorting and pinning
  const handleReset = () => {
    batch(() => {
      // Use store path syntax for fine-grained updates without replacing the entire columns array
      setTableData('columns', {}, { isPinned: false, sortDirection: undefined })
      setColumnVisibility({})
    })
    toast.success('Table reset to original state')
  }

  // Clear handler
  const handleClear = () => {
    setTableData({ columns: [], rows: [] })
    setColumnVisibility({})
    toast.success('All data cleared')
  }

  const { isMobile, open } = useSidebar()

  return (
    <Show
      when={tableData.columns.length === 0}
      fallback={(
        <div class="space-y-4">
          <TableActions
            tableData={tableData}
            columnVisibility={columnVisibility()}
            onColumnVisibilityChange={setColumnVisibility}
            onReset={handleReset}
            onClear={handleClear}
            hasHeaders={hasHeaders()}
            onToggleHeaders={handleToggleHeaders}
          />
          <div
            class="border rounded-lg max-w-400 overflow-x-scroll"
            style={{
              width: !isMobile() && open() ? 'calc(100vw - 12rem - var(--sidebar-width))' : 'calc(100vw - 12rem)',
            }}
          >
            <DataTable
              data={tableData}
              onDataChange={setTableData}
              editable={true}
              columnVisibility={columnVisibility()}
            />
          </div>
        </div>
      )}
    >
      <InputSection onDataParsed={setTableData} />
    </Show>
  )
}
