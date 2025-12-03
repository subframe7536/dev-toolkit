import type { CellValue, TableData, TableRow } from '#/utils/table/types'
import type { ColumnDef, SortingState } from '@tanstack/solid-table'

import Icon from '#/components/ui/icon'
import { Tooltip, TooltipContent, TooltipTrigger } from '#/components/ui/tooltip'
import { createSolidTable, flexRender, getCoreRowModel, getSortedRowModel } from '@tanstack/solid-table'
import { cls } from 'cls-variant'
import { createEffect, createMemo, createSignal, For, Show } from 'solid-js'

export interface DataTableProps {
  data: TableData
  onDataChange: (data: TableData) => void
  editable?: boolean
  columnVisibility?: Record<string, boolean>
}

export function DataTable(props: DataTableProps) {
  // Table state
  const [columnOrder, setColumnOrder] = createSignal<string[]>([])
  const [sorting, setSorting] = createSignal<SortingState>([])
  const [columnPinning, setColumnPinning] = createSignal<{ left?: string[], right?: string[] }>({ left: [] })
  const [internalColumnVisibility, setInternalColumnVisibility] = createSignal<Record<string, boolean>>({})

  // Cell editing state
  const [editingCell, setEditingCell] = createSignal<{ rowId: string, columnId: string } | null>(null)
  const [editValue, setEditValue] = createSignal<string>('')

  // Focused cell for keyboard navigation
  const [focusedCell, setFocusedCell] = createSignal<{ rowIndex: number, columnIndex: number } | null>(null)

  // Initialize column order from data
  createEffect(() => {
    const colIds = props.data.columns.map(col => col.id)
    if (colIds.length > 0 && columnOrder().length === 0) {
      setColumnOrder(colIds)
    }
  })

  // Initialize column pinning from data
  createEffect(() => {
    const pinnedCols = props.data.columns.filter(col => col.isPinned).map(col => col.id)
    setColumnPinning({ left: pinnedCols })
  })

  // Initialize sorting from data
  createEffect(() => {
    const sortedCols = props.data.columns.filter(col => col.sortDirection)
    const sortingState: SortingState = sortedCols.map(col => ({
      id: col.id,
      desc: col.sortDirection === 'desc',
    }))
    setSorting(sortingState)
  })

  // Sync external column visibility
  createEffect(() => {
    if (props.columnVisibility) {
      setInternalColumnVisibility(props.columnVisibility)
    }
  })

  // Handle cell save
  const handleCellSave = (rowId: string, columnId: string, value: string) => {
    setEditingCell(null)

    // Parse value to appropriate type
    let parsedValue: CellValue = value

    // Try to parse as number
    if (value.trim() !== '' && !Number.isNaN(Number(value))) {
      parsedValue = Number(value)
    } else if (value.toLowerCase() === 'true') { // Try to parse as boolean
      parsedValue = true
    } else if (value.toLowerCase() === 'false') {
      parsedValue = false
    } else if (value.toLowerCase() === 'null' || value === '') { // Try to parse as null
      parsedValue = null
    }

    // Update table data
    const newRows = props.data.rows.map((row) => {
      if (row.id === rowId) {
        return {
          ...row,
          cells: {
            ...row.cells,
            [columnId]: parsedValue,
          },
        }
      }
      return row
    })

    props.onDataChange({
      ...props.data,
      rows: newRows,
    })
  }

  // Create column definitions
  const columns = (): ColumnDef<TableRow>[] => {
    return props.data.columns.map((col): ColumnDef<TableRow> => ({
      id: col.id,
      accessorFn: row => row.cells[col.id],
      header: col.name,
      enableSorting: true,
      enablePinning: true,
      cell: (info) => {
        const rowId = info.row.original.id
        const columnId = col.id
        const value = info.getValue() as CellValue
        const isEditing = createMemo(() => editingCell()?.rowId === rowId && editingCell()?.columnId === columnId)
        const rowIndex = info.row.index
        const columnIndex = info.table.getVisibleLeafColumns().findIndex(c => c.id === columnId)
        const isFocused = createMemo(() => focusedCell()?.rowIndex === rowIndex && focusedCell()?.columnIndex === columnIndex)

        const startEditing = () => {
          if (props.editable) {
            setEditingCell({ rowId, columnId })
            setEditValue(value?.toString() ?? '')
          }
        }

        return (
          <Show
            when={isEditing()}
            fallback={(
              <div
                class={cls(
                  'cursor-text px-3 py-2 outline-none h-full',
                  props.editable && 'hover:bg-accent/50',
                  isFocused() && 'ring-2 ring-primary ring-inset select-none rounded',
                )}
                tabIndex={0}
                role="gridcell"
                aria-label={`${col.name}: ${value?.toString() ?? 'empty'}`}
                onDblClick={startEditing}
                onFocus={() => setFocusedCell({ rowIndex, columnIndex })}
                onBlur={() => setFocusedCell({ columnIndex: -1, rowIndex: -1 })}
              >
                <Show when={value === null} fallback={value!.toString()}>
                  <span class="text-muted-foreground font-italic">NULL</span>
                </Show>
              </div>
            )}
          >
            <textarea
              class="px-3 py-2 border-2 border-primary rounded bg-input w-full focus:outline-none"
              value={editValue()}
              aria-label={`Editing ${col.name}`}
              ref={r => setTimeout(() => r.focus(), 0)}
              onInput={e => setEditValue(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCellSave(rowId, columnId, editValue())
                } else if (e.key === 'Escape') {
                  setEditingCell(null)
                }
              }}
              onBlur={() => handleCellSave(rowId, columnId, editValue())}
            />
          </Show>
        )
      },
    }))
  }

  // Create table instance
  const table = createSolidTable({
    get data() {
      return props.data.rows
    },
    get columns() {
      return columns()
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      get columnOrder() {
        return columnOrder()
      },
      get sorting() {
        return sorting()
      },
      get columnPinning() {
        return columnPinning()
      },
      get columnVisibility() {
        return internalColumnVisibility()
      },
    },
    onColumnOrderChange: setColumnOrder,
    onSortingChange: setSorting,
    onColumnPinningChange: setColumnPinning,
    onColumnVisibilityChange: setInternalColumnVisibility,
    enableSorting: true,
    enableColumnPinning: true,
  })

  // Handle column pin toggle
  const handlePinToggle = (columnId: string) => {
    const currentPinned = columnPinning().left || []
    const isPinned = currentPinned.includes(columnId)

    const newPinned = isPinned
      ? currentPinned.filter(id => id !== columnId)
      : [...currentPinned, columnId]

    setColumnPinning({ left: newPinned })

    // Update column isPinned in data
    const newColumns = props.data.columns.map((col) => {
      if (col.id === columnId) {
        return { ...col, isPinned: !isPinned }
      }
      return col
    })

    props.onDataChange({
      ...props.data,
      columns: newColumns,
    })
  }

  // Handle column sort
  const handleSort = (columnId: string) => {
    const currentSort = sorting().find(s => s.id === columnId)
    let newSorting: SortingState

    if (!currentSort) {
      newSorting = [{ id: columnId, desc: false }]
    } else if (!currentSort.desc) {
      newSorting = [{ id: columnId, desc: true }]
    } else {
      newSorting = []
    }

    setSorting(newSorting)

    // Update column sortDirection in data
    const newColumns = props.data.columns.map((col) => {
      if (col.id === columnId) {
        const sortState = newSorting.find(s => s.id === columnId)
        return {
          ...col,
          sortDirection: sortState ? (sortState.desc ? 'desc' as const : 'asc' as const) : undefined,
        }
      }
      return { ...col, sortDirection: undefined }
    })

    props.onDataChange({
      ...props.data,
      columns: newColumns,
    })
  }

  return (
    <div class="border rounded-lg">
      <table class="w-full border-collapse" role="grid" aria-label="Data table">
        <thead class="bg-muted/50" role="rowgroup">
          <For each={table.getHeaderGroups()}>
            {(headerGroup) => {
              return (
                <tr role="row">
                  <For each={headerGroup.headers}>
                    {(header) => {
                      const columnId = header.column.id
                      const isPinned = createMemo(() => (columnPinning().left || []).includes(columnId))
                      const sortState = sorting().find(s => s.id === columnId)

                      return (
                        <th
                          class={cls(
                            'select-none b-(b r border) text-left text-sm font-semibold min-w-30',
                            isPinned() ? 'sticky left-0 z-10 bg-muted shadow-[2px_0_8px_rgba(0,0,0,0.1)] border-r-2!' : 'bg-muted/50',
                          )}
                          role="columnheader"
                          aria-sort={sortState ? (sortState.desc ? 'descending' : 'ascending') : 'none'}
                        >
                          <div class="px-3 py-2 flex gap-2 items-center">
                            <div
                              class="flex-1 cursor-pointer hover:text-primary"
                              onClick={() => handleSort(columnId)}
                            >
                              <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                              <Show when={sortState}>
                                <Icon
                                  name={sortState?.desc ? 'lucide:arrow-down' : 'lucide:arrow-up'}
                                  class="ml-1 size-3 inline-block"
                                />
                              </Show>
                            </div>

                            <Tooltip>
                              <TooltipTrigger
                                as="button"
                                class="px-1 rounded hover:bg-accent"
                                onClick={() => handlePinToggle(columnId)}
                                aria-label={isPinned() ? `Unpin ${flexRender(header.column.columnDef.header, header.getContext())} column` : `Pin ${flexRender(header.column.columnDef.header, header.getContext())} column`}
                              >
                                <Icon
                                  name={isPinned() ? 'lucide:pin-off' : 'lucide:pin'}
                                  class={cls('mt-1', isPinned() && 'text-primary')}
                                  title=""
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                {isPinned() ? 'Unpin column' : 'Pin column'}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </th>
                      )
                    }}
                  </For>
                </tr>
              )
            }}
          </For>
        </thead>
        <tbody role="rowgroup">
          <For each={table.getRowModel().rows}>
            {(row, index) => {
              return (
                <tr class={cls('b-(b border)', index() % 2 === 0 ? 'bg-background/20' : 'bg-muted/20')} role="row">
                  <For each={row.getVisibleCells()}>
                    {(cell) => {
                      const columnId = cell.column.id
                      const isPinned = createMemo(() => (columnPinning().left || []).includes(columnId))

                      return (
                        <td
                          class={cls(
                            'text-sm min-w-30 b-(r border)',
                            isPinned() && ['sticky left-0 z-10 shadow-sm', index() % 2 === 0 ? 'bg-background' : 'bg-muted'],
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      )
                    }}
                  </For>
                </tr>
              )
            }}
          </For>
        </tbody>
      </table>

      <Show when={props.data.rows.length === 0}>
        <div class="text-muted-foreground flex min-h-[200px] items-center justify-center">
          <p>No data available</p>
        </div>
      </Show>
    </div>
  )
}
