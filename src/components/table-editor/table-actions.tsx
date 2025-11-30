import type { TableData } from '#/utils/table/types'
import type { Component } from 'solid-js'

import { Button } from '#/components/ui/button'
import Icon from '#/components/ui/icon'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'

import { ExportDialog } from './export-dialog'

interface TableActionsProps {
  tableData: TableData
  columnVisibility: Record<string, boolean>
  onColumnVisibilityChange: (visibility: Record<string, boolean>) => void
  onClear: () => void
}

export const TableActions: Component<TableActionsProps> = (props) => {
  // Get visible column IDs
  const visibleColumnIds = () => {
    return props.tableData.columns
      .filter(col => props.columnVisibility[col.id] ?? true)
      .map(col => col.id)
  }

  // Handle column visibility changes
  const handleColumnVisibilityChange = (selectedIds: string[]) => {
    const newVisibility: Record<string, boolean> = {}
    props.tableData.columns.forEach((col) => {
      newVisibility[col.id] = selectedIds.includes(col.id)
    })
    props.onColumnVisibilityChange(newVisibility)
  }

  return (
    <div class="flex gap-2 items-center justify-between">
      <div class="w-56">
        <Select<string>
          multiple
          value={visibleColumnIds()}
          onChange={handleColumnVisibilityChange}
          options={props.tableData.columns.map(col => col.id)}
          placeholder="Select columns..."
          itemComponent={p => (
            <SelectItem item={p.item}>
              {props.tableData.columns.find(col => col.id === p.item.rawValue)?.name}
            </SelectItem>
          )}
        >
          <SelectTrigger>
            <SelectValue<string>>
              {() => {
                const selected = visibleColumnIds()
                if (selected.length === 0) {
                  return 'No columns'
                }
                if (selected.length === props.tableData.columns.length) {
                  return 'All columns'
                }
                return `${selected.length} column${selected.length > 1 ? 's' : ''}`
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>
      </div>

      <div class="flex gap-2">
        <ExportDialog tableData={props.tableData} />

        <Button variant="outline" onClick={props.onClear} class="text-destructive hover:text-destructive">
          <Icon name="lucide:trash-2" class="mr-2 size-4" />
          Clear
        </Button>
      </div>
    </div>
  )
}
