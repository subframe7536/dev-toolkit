import { Field, Button, Checkbox, Dialog, Input, Select, Textarea } from 'moraine'
import { createEffect, createSignal, For, Show } from 'solid-js'
import { toast } from 'solid-toaster'

import { CopyButton } from '#/components/copy-button'
import { DownloadButton } from '#/components/download-button'
import { ToolOptions } from '#/components/tool-options'
import { useTableEditorContext } from '#/contexts'
import { downloadFile } from '#/utils/download'
import {
  exportToCSV,
  exportToExcel,
  exportToJSON,
  exportToMarkdown,
  generateCreateTable,
  generateSQLInsert,
  generateSQLUpdate,
} from '#/utils/table/export'
import type { TableData } from '#/utils/table/types'

type ExportFormat =
  | 'sql-insert'
  | 'sql-update'
  | 'create-table'
  | 'excel'
  | 'csv'
  | 'markdown'
  | 'json-array'
type NamePattern = 'snake_case' | 'camelCase' | 'original'

const exportOptions: Array<{ value: ExportFormat; label: string }> = [
  { value: 'sql-insert', label: 'SQL INSERT' },
  { value: 'sql-update', label: 'SQL UPDATE' },
  { value: 'create-table', label: 'CREATE TABLE' },
  { value: 'excel', label: 'Excel (.xlsx)' },
  { value: 'csv', label: 'CSV' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'json-array', label: 'JSON Array' },
]

const namePatternOptions: Array<{ value: NamePattern; label: string }> = [
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
      rows: store.tableData.rows.map((row) => ({
        ...row,
        cells: Object.fromEntries(visibleColumns.map((col) => [col.id, row.cells[col.id]])),
      })),
    }

    const name = tableName().trim()

    if (
      ['sql-insert', 'sql-update', 'create-table'].includes(format) &&
      (!name || !/^\w+$/.test(name))
    ) {
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
      rows: store.tableData.rows.map((row) => ({
        ...row,
        cells: Object.fromEntries(visibleColumns.map((col) => [col.id, row.cells[col.id]])),
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
    <Dialog classes={{ content: 'max-h-[calc(100dvh-2rem)] overflow-y-auto' }}>
      <Dialog.Trigger as={Button} leading="i-lucide-download">
        Export
      </Dialog.Trigger>
      <Dialog.Content title="Export" description="Configure export settings and generate output">
        <Dialog.Body>
          <div class="space-y-6">
            <ToolOptions>
              <div class="gap-4 grid grid-cols-1 md:grid-cols-2">
                <Field
                  label="Table Name"
                  classes={{ root: 'min-w-0', label: 'text-muted-foreground font-medium text-xs' }}
                >
                  <Input value={tableName()} onValueChange={setTableName} placeholder="my_table" />
                </Field>

                <Field
                  label="Export Format"
                  classes={{ root: 'min-w-0', label: 'text-muted-foreground font-medium text-xs' }}
                >
                  <Select
                    value={exportFormat()}
                    onValueChange={(value) => {
                      if (value !== null) {
                        setExportFormat(value)
                      }
                    }}
                    items={exportOptions.map((o) => ({ value: o.value, label: o.label }))}
                  />
                </Field>
              </div>

              <Field
                label="Column Naming Pattern"
                classes={{ root: 'min-w-0', label: 'text-muted-foreground font-medium text-xs' }}
              >
                <Select
                  value={namePattern()}
                  onValueChange={(value) => value && setNamePattern(value)}
                  items={namePatternOptions.map((o) => ({ value: o.value, label: o.label }))}
                />
              </Field>

              <Show when={exportFormat() === 'sql-update'}>
                <div class="space-y-2">
                  <h3 class="font-medium text-sm">Key Columns (for UPDATE)</h3>
                  <div class="p-2 border bg-input flex flex-wrap gap-3 max-h-32 overflow-y-auto rounded-md">
                    <For each={computed.visibleColumns()}>
                      {(col) => (
                        <Field
                          label={col.name}
                          classes={{
                            root: 'flex flex-row-reverse gap-2 items-center',
                            label: 'font-normal',
                            container: 'mt-0!',
                          }}
                        >
                          <Checkbox
                            checked={keyColumns().includes(col.id)}
                            onCheckedChange={(checked) => {
                              setKeyColumns(
                                checked
                                  ? [...keyColumns(), col.id]
                                  : keyColumns().filter((id) => id !== col.id),
                              )
                            }}
                          />
                        </Field>
                      )}
                    </For>
                  </div>
                </div>
              </Show>
            </ToolOptions>{' '}
            <Field
              label="Output"
              classes={{
                root: 'min-w-0',
                label: 'text-muted-foreground font-medium text-xs',
                labelWrapper: 'tool-panel-heading',
              }}
              hint={
                <span class="tool-actions">
                  <Show when={exportFormat() !== 'excel'}>
                    <CopyButton
                      text="Copy Output"
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
                    onClick={exportFormat() === 'excel' ? handleExcelExport : undefined}
                  />
                </span>
              }
            >
              <Show when={exportFormat() !== 'excel'}>
                <Textarea
                  classes={{ root: ['flex-1', 'text-sm font-mono resize-none h-80'] }}
                  readOnly
                  value={exportOutput()}
                />
              </Show>
            </Field>
          </div>
        </Dialog.Body>
      </Dialog.Content>
    </Dialog>
  )
}
