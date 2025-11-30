import type { TableData } from '#/utils/table/types'
import type { Component } from 'solid-js'

import { Button } from '#/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '#/components/ui/dialog'
import Icon from '#/components/ui/icon'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { Switch } from '#/components/ui/switch'
import { TextField, TextFieldInput, TextFieldLabel, TextFieldTextArea } from '#/components/ui/text-field'
import { copyToClipboard, downloadFile } from '#/utils/download'
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

interface ExportDialogProps {
  tableData: TableData
}

export const ExportDialog: Component<ExportDialogProps> = (props) => {
  // Local state for export functionality
  const [tableName, setTableName] = createSignal('my_table')
  const [useSnakeCase, setUseSnakeCase] = createSignal(false)
  const [exportFormat, setExportFormat] = createSignal<ExportFormat>('sql-insert')
  const [keyColumns, setKeyColumns] = createSignal<string[]>([])
  const [isExporting, setIsExporting] = createSignal(false)
  const [exportOutput, setExportOutput] = createSignal('')

  // Export handler
  const handleExport = async () => {
    if (props.tableData.columns.length === 0) {
      toast.error('No data to export')
      return
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
          output = generateSQLInsert(props.tableData, name, useSnakeCase())
          break
        case 'sql-update':
          output = generateSQLUpdate(props.tableData, name, keyColumns(), useSnakeCase())
          break
        case 'create-table':
          output = generateCreateTable(props.tableData, name, useSnakeCase())
          break
        case 'excel': {
          const blob = await exportToExcel(props.tableData, useSnakeCase())
          downloadFile({
            content: blob,
            filename: `${name || 'table'}.xlsx`,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          })
          toast.success('Excel file downloaded')
          return
        }
        case 'csv':
          output = exportToCSV(props.tableData, useSnakeCase())
          break
        case 'markdown':
          output = exportToMarkdown(props.tableData, useSnakeCase())
          break
      }

      setExportOutput(output)
      toast.success('Export generated successfully')
    } catch (error) {
      toast.error('Failed to export', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleCopyExport = async () => {
    await copyToClipboard(exportOutput())
  }

  const handleDownloadExport = () => {
    const name = tableName().trim() || 'table'
    const format = exportFormat()
    let filename = name
    let mimeType = 'text/plain'

    switch (format) {
      case 'sql-insert':
        filename = `${name}_insert.sql`
        break
      case 'sql-update':
        filename = `${name}_update.sql`
        break
      case 'create-table':
        filename = `${name}_create.sql`
        break
      case 'csv':
        filename = `${name}.csv`
        mimeType = 'text/csv'
        break
      case 'markdown':
        filename = `${name}.md`
        break
    }

    downloadFile({
      content: exportOutput(),
      filename,
      mimeType,
    })
    toast.success('File downloaded')
  }

  return (
    <Dialog>
      <DialogTrigger as={Button}>
        <Icon name="lucide:download" class="mr-2 size-4" />
        Export
      </DialogTrigger>
      <DialogContent class="max-h-[80vh] max-w-4xl">
        <DialogHeader>
          <DialogTitle>Export Options</DialogTitle>
          <DialogDescription>
            Configure export settings and generate output
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
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
              <label class="text-sm font-medium">Export Format</label>
              <Select
                value={exportFormat()}
                onChange={setExportFormat}
                options={exportOptions.map(o => o.value)}
                placeholder="Select format..."
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
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium">Key Columns (for UPDATE)</label>
              <div class="p-2 border border-border rounded-md bg-input max-h-32 overflow-y-auto">
                <For each={props.tableData.columns}>
                  {col => (
                    <label class="px-1 py-1 rounded flex gap-2 cursor-pointer items-center hover:bg-accent">
                      <input
                        type="checkbox"
                        checked={keyColumns().includes(col.id)}
                        onChange={(e) => {
                          if (e.currentTarget.checked) {
                            setKeyColumns([...keyColumns(), col.id])
                          } else {
                            setKeyColumns(keyColumns().filter(id => id !== col.id))
                          }
                        }}
                        class="size-4"
                      />
                      <span class="text-sm">{col.name}</span>
                    </label>
                  )}
                </For>
              </div>
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
                  <Button size="sm" variant="outline" onClick={handleCopyExport}>
                    <Icon name="lucide:copy" class="mr-2 size-4" />
                    Copy
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleDownloadExport}>
                    <Icon name="lucide:download" class="mr-2 size-4" />
                    Download
                  </Button>
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
