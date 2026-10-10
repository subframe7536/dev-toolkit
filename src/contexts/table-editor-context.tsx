import type { ParentProps } from 'solid-js'
import { batch, createContext, createSignal, useContext } from 'solid-js'
import { createStore } from 'solid-js/store'
import { toast } from 'solid-toaster'

import type { ColumnDefinition, TableData } from '#/utils/table/types'

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
          const firstRow = tableData.rows[0]
          if (!firstRow) {
            return
          }
          setTableData({
            columns: tableData.columns.map((col) => {
              const value = firstRow.cells[col.id]
              const name = value === null || value === '' ? col.name : String(value)
              return { ...col, name, originalName: name }
            }),
            rows: tableData.rows.slice(1),
          })
        } else {
          setTableData({
            columns: tableData.columns.map((col, index) => ({
              ...col,
              name: `Column ${index + 1}`,
              originalName: `Column ${index + 1}`,
            })),
            rows: [
              {
                id: crypto.randomUUID(),
                cells: Object.fromEntries(tableData.columns.map((col) => [col.id, col.name])),
              },
              ...tableData.rows,
            ],
          })
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
      return tableData.columns.filter((col) => visibility[col.id] ?? true)
    },

    visibleColumnIds: () => {
      const visibility = columnVisibility()
      return tableData.columns.filter((col) => visibility[col.id] ?? true).map((col) => col.id)
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
    <TableEditorContext.Provider value={contextValue}>{props.children}</TableEditorContext.Provider>
  )
}
