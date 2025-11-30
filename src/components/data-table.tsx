import type { CellValue, ColumnDefinition, TableData, TableRow } from '#/utils/table/types'
import type { ColumnDef, SortingState } from '@tanstack/solid-table'

import Icon from '#/components/ui/icon'
import { Tooltip, TooltipContent, TooltipTrigger } from '#/components/ui/tooltip'
import { createSolidTable, flexRender, getCoreRowModel, getSortedRowModel } from '@tanstack/solid-table'
import { cls } from 'cls-variant'
import { createEffect, createSignal, For, Show } from 'solid-js'

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

  // Drag and drop state
  const [draggedColumn, setDraggedColumn] = createSignal<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = createSignal<string | null>(null)

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
    if (pinnedCols.length > 0) {
      setColumnPinning({ left: pinnedCols })
    }
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
    } else if (value.toLowerCase() === 'null' || value.trim() === '') { // Try to parse as null
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

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent, rowIndex: number, columnIndex: number, tableInstance: ReturnType<typeof createSolidTable<TableRow>>) => {
    const rows = tableInstance.getRowModel().rows
    const visibleColumns = tableInstance.getVisibleLeafColumns()

    if (editingCell()) {
      // Don't handle navigation when editing
      return
    }

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        if (rowIndex > 0) {
          setFocusedCell({ rowIndex: rowIndex - 1, columnIndex })
        }
        break
      case 'ArrowDown':
        e.preventDefault()
        if (rowIndex < rows.length - 1) {
          setFocusedCell({ rowIndex: rowIndex + 1, columnIndex })
        }
        break
      case 'ArrowLeft':
        e.preventDefault()
        if (columnIndex > 0) {
          setFocusedCell({ rowIndex, columnIndex: columnIndex - 1 })
        }
        break
      case 'ArrowRight':
        e.preventDefault()
        if (columnIndex < visibleColumns.length - 1) {
          setFocusedCell({ rowIndex, columnIndex: columnIndex + 1 })
        }
        break
      case 'Enter':
        if (props.editable) {
          e.preventDefault()
          const row = rows[rowIndex]
          const column = visibleColumns[columnIndex]
          if (row && column) {
            const rowId = row.original.id
            const columnId = column.id
            const value = row.original.cells[columnId]
            setEditingCell({ rowId, columnId })
            setEditValue(value?.toString() ?? '')
          }
        }
        break
    }
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
        const isEditing = editingCell()?.rowId === rowId && editingCell()?.columnId === columnId
        const rowIndex = info.row.index
        const columnIndex = info.table.getVisibleLeafColumns().findIndex(c => c.id === columnId)
        const isFocused = focusedCell()?.rowIndex === rowIndex && focusedCell()?.columnIndex === columnIndex

        return (
          <Show
            when={isEditing}
            fallback={(
              <div
                class={cls(
                  'cursor-text px-3 py-2 outline-none',
                  props.editable && 'hover:bg-accent/50',
                  isFocused && 'ring-2 ring-primary ring-inset',
                )}
                tabIndex={0}
                role="gridcell"
                aria-label={`${col.name}: ${value?.toString() ?? 'empty'}`}
                onClick={() => {
                  if (props.editable) {
                    setEditingCell({ rowId, columnId })
                    setEditValue(value?.toString() ?? '')
                  }
                }}
                onFocus={() => setFocusedCell({ rowIndex, columnIndex })}
                onKeyDown={e => handleKeyDown(e, rowIndex, columnIndex, info.table)}
              >
                {value?.toString() ?? ''}
              </div>
            )}
          >
            <input
              type="text"
              class="px-3 py-2 border-2 border-primary rounded w-full focus:outline-none"
              value={editValue()}
              aria-label={`Editing ${col.name}`}
              onInput={e => setEditValue(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCellSave(rowId, columnId, editValue())
                } else if (e.key === 'Escape') {
                  setEditingCell(null)
                }
              }}
              onBlur={() => handleCellSave(rowId, columnId, editValue())}
              ref={(el) => {
                setTimeout(() => el.focus(), 0)
              }}
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

  // Handle column drag start
  const handleDragStart = (columnId: string) => {
    return (e: DragEvent) => {
      setDraggedColumn(columnId)
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move'
      }
    }
  }

  // Handle column drag over
  const handleDragOver = (columnId: string) => {
    return (e: DragEvent) => {
      e.preventDefault()
      setDragOverColumn(columnId)
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move'
      }
    }
  }

  // Handle column drop
  const handleDrop = (e: DragEvent, targetColumnId: string) => {
    e.preventDefault()
    const sourceColumnId = draggedColumn()

    if (sourceColumnId && sourceColumnId !== targetColumnId) {
      const currentOrder = columnOrder()
      const sourceIndex = currentOrder.indexOf(sourceColumnId)
      const targetIndex = currentOrder.indexOf(targetColumnId)

      if (sourceIndex !== -1 && targetIndex !== -1) {
        const newOrder = [...currentOrder]
        newOrder.splice(sourceIndex, 1)
        newOrder.splice(targetIndex, 0, sourceColumnId)
        setColumnOrder(newOrder)

        // Update column order in data
        const newColumns = newOrder.map(id => props.data.columns.find(col => col.id === id)!).filter(Boolean)
        props.onDataChange({
          ...props.data,
          columns: newColumns,
        })
      }
    }

    setDraggedColumn(null)
    setDragOverColumn(null)
  }

  // Handle column drag end
  const handleDragEnd = () => {
    setDraggedColumn(null)
    setDragOverColumn(null)
  }

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
    <div class="border border-border rounded-lg overflow-x-auto">
      <table class="w-full border-collapse" role="grid" aria-label="Data table">
        <thead class="bg-muted/50" role="rowgroup">
          <For each={table.getHeaderGroups()}>
            {(headerGroup) => {
              return (
                <tr role="row">
                  <For each={headerGroup.headers}>
                    {(header) => {
                      const columnId = header.column.id
                      const isPinned = (columnPinning().left || []).includes(columnId)
                      const isDragging = draggedColumn() === columnId
                      const isDragOver = dragOverColumn() === columnId
                      const sortState = sorting().find(s => s.id === columnId)

                      return (
                        <th
                          class={cls(
                            'select-none border-b border-border bg-muted/50 text-left text-sm font-semibold',
                            isPinned && 'sticky left-0 z-10 bg-muted shadow-[2px_0_4px_rgba(0,0,0,0.1)]',
                            isDragging && 'opacity-50',
                            isDragOver && 'bg-accent',
                          )}
                          role="columnheader"
                          aria-sort={sortState ? (sortState.desc ? 'descending' : 'ascending') : 'none'}
                          draggable
                          onDragStart={handleDragStart(columnId)}
                          onDragOver={handleDragOver(columnId)}
                          onDrop={e => handleDrop(e, columnId)}
                          onDragEnd={handleDragEnd}
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
                                class="p-1 rounded hover:bg-accent"
                                onClick={() => handlePinToggle(columnId)}
                                aria-label={isPinned ? `Unpin ${flexRender(header.column.columnDef.header, header.getContext())} column` : `Pin ${flexRender(header.column.columnDef.header, header.getContext())} column`}
                              >
                                <Icon
                                  name={isPinned ? 'lucide:pin-off' : 'lucide:pin'}
                                  class={cls('size-4', isPinned && 'text-primary')}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                {isPinned ? 'Unpin column' : 'Pin column'}
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
                <tr class={cls('border-b border-border', index() % 2 === 0 ? 'bg-background' : 'bg-muted/20')} role="row">
                  <For each={row.getVisibleCells()}>
                    {(cell) => {
                      const columnId = cell.column.id
                      const isPinned = (columnPinning().left || []).includes(columnId)

                      return (
                        <td
                          class={cls(
                            'text-sm',
                            isPinned && 'sticky left-0 z-10 shadow-[2px_0_4px_rgba(0,0,0,0.05)]',
                            isPinned && index() % 2 === 0 ? 'bg-background' : 'bg-muted/20',
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
