import { Button, Select, Switch } from 'moraine'
import { useTableEditorContext } from '#/contexts/table-editor-context'

import { ClearButton } from '../clear-button'
import { ExportDialog } from './export-dialog'

export function TableActions() {
  const { store, actions, computed } = useTableEditorContext()

  const handleColumnVisibilityChange = (selectedIds: string[]) => {
    const newVisibility: Record<string, boolean> = {}
    store.tableData.columns.forEach((col) => {
      newVisibility[col.id] = selectedIds.includes(col.id)
    })
    actions.setColumnVisibility(newVisibility)
  }

  return (
    <div class="flex gap-2 items-center justify-between">
      <div class="flex gap-4 items-center">
        <Select
          multiple
          value={computed.visibleColumnIds()}
          onChange={handleColumnVisibilityChange}
          options={store.tableData.columns.map(col => ({ value: col.id, label: col.name }))}
          classes={{ root: 'w-48' }}
        />

        <Switch
          label="First row is header"
          checked={store.hasHeaders}
          onChange={actions.toggleHeaders}
        />
      </div>

      <div class="flex gap-2">
        <ExportDialog />

        <Button variant="secondary" onClick={actions.reset} leading="i-lucide-rotate-ccw">
          Reset
        </Button>

        <ClearButton onClear={actions.clear} />
      </div>
    </div>
  )
}
