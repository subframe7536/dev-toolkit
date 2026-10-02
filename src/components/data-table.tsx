import type { ColumnDef, ColumnPinningState, SortingState } from '@tanstack/solid-table'
import {
  columnOrderingFeature,
  columnPinningFeature,
  columnVisibilityFeature,
  createSortedRowModel,
  createTable,
  FlexRender,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
} from '@tanstack/solid-table'
import { Icon, Tooltip, cn } from 'moraine'
import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from 'solid-js'

import type { CellValue, TableData, TableRow } from '#/utils/table/types'

const features = tableFeatures({
  columnOrderingFeature,
  columnPinningFeature,
  columnVisibilityFeature,
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    text: sortFn_text,
  },
})

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
  const [columnPinning, setColumnPinning] = createSignal<ColumnPinningState>({
    start: [],
    end: [],
  })
  const [internalColumnVisibility, setInternalColumnVisibility] = createSignal<
    Record<string, boolean>
  >({})
  const [columnWidths, setColumnWidths] = createSignal<Record<string, number>>({})
  const headers = new Map<string, HTMLTableCellElement>()
  let resizeObserver: ResizeObserver | undefined

  onMount(() => {
    resizeObserver = new ResizeObserver(() => {
      setColumnWidths(
        Object.fromEntries(
          [...headers]
            .filter(([, el]) => el.isConnected)
            .map(([id, el]) => [id, el.getBoundingClientRect().width]),
        ),
      )
    })
    headers.forEach((header) => resizeObserver!.observe(header))
  })
  onCleanup(() => resizeObserver?.disconnect())

  // Cell editing state
  const [editingCell, setEditingCell] = createSignal<{ rowId: string; columnId: string } | null>(
    null,
  )
  const [editValue, setEditValue] = createSignal<string>('')

  // Focused cell for keyboard navigation
  const [focusedCell, setFocusedCell] = createSignal<{
    rowIndex: number
    columnIndex: number
  } | null>(null)

  // Initialize column order from data
  createEffect(() => {
    const colIds = props.data.columns.map((col) => col.id)
    if (colIds.length > 0 && columnOrder().length === 0) {
      setColumnOrder(colIds)
    }
  })

  // Initialize column pinning from data
  createEffect(() => {
    const pinnedCols = props.data.columns.filter((col) => col.isPinned).map((col) => col.id)
    setColumnPinning({ start: pinnedCols, end: [] })
  })

  // Initialize sorting from data
  createEffect(() => {
    const sortedCols = props.data.columns.filter((col) => col.sortDirection)
    const sortingState: SortingState = sortedCols.map((col) => ({
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
    } else if (value.toLowerCase() === 'true') {
      // Try to parse as boolean
      parsedValue = true
    } else if (value.toLowerCase() === 'false') {
      parsedValue = false
    } else if (value.toLowerCase() === 'null' || value === '') {
      // Try to parse as null
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
  const columns = createMemo((): ColumnDef<typeof features, TableRow>[] => {
    return props.data.columns.map((col): ColumnDef<typeof features, TableRow> => ({
      id: col.id,
      accessorFn: (row) => row.cells[col.id],
      header: col.name,
      enableSorting: true,
      enablePinning: true,
      cell: (info) => {
        const rowId = info.row.original.id
        const columnId = col.id
        const value = info.getValue() as CellValue
        const isEditing = createMemo(
          () => editingCell()?.rowId === rowId && editingCell()?.columnId === columnId,
        )
        const rowIndex = info.row.index
        const columnIndex = info.table.getVisibleLeafColumns().findIndex((c) => c.id === columnId)
        const isFocused = createMemo(
          () => focusedCell()?.rowIndex === rowIndex && focusedCell()?.columnIndex === columnIndex,
        )

        const startEditing = () => {
          if (props.editable) {
            setEditingCell({ rowId, columnId })
            setEditValue(value?.toString() ?? '')
          }
        }

        return (
          <Show
            when={isEditing()}
            fallback={
              <div
                class={cn(
                  'px-3 py-2 outline-none h-full cursor-text',
                  props.editable && 'hover:bg-accent/50',
                  isFocused() && 'rounded select-none ring-2 ring-primary ring-inset',
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
            }
          >
            <textarea
              class="px-3 py-2 border-2 border-primary rounded bg-input w-full focus:outline-none"
              value={editValue()}
              aria-label={`Editing ${col.name}`}
              ref={(r) => setTimeout(() => r.focus(), 0)}
              onInput={(e) => setEditValue(e.currentTarget.value)}
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
  })

  // Create table instance
  const table = createTable({
    features,
    get data() {
      return props.data.rows
    },
    get columns() {
      return columns()
    },
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

  const pinnedOffset = (columnId: string) => {
    let offset = 0
    for (const column of table.getVisibleLeafColumns()) {
      if (column.id === columnId) {
        break
      }
      if (columnPinning().start.includes(column.id)) {
        offset += columnWidths()[column.id] ?? 0
      }
    }
    return `${offset}px`
  }

  // Handle column pin toggle
  const handlePinToggle = (columnId: string) => {
    const currentPinned = columnPinning().start
    const isPinned = currentPinned.includes(columnId)

    const newPinned = isPinned
      ? currentPinned.filter((id) => id !== columnId)
      : [...currentPinned, columnId]

    setColumnPinning({ start: newPinned, end: [] })

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
    const currentSort = sorting().find((s) => s.id === columnId)
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
        const sortState = newSorting.find((s) => s.id === columnId)
        return {
          ...col,
          sortDirection: sortState
            ? sortState.desc
              ? ('desc' as const)
              : ('asc' as const)
            : undefined,
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
                      const isPinned = createMemo(() => columnPinning().start.includes(columnId))
                      const sortState = createMemo(() => sorting().find((s) => s.id === columnId))

                      return (
                        <th
                          class={cn(
                            'font-semibold text-left b-(b r border) min-w-30 select-none text-sm',
                            isPinned() ? 'bg-muted sticky z-10' : 'bg-muted/50',
                          )}
                          ref={(element) => {
                            const previous = headers.get(columnId)
                            if (previous) {
                              resizeObserver?.unobserve(previous)
                            }
                            headers.set(columnId, element)
                            resizeObserver?.observe(element)
                          }}
                          style={{ left: isPinned() ? pinnedOffset(columnId) : undefined }}
                          role="columnheader"
                          aria-sort={
                            sortState() ? (sortState()!.desc ? 'descending' : 'ascending') : 'none'
                          }
                        >
                          <div class="px-3 py-2 flex gap-2 items-center">
                            <div
                              class="flex-1 cursor-pointer hover:text-primary"
                              onClick={() => handleSort(columnId)}
                            >
                              <span>
                                <FlexRender header={header} />
                              </span>
                              <Show when={sortState()}>
                                <Icon
                                  name={
                                    sortState()?.desc ? 'i-lucide-arrow-down' : 'i-lucide-arrow-up'
                                  }
                                  class="ml-1 size-3 inline-block"
                                />
                              </Show>
                            </div>

                            <Tooltip>
                              <Tooltip.Trigger
                                class="px-1 rounded hover:bg-accent"
                                onClick={() => handlePinToggle(columnId)}
                                aria-label={
                                  isPinned()
                                    ? `Unpin ${header.column.columnDef.header} column`
                                    : `Pin ${header.column.columnDef.header} column`
                                }
                              >
                                <Icon
                                  name={isPinned() ? 'i-lucide-pin-off' : 'i-lucide-pin'}
                                  class={['mt-1', isPinned() && 'text-primary']}
                                  title=""
                                />
                              </Tooltip.Trigger>
                              <Tooltip.Content text={isPinned() ? 'Unpin column' : 'Pin column'} />
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
                <tr
                  class={cn('b-(b border)', index() % 2 === 0 ? 'bg-background/20' : 'bg-muted/20')}
                  role="row"
                >
                  <For each={row.getVisibleCells()}>
                    {(cell) => {
                      const columnId = cell.column.id
                      const isPinned = createMemo(() => columnPinning().start.includes(columnId))

                      return (
                        <td
                          class={cn(
                            'b-(r border) min-w-30 text-sm',
                            isPinned() && [
                              'sticky z-10',
                              index() % 2 === 0 ? 'bg-background' : 'bg-muted',
                            ],
                          )}
                          style={{ left: isPinned() ? pinnedOffset(columnId) : undefined }}
                        >
                          <FlexRender cell={cell} />
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
