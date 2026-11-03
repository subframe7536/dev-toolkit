import { Field, Button, Icon, Select, Switch, Tabs, Textarea, Toast } from 'moraine'
import { createSignal, Show } from 'solid-js'

import { FileUpload } from '#/components/file-upload'
import { ToolOptions } from '#/components/tool-options'
import { useTableEditorContext } from '#/contexts/table-editor-context'
import {
  DEFAULT_DATE_FORMAT,
  detectTSVFormat,
  getExcelSheetNames,
  parseCSVFile,
  parseCSVText,
  parseExcelFile,
  parseMySQLOutput,
  parseTSVText,
} from '#/utils/table/parser'

import { ClearButton } from '../clear-button'

const MYSQL_EXAMPLE = `+----+----------+-------+
| id | name     | age   |
+----+----------+-------+
|  1 | Alice    |    30 |
|  2 | Bob      |    25 |
+----+----------+-------+`

const CSV_EXAMPLE = `id,name,age
1,Alice,30
2,Bob,25`

const EXCEL_EXAMPLE = 'id\tname\tage\n1\tAlice\t30\n2\tBob\t25'

const DATE_FORMAT_ITEMS = [
  DEFAULT_DATE_FORMAT,
  'YYYY-MM-DD',
  'MM/DD/YYYY',
  'DD/MM/YYYY',
  'YYYY/MM/DD',
].map((format) => ({ value: format, label: format }))

const PLACEHOLDER = `Example (MySQL Cli Output):

${MYSQL_EXAMPLE}

Example (CSV):

${CSV_EXAMPLE}

Example (Excel Copy/Paste):

${EXCEL_EXAMPLE}`

export function InputSection() {
  const { actions } = useTableEditorContext()
  // Local state for input management
  const [textInput, setTextInput] = createSignal('')
  const [replaceLineWrap, setReplaceLineWrap] = createSignal(true)
  const [uploadedFile, setUploadedFile] = createSignal<File | undefined>(undefined)
  const [sheetNames, setSheetNames] = createSignal<string[]>([])
  const [selectedSheet, setSelectedSheet] = createSignal<string>('')
  const [dateFormat, setDateFormat] = createSignal(DEFAULT_DATE_FORMAT)
  const [isParsing, setIsParsing] = createSignal(false)

  // Auto-detect file type based on extension or mime type
  const detectFileType = (file: File): 'excel' | 'csv' => {
    const name = file.name.toLowerCase()
    const mime = file.type.toLowerCase()

    if (
      name.endsWith('.xlsx') ||
      name.endsWith('.xls') ||
      mime.includes('spreadsheet') ||
      mime.includes('excel')
    ) {
      return 'excel'
    }
    return 'csv'
  }

  const isExcelFile = () => {
    const file = uploadedFile()
    return file !== undefined && detectFileType(file) === 'excel'
  }

  const handleReplaceLineWrap = (replace: boolean) => {
    setReplaceLineWrap(replace)
    setTextInput((t) => (replace ? t.replace(/(?:\\r)?\\n/g, '\n') : t.replace(/\r?\n/g, '\\n')))
  }

  // Handle text input parsing (auto-detects MySQL vs CSV vs TSV)
  const handleParseText = () => {
    const input = textInput().trim()
    if (!input) {
      Toast.error({ title: 'Please paste text input.' })
      return
    }

    // Auto-detect format based on content
    if (input.trim().startsWith('+-')) {
      // MySQL CLI output format
      const result = parseMySQLOutput(input)
      if (result.success && result.data) {
        actions.setData(result.data)
        Toast.success({ title: 'MySQL output parsed successfully!' })
      } else if (result.error) {
        Toast.error({ title: result.error.message, description: result.error.details })
      }
    } else if (detectTSVFormat(input)) {
      // Tab-separated values (Excel copy/paste)
      const result = parseTSVText(input)
      if (result.success && result.data) {
        actions.setData(result.data)
        Toast.success({ title: 'Excel table data parsed successfully!' })
      } else if (result.error) {
        Toast.error({ title: result.error.message, description: result.error.details })
      }
    } else {
      // Default to CSV format
      const result = parseCSVText(input)
      if (result.success && result.data) {
        actions.setData(result.data)
        Toast.success({ title: 'CSV text parsed successfully!' })
      } else if (result.error) {
        Toast.error({ title: result.error.message, description: result.error.details })
      }
    }
  }

  // Handle file selection (auto-detects Excel vs CSV)
  const handleFileSelect = async (file: File | undefined) => {
    setUploadedFile(file)
    if (!file) {
      setSheetNames([])
      setSelectedSheet('')
      return
    }

    const fileType = detectFileType(file)

    if (fileType === 'excel') {
      try {
        const names = await getExcelSheetNames(file)
        setSheetNames(names)
        if (names.length > 0) {
          setSelectedSheet(names[0])
        }
      } catch (error) {
        Toast.error({
          title: 'Failed to read Excel file',
          description: error instanceof Error ? error.message : 'Unknown error',
        })
        setUploadedFile(undefined)
        setSheetNames([])
        setSelectedSheet('')
      }
    } else {
      setSheetNames([])
      setSelectedSheet('')
    }
  }

  // Handle file parsing (auto-detects Excel vs CSV)
  const handleParseFile = async () => {
    const file = uploadedFile()
    if (!file) {
      Toast.error({ title: 'Please upload a file.' })
      return
    }

    setIsParsing(true)
    try {
      const fileType = detectFileType(file)

      if (fileType === 'excel') {
        const sheetIndex = sheetNames().indexOf(selectedSheet())
        const result = await parseExcelFile(
          file,
          sheetIndex >= 0 ? sheetIndex : 0,
          true,
          dateFormat(),
        )

        if (result.success && result.data) {
          actions.setData(result.data)
          Toast.success({ title: 'Excel file parsed successfully!' })
        } else if (result.error) {
          Toast.error({ title: result.error.message, description: result.error.details })
        }
      } else {
        const result = await parseCSVFile(file)

        if (result.success && result.data) {
          actions.setData(result.data)
          Toast.success({ title: 'CSV file parsed successfully!' })
        } else if (result.error) {
          Toast.error({ title: result.error.message, description: result.error.details })
        }
      }
    } catch (error) {
      Toast.error({
        title: 'Failed to parse file',
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsParsing(false)
    }
  }

  // Get file upload description
  const getFileDescription = () => {
    const file = uploadedFile()
    if (!file) {
      return 'Upload an Excel file (.xlsx, .xls) or CSV file (.csv)'
    }
    return detectFileType(file) === 'excel'
      ? 'Excel file detected (.xlsx or .xls)'
      : 'CSV file detected (.csv)'
  }

  return (
    <div class="space-y-4">
      <Tabs
        defaultValue="text"
        items={[
          {
            value: 'text',
            label: 'Text Input',
            content: (
              <div class="mt-4 flex flex-col gap-3">
                <div class="flex flex-wrap gap-3 items-start justify-between">
                  <p class="text-sm text-muted-foreground">
                    Paste MySQL CLI output (starts with +-), CSV text, or Excel table data here.
                  </p>
                </div>
                <Field hiddenLabel="Table input" classes={{ root: 'min-w-0' }}>
                  <Textarea
                    classes={{
                      root: 'tool-editor whitespace-nowrap overflow-x-auto placeholder:whitespace-pre-wrap',
                    }}
                    placeholder={PLACEHOLDER}
                    value={textInput()}
                    onValueChange={setTextInput}
                  />
                </Field>
                <div class="tool-toolbar">
                  <Button
                    onClick={handleParseText}
                    disabled={!textInput().trim()}
                    classes={{ root: 'min-w-24' }}
                    leading="i-lucide-play"
                  >
                    Parse
                  </Button>
                  <ClearButton onClear={() => setTextInput('')} disabled={!textInput().trim()} />
                </div>
                <ToolOptions>
                  <div class="tool-toolbar">
                    <Button
                      variant="solid"
                      tone="secondary"
                      onClick={() => {
                        setTextInput(MYSQL_EXAMPLE)
                        setReplaceLineWrap(true)
                      }}
                      leading="i-lucide-database"
                    >
                      MySQL Example
                    </Button>
                    <Button
                      variant="solid"
                      tone="secondary"
                      onClick={() => {
                        setTextInput(CSV_EXAMPLE)
                        setReplaceLineWrap(true)
                      }}
                      leading="i-lucide-table"
                    >
                      CSV Example
                    </Button>
                    <Button
                      variant="solid"
                      tone="secondary"
                      onClick={() => {
                        setTextInput(EXCEL_EXAMPLE)
                        setReplaceLineWrap(true)
                      }}
                      leading="i-lucide-file-spreadsheet"
                    >
                      Excel Example
                    </Button>
                  </div>
                  <Switch
                    label="Replace \n"
                    classes={{ root: 'whitespace-nowrap' }}
                    checked={replaceLineWrap()}
                    onCheckedChange={handleReplaceLineWrap}
                  />
                </ToolOptions>
              </div>
            ),
          },
          {
            value: 'file',
            label: 'File Upload',
            content: (
              <div class="mt-4 flex flex-col gap-3">
                <p class="text-sm text-muted-foreground">{getFileDescription()}</p>
                <FileUpload
                  file={uploadedFile()}
                  setFile={handleFileSelect}
                  accept={['.xlsx', '.xls', '.csv']}
                  icon="i-lucide-file-spreadsheet"
                />

                <div class="flex gap-2 items-center">
                  <Button
                    onClick={handleParseFile}
                    disabled={!uploadedFile() || isParsing()}
                    classes={{ root: 'flex-1' }}
                    leading={
                      isParsing() ? (
                        <Icon name="i-lucide-loader" class="animate-spin" />
                      ) : (
                        'i-lucide-play'
                      )
                    }
                  >
                    {isParsing() ? 'Parsing...' : 'Parse'}
                  </Button>
                  <ClearButton
                    onClear={() => handleFileSelect(undefined)}
                    disabled={!uploadedFile()}
                  />
                </div>
                <Show when={isExcelFile()}>
                  <ToolOptions>
                    <Show when={sheetNames().length > 1}>
                      <Field
                        label="Select Sheet"
                        classes={{
                          root: 'min-w-0',
                          label: 'text-muted-foreground font-medium text-xs',
                        }}
                      >
                        <Select
                          value={selectedSheet()}
                          onValueChange={(value) => {
                            if (value !== undefined) {
                              setSelectedSheet(value)
                            }
                          }}
                          items={sheetNames().map((s) => ({ value: s, label: s }))}
                        />
                      </Field>
                    </Show>
                    <Field
                      label="Date Format"
                      classes={{
                        root: 'min-w-0',
                        label: 'text-muted-foreground font-medium text-xs',
                      }}
                    >
                      <Select
                        value={dateFormat()}
                        onValueChange={(value) => {
                          if (value !== undefined) {
                            setDateFormat(value)
                          }
                        }}
                        items={DATE_FORMAT_ITEMS}
                      />
                    </Field>
                  </ToolOptions>
                </Show>
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}
