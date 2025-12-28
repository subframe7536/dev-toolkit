import type { TableData } from '#/utils/table/types'

import { DataTable } from '#/components/data-table'
import { InputSection } from '#/components/table-editor/input-section'
import { TableActions } from '#/components/table-editor/table-actions'
import { useSidebar } from '#/components/ui/sidebar'
import { createRoute } from 'solid-file-router'
import { batch, createSignal, Show } from 'solid-js'
import { createStore, produce } from 'solid-js/store'
import { toast } from 'solid-sonner'

export default createRoute({
  info: {
    title: 'Table Editor',
    description: 'Parse, edit, and export tabular data from MySQL output, CSV or Excel files',
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
    batch(() => {
      setHasHeaders(checked)

      if (checked) {
        // Switching from "No Header" to "Has Header"
        // Promote first row to header
        if (tableData.rows.length === 0) {
          return
        }

        setTableData(produce((tb) => {
          if (!tb.rows) {
            return
          }
          tb.rows = tb.rows.slice(1)
          const firstRow = tableData.rows[0]
          for (const col of tb.columns || []) {
            const cellValue = firstRow.cells[col.id]
            col.name = col.originalName = cellValue ? String(cellValue) : col.name
          }
        }))
      } else {
        // Switching from "Has Header" to "No Header"
        // Demote header to first row
        const newRowId = crypto.randomUUID()
        const newRowCells: Record<string, any> = {}

        setTableData(produce((tb) => {
          if (!tb.columns) {
            return
          }
          for (let i = 0; i < tb.columns.length; i++) {
            const col = tb.columns[i]
            newRowCells[col.id] = col.name
            col.name = col.originalName = `Column ${i + 1}`
          }
          tb.rows?.splice(0, 0, { id: newRowId, cells: newRowCells })
        }))
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
