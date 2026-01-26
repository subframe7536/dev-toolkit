import type { TableData } from '#/utils/table/types'

import { CopyButton } from '#/components/copy-button'
import { DownloadButton } from '#/components/download-button'
import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '#/components/ui/dialog'
import Icon from '#/components/ui/icon'
import { SimpleSelect } from '#/components/ui/select'
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsTrigger,
} from '#/components/ui/tabs'
import { TextField, TextFieldInput, TextFieldLabel, TextFieldTextArea } from '#/components/ui/text-field'
import { useTableEditorContext } from '#/contexts'
import { downloadFile } from '#/utils/download'
import { exportToCSV, exportToExcel, exportToJSON, exportToMarkdown, generateCreateTable, generateSQLInsert, generateSQLUpdate } from '#/utils/table/export'
import { createEffect, createSignal, For, Show } from 'solid-js'
import { toast } from 'solid-sonner'

type ExportFormat = 'sql-insert' | 'sql-update' | 'create-table' | 'excel' | 'csv' | 'markdown' | 'json-array'
type NamePattern = 'snake_case' | 'camelCase' | 'original'

const exportOptions: Array<{ value: ExportFormat, label: string }> = [
  { value: 'sql-insert', label: 'SQL INSERT' },
  { value: 'sql-update', label: 'SQL UPDATE' },
  { value: 'create-table', label: 'CREATE TABLE' },
  { value: 'excel', label: 'Excel (.xlsx)' },
  { value: 'csv', label: 'CSV' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'json-array', label: 'JSON Array' },
]

const namePatternOptions: Array<{ value: NamePattern, label: string }> = [
  { value: 'snake_case', label: 'snake_case' },
  { value: 'camelCase', label: 'camelCase' },
  { value: 'original', label: 'Original' },
]

export function ExportDialog() {
  const { store, computed } = useTableEditorContext()

  const [tableName, setTableName] = createSignal('my_table')
  const [namePattern, setNamePattern] = createSignal<NamePattern>('snake_case')
  const [exportFormat, setExportFormat] = createSignal<ExportFormat>('sql-insert')
  const [keyColumns, setKeyColumns] = createSignal<string[]>([])
  const [exportOutput, setExportOutput] = createSignal('')

  const generateExportOutput = () => {
    const format = exportFormat()
    if (format === 'excel') {
      return
    }

    const visibleColumns = computed.visibleColumns()

    if (visibleColumns.length === 0) {
      setExportOutput('')
      return
    }

    const filteredData: TableData = {
      columns: visibleColumns,
      rows: store.tableData.rows.map(row => ({
        ...row,
        cells: Object.fromEntries(
          visibleColumns.map(col => [col.id, row.cells[col.id]]),
        ),
      })),
    }

    const name = tableName().trim()

    if (['sql-insert', 'sql-update', 'create-table'].includes(format) && (!name || !/^\w+$/.test(name))) {
      setExportOutput('')
      return
    }

    if (format === 'sql-update' && keyColumns().length === 0) {
      setExportOutput('')
      return
    }

    try {
      let output = ''

      switch (format) {
        case 'sql-insert':
          output = generateSQLInsert(filteredData, name, namePattern())
          break
        case 'sql-update':
          output = generateSQLUpdate(filteredData, name, keyColumns(), namePattern())
          break
        case 'create-table':
          output = generateCreateTable(filteredData, name, namePattern())
          break
        case 'csv':
          output = exportToCSV(filteredData, namePattern(), store.hasHeaders)
          break
        case 'markdown':
          output = exportToMarkdown(filteredData, namePattern(), store.hasHeaders)
          break
        case 'json-array':
          output = exportToJSON(filteredData, namePattern(), store.hasHeaders)
          break
      }

      setExportOutput(output)
    } catch (error) {
      setExportOutput('')
      toast.error('Failed to export', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  createEffect(() => {
    if (exportFormat() !== 'excel') {
      generateExportOutput()
    }
  })

  const handleExcelExport = async () => {
    const visibleColumns = computed.visibleColumns()

    if (visibleColumns.length === 0) {
      toast.error('No visible columns to export')
      return
    }

    const filteredData: TableData = {
      columns: visibleColumns,
      rows: store.tableData.rows.map(row => ({
        ...row,
        cells: Object.fromEntries(
          visibleColumns.map(col => [col.id, row.cells[col.id]]),
        ),
      })),
    }

    const name = tableName().trim()

    try {
      const blob = await exportToExcel(filteredData, namePattern(), store.hasHeaders)
      downloadFile(blob, `${name || 'table'}.xlsx`)
      toast.success('Excel file downloaded')
    } catch (error) {
      toast.error('Failed to export Excel', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  const getExportFilename = () => {
    const name = tableName().trim() || 'table'
    const format = exportFormat()

    switch (format) {
      case 'sql-insert':
        return `${name}_insert.sql`
      case 'sql-update':
        return `${name}_update.sql`
      case 'create-table':
        return `${name}_create.sql`
      case 'csv':
        return `${name}.csv`
      case 'markdown':
        return `${name}.md`
      case 'json-array':
        return `${name}.json`
      default:
        return `${name}.txt`
    }
  }

  const getExportMimeType = () => {
    const format = exportFormat()
    switch (format) {
      case 'csv':
        return 'text/csv'
      case 'json-array':
        return 'application/json'
      case 'excel':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      default:
        return 'text/plain'
    }
  }

  return (
    <Dialog>
      <DialogTrigger as={Button}>
        <Icon name="lucide:download" class="mr-2 size-4" />
        Export
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export</DialogTitle>
          <DialogDescription>
            Configure export settings and generate output
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-6">
          <div class="gap-4 grid grid-cols-1 md:grid-cols-2">
            <TextField>
              <TextFieldLabel>Table Name</TextFieldLabel>
              <TextFieldInput
                value={tableName()}
                onInput={e => setTableName(e.currentTarget.value)}
                placeholder="my_table"
              />
            </TextField>

            <div class="flex flex-col gap-2">
              <label class="text-muted-foreground font-500">Export Format</label>
              <SimpleSelect
                value={exportFormat()}
                onChange={(value) => {
                  setExportFormat(value as ExportFormat)
                }}
                disallowEmptySelection
                options={exportOptions}
                placeholder="Select format"
              />
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-muted-foreground font-500">Column Naming Pattern</label>
            <Tabs
              value={namePattern()}
              onChange={(value) => {
                setNamePattern(value as NamePattern)
              }}
            >
              <TabsList>
                <For each={namePatternOptions}>
                  {option => <TabsTrigger value={option.value}>{option.label}</TabsTrigger>}
                </For>
                <TabsIndicator />
              </TabsList>
            </Tabs>
          </div>
        </div>

        <Show when={exportFormat() === 'sql-update'}>
          <label class="text-sm font-medium">Key Columns (for UPDATE)</label>
          <div class="p-2 border rounded-md bg-input flex flex-row flex-wrap gap-3 max-h-32 overflow-y-auto">
            <For each={computed.visibleColumns()}>
              {col => (
                <Checkbox
                  class="flex gap-2 items-center"
                  checked={keyColumns().includes(col.id)}
                  onChange={(checked) => {
                    if (checked) {
                      setKeyColumns([...keyColumns(), col.id])
                    } else {
                      setKeyColumns(keyColumns().filter(id => id !== col.id))
                    }
                  }}
                  text={col.name}
                />
              )}
            </For>
          </div>
        </Show>

        <div class="space-y-3">
          <div class="flex gap-2 items-center justify-between">
            <label class="text-sm font-medium">Output</label>
            <div class="flex gap-2">
              <Show when={exportFormat() !== 'excel'}>
                <CopyButton
                  content={exportOutput()}
                  size="sm"
                  variant="outline"
                />
              </Show>
              <DownloadButton
                content={exportOutput()}
                filename={getExportFilename()}
                mimeType={getExportMimeType()}
                size="sm"
                variant={exportFormat() === 'excel' ? 'default' : 'outline'}
                onClick={handleExcelExport}
              />
            </div>
          </div>
          <Show
            when={exportFormat() !== 'excel'}
          >
            <TextField class="flex-1">
              <TextFieldTextArea
                class="text-sm font-mono bg-muted/50 h-80 resize-none"
                readOnly
                value={exportOutput()}
              />
            </TextField>
          </Show>
        </div>

      </DialogContent>
    </Dialog>
  )
}
