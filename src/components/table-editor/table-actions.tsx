import { Button } from '#/components/ui/button'
import Icon from '#/components/ui/icon'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
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
        <Select<string>
          multiple
          value={computed.visibleColumnIds()}
          onChange={handleColumnVisibilityChange}
          options={store.tableData.columns.map(col => col.id)}
          placeholder="Select columns..."
          class="w-48"
          itemComponent={p => (
            <SelectItem item={p.item}>
              {store.tableData.columns.find(col => col.id === p.item.rawValue)?.name}
            </SelectItem>
          )}
        >
          <SelectTrigger>
            <SelectValue<string>>
              {() => {
                const selected = computed.visibleColumnIds()
                if (selected.length === 0) {
                  return 'No columns'
                }
                if (selected.length === store.tableData.columns.length) {
                  return 'All columns'
                }
                return `${selected.length} column${selected.length > 1 ? 's' : ''}`
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>

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
