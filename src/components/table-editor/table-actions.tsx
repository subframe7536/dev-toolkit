import { Button } from '#/components/ui/button'
import Icon from '#/components/ui/icon'
import { SimpleSelect } from '#/components/ui/select'
import { Switch } from '#/components/ui/switch'
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
        <SimpleSelect
          multiple
          value={computed.visibleColumnIds()}
          onChange={handleColumnVisibilityChange}
          options={store.tableData.columns.map(col => ({
            value: col.id,
            label: col.name,
          }))}
          placeholder="Select columns..."
          class="w-48"
        />

        <Switch
          text="First row is header"
          checked={store.hasHeaders}
          onChange={actions.toggleHeaders}
        />
      </div>

      <div class="flex gap-2">
        <ExportDialog />

        <Button variant="secondary" onClick={actions.reset}>
          <Icon name="lucide:rotate-ccw" class="mr-2" />
          Reset
        </Button>

        <ClearButton onClear={actions.clear} />
      </div>
    </div>
  )
}
