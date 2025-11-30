import type { TableData } from '#/utils/table/types'

import { DataTable } from '#/components/data-table'
import { InputSection } from '#/components/table-editor/input-section'
import { TableActions } from '#/components/table-editor/table-actions'
import { useSidebar } from '#/components/ui/sidebar'
import { createRoute } from 'solid-file-router'
import { createSignal, Show } from 'solid-js'
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

  // Handle data parsed from input
  const handleDataParsed = (data: TableData) => {
    setTableData(data)
  }

  // Reset handler - clears sorting and pinning
  const handleReset = () => {
    const resetColumns = tableData.columns.map(col => ({
      ...col,
      isPinned: false,
      sortDirection: undefined,
    }))
    // Create a completely new object to trigger reactivity
    setTableData({ columns: resetColumns, rows: [...tableData.rows] })
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
          />
          <div
            class="border rounded-lg overflow-x-scroll"
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
      <InputSection onDataParsed={handleDataParsed} />
    </Show>
  )
}
