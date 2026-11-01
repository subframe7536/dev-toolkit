import { createRoute } from 'solid-file-router'
import { Show } from 'solid-js'

import { DataTable } from '#/components/data-table'
import { InputSection } from '#/components/table-editor/input-section'
import { TableActions } from '#/components/table-editor/table-actions'
import { TableEditorProvider, useTableEditorContext } from '#/contexts/table-editor-context'

export default createRoute({
  info: {
    title: 'Table Editor',
    description: 'Parse, edit, and export tabular data from MySQL output, CSV or Excel files',
    category: 'Utilities',
    icon: 'i-lucide-table',
    tags: ['table', 'editor', 'mysql', 'excel', 'csv', 'sql', 'markdown'],
  },
  component: () => (
    <TableEditorProvider>
      <TableEditor />
    </TableEditorProvider>
  ),
})

function TableEditor() {
  const {
    store,
    actions: { setData },
    computed,
  } = useTableEditorContext()

  return (
    <Show
      when={!computed.hasData()}
      fallback={
        <div class="space-y-4">
          <TableActions />
          <div class="rounded-lg min-w-0 w-full overflow-x-auto">
            <DataTable
              data={store.tableData}
              onDataChange={setData}
              editable={true}
              columnVisibility={store.columnVisibility}
            />
          </div>
        </div>
      }
    >
      <InputSection />
    </Show>
  )
}
