import type { TableData } from '#/utils/table/types'

import { DataTable } from '#/components/data-table'
import { InputSection } from '#/components/table-editor/input-section'
import { TableActions } from '#/components/table-editor/table-actions'
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

  // Clear handler
  const handleClear = () => {
    setTableData({ columns: [], rows: [] })
    setColumnVisibility({})
    toast.success('All data cleared')
  }

  return (
    <Show
      when={tableData.columns.length === 0}
      fallback={(
        <div class="space-y-4">
          <TableActions
            tableData={tableData}
            columnVisibility={columnVisibility()}
            onColumnVisibilityChange={setColumnVisibility}
            onClear={handleClear}
          />

          <DataTable
            data={tableData}
            onDataChange={setTableData}
            editable={true}
            columnVisibility={columnVisibility()}
          />
        </div>
      )}
    >
      <InputSection onDataParsed={handleDataParsed} />
    </Show>
  )
}
