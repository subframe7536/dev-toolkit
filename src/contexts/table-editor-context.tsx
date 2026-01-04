import type { CellValue, ColumnDefinition, TableData } from '#/utils/table/types'
import type { ParentProps } from 'solid-js'
import type { SetStoreFunction } from 'solid-js/store'

import { batch, createContext, createSignal, useContext } from 'solid-js'
import { createStore, produce } from 'solid-js/store'
import { toast } from 'solid-sonner'

export interface TableEditorStore {
  tableData: TableData
  columnVisibility: Record<string, boolean>
  hasHeaders: boolean
}

export interface TableEditorContextValue {
  store: TableEditorStore
  actions: {
    setData: (data: TableData) => void
    setColumnVisibility: (visibility: Record<string, boolean>) => void
    toggleHeaders: (hasHeaders: boolean) => void
    reset: () => void
    clear: () => void
  }
  computed: {
    hasData: () => boolean
    visibleColumns: () => ColumnDefinition[]
    visibleColumnIds: () => string[]
  }
}

const TableEditorContext = createContext<TableEditorContextValue>()

export function useTableEditorContext() {
  const context = useContext(TableEditorContext)
  if (!context) {
    throw new Error('useTableEditorContext must be used within TableEditorProvider')
  }
  return context
}

export function TableEditorProvider(props: ParentProps) {
  const [tableData, setTableData] = createStore<TableData>({
    columns: [],
    rows: [],
  })

  const [columnVisibility, setColumnVisibility] = createSignal<Record<string, boolean>>({})
  const [hasHeaders, setHasHeaders] = createSignal(true)

  const actions = {
    setData: (data: TableData) => {
      setTableData(data)
    },

    setColumnVisibility: (visibility: Record<string, boolean>) => {
      setColumnVisibility(visibility)
    },

    toggleHeaders: (checked: boolean) => {
      batch(() => {
        setHasHeaders(checked)

        if (checked) {
          if (tableData.rows.length === 0) {
            return
          }

          setTableData(produce((tb) => {
            if (!tb.rows) {
              return
            }
            tb.rows = tb.rows.slice(1)
            const firstRow = tableData.rows[0]
            for (const col of tb.columns || []) {
              const cellValue = firstRow.cells[col.id]
              col.name = col.originalName = cellValue ? String(cellValue) : col.name
            }
          }))
        } else {
          const newRowId = crypto.randomUUID()
          const newRowCells: Record<string, CellValue> = {}

          setTableData(produce((tb) => {
            if (!tb.columns) {
              return
            }
            for (let i = 0; i < tb.columns.length; i++) {
              const col = tb.columns[i]
              newRowCells[col.id] = col.name
              col.name = col.originalName = `Column ${i + 1}`
            }
            tb.rows?.splice(0, 0, { id: newRowId, cells: newRowCells })
          }))
        }
      })
    },

    reset: () => {
      batch(() => {
        setTableData('columns', {}, { isPinned: false, sortDirection: undefined })
        setColumnVisibility({})
      })
      toast.success('Table reset to original state')
    },

    clear: () => {
      setTableData({ columns: [], rows: [] })
      setColumnVisibility({})
      toast.success('All data cleared')
    },
  }

  const computed = {
    hasData: () => tableData.columns.length > 0,

    visibleColumns: () => {
      const visibility = columnVisibility()
      return tableData.columns.filter(col => visibility[col.id] ?? true)
    },

    visibleColumnIds: () => {
      const visibility = columnVisibility()
      return tableData.columns
        .filter(col => visibility[col.id] ?? true)
        .map(col => col.id)
    },
  }

  const store: TableEditorStore = {
    get tableData() {
      return tableData
    },
    get columnVisibility() {
      return columnVisibility()
    },
    get hasHeaders() {
      return hasHeaders()
    },
  }

  const contextValue: TableEditorContextValue = {
    store,
    actions,
    computed,
  }

  return (
    <TableEditorContext.Provider value={contextValue}>
      {props.children}
    </TableEditorContext.Provider>
  )
}
