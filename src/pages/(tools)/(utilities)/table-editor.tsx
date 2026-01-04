import { DataTable } from '#/components/data-table'
import { InputSection } from '#/components/table-editor/input-section'
import { TableActions } from '#/components/table-editor/table-actions'
import { useSidebar } from '#/components/ui/sidebar'
import { TableEditorProvider, useTableEditorContext } from '#/contexts/table-editor-context'
import { createRoute } from 'solid-file-router'
import { Show } from 'solid-js'

export default createRoute({
  info: {
    title: 'Table Editor',
    description: 'Parse, edit, and export tabular data from MySQL output, CSV or Excel files',
    category: 'Utilities',
    icon: 'lucide:table',
    tags: ['table', 'editor', 'mysql', 'excel', 'csv', 'sql', 'markdown'],
  },
  component: () => (
    <TableEditorProvider>
      <TableEditor />
    </TableEditorProvider>
  ),
})

function TableEditor() {
  const { store, actions: { setData }, computed } = useTableEditorContext()
  const { isMobile, open } = useSidebar()

  return (
    <Show
      when={!computed.hasData()}
      fallback={(
        <div class="space-y-4">
          <TableActions />
          <div
            class="border rounded-lg max-w-400 overflow-x-scroll"
            style={{
              width: !isMobile() && open() ? 'calc(100vw - 12rem - var(--sidebar-width))' : 'calc(100vw - 12rem)',
            }}
          >
            <DataTable
              data={store.tableData}
              onDataChange={setData}
              editable={true}
              columnVisibility={store.columnVisibility}
            />
          </div>
        </div>
      )}
    >
      <InputSection />
    </Show>
  )
}
