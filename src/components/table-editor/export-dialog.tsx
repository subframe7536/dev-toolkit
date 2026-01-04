import type { TableData } from '#/utils/table/types'

import { CopyButton } from '#/components/copy-button'
import { DownloadButton } from '#/components/download-button'
import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '#/components/ui/dialog'
import Icon from '#/components/ui/icon'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { Switch } from '#/components/ui/switch'
import { TextField, TextFieldInput, TextFieldLabel, TextFieldTextArea } from '#/components/ui/text-field'
import { useTableEditorContext } from '#/contexts/table-editor-context'
import { downloadFile } from '#/utils/download'
import {
  exportToCSV,
  exportToExcel,
  exportToMarkdown,
  generateCreateTable,
  generateSQLInsert,
  generateSQLUpdate,
} from '#/utils/table/export'
import { createSignal, For, Show } from 'solid-js'
import { toast } from 'solid-sonner'

type ExportFormat = 'sql-insert' | 'sql-update' | 'create-table' | 'excel' | 'csv' | 'markdown'

const exportOptions: Array<{ value: ExportFormat, label: string }> = [
  { value: 'sql-insert', label: 'SQL INSERT' },
  { value: 'sql-update', label: 'SQL UPDATE' },
  { value: 'create-table', label: 'CREATE TABLE' },
  { value: 'excel', label: 'Excel (.xlsx)' },
  { value: 'csv', label: 'CSV' },
  { value: 'markdown', label: 'Markdown' },
]

export function ExportDialog() {
  const { store, computed } = useTableEditorContext()

  const [tableName, setTableName] = createSignal('my_table')
  const [useSnakeCase, setUseSnakeCase] = createSignal(true)
  const [exportFormat, setExportFormat] = createSignal<ExportFormat>('sql-insert')
  const [keyColumns, setKeyColumns] = createSignal<string[]>([])
  const [isExporting, setIsExporting] = createSignal(false)
  const [exportOutput, setExportOutput] = createSignal('')

  // Export handler
  const handleExport = async () => {
    // Filter visible columns and create filtered table data
    const visibleColumns = computed.visibleColumns()

    if (visibleColumns.length === 0) {
      toast.error('No visible columns to export')
      return
    }

    // Create filtered table data with only visible columns
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
    const format = exportFormat()

    // Validate table name for SQL exports
    if (['sql-insert', 'sql-update', 'create-table'].includes(format)) {
      if (!name) {
        toast.error('Please provide a table name')
        return
      }

      if (!/^\w+$/.test(name)) {
        toast.error('Invalid table name', {
          description: 'Table name must contain only alphanumeric characters and underscores',
        })
        return
      }
    }

    // Validate key columns for UPDATE
    if (format === 'sql-update' && keyColumns().length === 0) {
      toast.error('Please select at least one key column for UPDATE statements')
      return
    }

    try {
      setIsExporting(true)
      let output = ''

      switch (format) {
        case 'sql-insert':
          output = generateSQLInsert(filteredData, name, useSnakeCase())
          break
        case 'sql-update':
          output = generateSQLUpdate(filteredData, name, keyColumns(), useSnakeCase())
          break
        case 'create-table':
          output = generateCreateTable(filteredData, name, useSnakeCase())
          break
        case 'excel': {
          const blob = await exportToExcel(filteredData, useSnakeCase(), store.hasHeaders)
          downloadFile(blob, `${name || 'table'}.xlsx`)
          toast.success('Excel file downloaded')
          return
        }
        case 'csv':
          output = exportToCSV(filteredData, useSnakeCase(), store.hasHeaders)
          break
        case 'markdown':
          output = exportToMarkdown(filteredData, useSnakeCase(), store.hasHeaders)
          break
      }

      setExportOutput(output)
    } catch (error) {
      toast.error('Failed to export', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsExporting(false)
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
      default:
        return `${name}.txt`
    }
  }

  const getExportMimeType = () => {
    const format = exportFormat()
    switch (format) {
      case 'csv':
        return 'text/csv'
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
          <DialogTitle>Export Options</DialogTitle>
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
              <Select
                value={exportFormat()}
                onChange={setExportFormat}
                options={exportOptions.map(o => o.value)}
                disallowEmptySelection
                itemComponent={p => (
                  <SelectItem item={p.item}>
                    {exportOptions.find(o => o.value === p.item.rawValue)?.label}
                  </SelectItem>
                )}
              >
                <SelectTrigger>
                  <SelectValue<ExportFormat>>
                    {state => exportOptions.find(o => o.value === state.selectedOption())?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent />
              </Select>
            </div>
          </div>

          <div class="flex items-center">
            <Switch
              text="Use snake_case"
              checked={useSnakeCase()}
              onChange={setUseSnakeCase}
            />
          </div>

          <Show when={exportFormat() === 'sql-update'}>
            <label class="text-sm font-medium">Key Columns (for UPDATE)</label>
            <div class="p-2 border rounded-md bg-input flex flex-row flex-wrap gap-3">
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

          <Button
            onClick={handleExport}
            disabled={isExporting()}
            class="w-full"
          >
            <Show
              when={!isExporting()}
              fallback={(
                <>
                  <Icon name="lucide:loader-2" class="mr-2 size-4 animate-spin" />
                  Generating...
                </>
              )}
            >
              <Icon name="lucide:sparkles" class="mr-2 size-4" />
              Generate Export
            </Show>
          </Button>

          <Show when={exportOutput()}>
            <div class="space-y-3">
              <div class="flex gap-2 items-center justify-between">
                <label class="text-sm font-medium">Output</label>
                <div class="flex gap-2">
                  <CopyButton
                    content={exportOutput()}
                    size="sm"
                    variant="outline"
                  />
                  <DownloadButton
                    content={exportOutput()}
                    filename={getExportFilename()}
                    mimeType={getExportMimeType()}
                    size="sm"
                    variant="outline"
                  />
                </div>
              </div>
              <TextField class="flex-1">
                <TextFieldTextArea
                  class="text-sm font-mono bg-muted/50 h-80 resize-none"
                  readOnly
                  value={exportOutput()}
                />
              </TextField>
            </div>
          </Show>
        </div>
      </DialogContent>
    </Dialog>
  )
}
