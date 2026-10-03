import { Field, Button, MultiSelect, Switch } from 'moraine'

import { ToolOptions } from '#/components/tool-options'
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
    <div class="space-y-4">
      <ToolOptions>
        <div class="tool-toolbar">
          <Field
            label="Visible columns"
            classes={{ root: 'min-w-0', label: 'sr-only', container: 'mt-0!' }}
          >
            <MultiSelect
              value={computed.visibleColumnIds()}
              onValueChange={handleColumnVisibilityChange}
              items={store.tableData.columns.map((col) => ({ value: col.id, label: col.name }))}
              classes={{ control: 'w-48' }}
            />
          </Field>

          <Switch
            label="First row is header"
            checked={store.hasHeaders}
            onCheckedChange={actions.toggleHeaders}
          />
        </div>
      </ToolOptions>

      <div class="tool-actions">
        <ExportDialog />

        <Button variant="secondary" onClick={actions.reset} leading="i-lucide-rotate-ccw">
          Reset
        </Button>

        <ClearButton onClear={actions.clear} />
      </div>
    </div>
  )
}
