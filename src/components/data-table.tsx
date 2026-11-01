import type { CellContext } from '@tanstack/solid-table'
import { Button, Textarea } from 'moraine'
import type { DataTableT } from 'moraine/data-table'
import { DataTable as MoraineDataTable, createDataTable } from 'moraine/data-table'
import { createMemo, createSignal, Show } from 'solid-js'

import type { CellValue, ColumnDefinition, TableData, TableRow } from '#/utils/table/types'

export interface DataTableProps {
  data: TableData
  onDataChange: (data: TableData) => void
  editable?: boolean
  columnVisibility?: Record<string, boolean>
}

interface EditingCell {
  rowId: string
  columnId: string
}

function parseCellValue(value: string): CellValue {
  const lower = value.toLowerCase()
  if (value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value)
  }
  if (lower === 'true') {
    return true
  }
  if (lower === 'false') {
    return false
  }
  if (lower === 'null' || value === '') {
    return null
  }
  return value
}

export function DataTable(props: DataTableProps) {
  const [editing, setEditing] = createSignal<EditingCell>()

  const updateColumns = (update: (col: ColumnDefinition) => ColumnDefinition) => {
    props.onDataChange({ ...props.data, columns: props.data.columns.map(update) })
  }

  const saveCell = (rowId: string, columnId: string, draft: string) => {
    setEditing(undefined)
    props.onDataChange({
      ...props.data,
      rows: props.data.rows.map((row) =>
        row.id === rowId
          ? { ...row, cells: { ...row.cells, [columnId]: parseCellValue(draft) } }
          : row,
      ),
    })
  }

  function PinnableHeader(headerProps: { column: ColumnDefinition }) {
    const label = () => headerProps.column.name
    return (
      <span class="flex gap-2 items-center justify-between">
        <span class="truncate">{label()}</span>
        <Button
          variant="ghost"
          size="icon-xs"
          tone={headerProps.column.isPinned ? 'primary' : 'neutral'}
          leading={headerProps.column.isPinned ? 'i-lucide-pin-off' : 'i-lucide-pin'}
          aria-label={`${headerProps.column.isPinned ? 'Unpin' : 'Pin'} ${label()} column`}
          title={headerProps.column.isPinned ? 'Unpin column' : 'Pin column'}
          onClick={(event) => {
            event.stopPropagation()
            const columnId = headerProps.column.id
            updateColumns((col) =>
              col.id === columnId ? { ...col, isPinned: !col.isPinned } : col,
            )
          }}
        />
      </span>
    )
  }

  function EditableCell(cellProps: {
    context: CellContext<DataTableT.Features, TableRow>
    name: string
  }) {
    const rowId = () => cellProps.context.row.original.id
    const columnId = () => cellProps.context.column.id
    const value = () => cellProps.context.getValue() as CellValue
    const isEditing = () => editing()?.rowId === rowId() && editing()?.columnId === columnId()
    const [draft, setDraft] = createSignal('')

    const start = () => {
      if (props.editable) {
        setDraft(value()?.toString() ?? '')
        setEditing({ rowId: rowId(), columnId: columnId() })
      }
    }
    const save = () => {
      // Removing the textarea fires `blur` after Enter or Escape already finished the edit.
      if (isEditing()) {
        saveCell(rowId(), columnId(), draft())
      }
    }

    return (
      <Show
        when={isEditing()}
        fallback={
          <div
            role={props.editable ? 'button' : undefined}
            tabIndex={props.editable ? 0 : undefined}
            aria-label={`${cellProps.name}: ${value()?.toString() ?? 'empty'}`}
            class="px-1 py-0.5 rounded min-h-6 cursor-text -mx-1 focus-visible:(outline-none ring-2 ring-ring/50) hover:bg-accent/60"
            onDblClick={start}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === 'F2') {
                event.preventDefault()
                start()
              }
            }}
          >
            <Show
              when={value() !== null}
              fallback={<span class="text-muted-foreground italic">NULL</span>}
            >
              {value()!.toString()}
            </Show>
          </div>
        }
      >
        <Textarea
          aria-label={`Editing ${cellProps.name}`}
          class="min-h-0 w-full"
          rows={2}
          autofocus
          value={draft()}
          onValueChange={setDraft}
          onBlur={save}
          onKeyDown={(event: KeyboardEvent) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              save()
            } else if (event.key === 'Escape') {
              event.preventDefault()
              setEditing(undefined)
            }
          }}
        />
      </Show>
    )
  }

  const columns = createMemo(() =>
    props.data.columns.map((col): DataTableT.Column<TableRow> => ({
      id: col.id,
      accessorFn: (row) => row.cells[col.id],
      header: () => <PinnableHeader column={col} />,
      cell: (context) => <EditableCell context={context} name={col.name} />,
      size: 180,
      minSize: 120,
    })),
  )

  const table = createDataTable({
    get data() {
      return props.data.rows
    },
    get columns() {
      return columns()
    },
    getRowId: (row) => row.id,
    state: {
      get sorting() {
        return props.data.columns
          .filter((col) => col.sortDirection)
          .map((col) => ({ id: col.id, desc: col.sortDirection === 'desc' }))
      },
      get columnPinning() {
        return {
          start: props.data.columns.filter((col) => col.isPinned).map((col) => col.id),
          end: [],
        }
      },
      get columnVisibility() {
        return props.columnVisibility ?? {}
      },
    },
    onSortingChange: (sorting) => {
      updateColumns((col) => {
        const sort = sorting.find((s) => s.id === col.id)
        return { ...col, sortDirection: sort ? (sort.desc ? 'desc' : 'asc') : undefined }
      })
    },
    onColumnPinningChange: (pinning) => {
      const pinned = new Set(pinning.start ?? [])
      updateColumns((col) => ({ ...col, isPinned: pinned.has(col.id) }))
    },
    tableOptions: {
      enableMultiSort: false,
      sortDescFirst: false,
    },
  })

  return (
    <MoraineDataTable
      table={table}
      aria-label="Data table"
      size="sm"
      emptyRender="No data available"
    />
  )
}
