import type { TableData } from '#/utils/table/types'
import type { Component } from 'solid-js'

import { FileUpload } from '#/components/file-upload'
import { Button } from '#/components/ui/button'
import Icon from '#/components/ui/icon'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { TextField, TextFieldTextArea } from '#/components/ui/text-field'
import { detectTSVFormat, getExcelSheetNames, parseCSVFile, parseCSVText, parseExcelFile, parseMySQLOutput, parseTSVText } from '#/utils/table/parser'
import { createSignal, Show } from 'solid-js'
import { toast } from 'solid-sonner'

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

const PLACEHOLDER = `Example (MySQL Cli Output):

${MYSQL_EXAMPLE}

Example (CSV):

${CSV_EXAMPLE}

Example (Excel Copy/Paste):

${EXCEL_EXAMPLE}`

interface InputSectionProps {
  onDataParsed: (data: TableData) => void
}

export const InputSection: Component<InputSectionProps> = (props) => {
  // Local state for input management
  const [textInput, setTextInput] = createSignal('')
  const [uploadedFile, setUploadedFile] = createSignal<File | undefined>(undefined)
  const [sheetNames, setSheetNames] = createSignal<string[]>([])
  const [selectedSheet, setSelectedSheet] = createSignal<string>('')
  const [isParsing, setIsParsing] = createSignal(false)

  // Auto-detect file type based on extension or mime type
  const detectFileType = (file: File): 'excel' | 'csv' => {
    const name = file.name.toLowerCase()
    const mime = file.type.toLowerCase()

    if (name.endsWith('.xlsx') || name.endsWith('.xls')
      || mime.includes('spreadsheet') || mime.includes('excel')) {
      return 'excel'
    }
    return 'csv'
  }

  // Handle text input parsing (auto-detects MySQL vs CSV vs TSV)
  const handleParseText = () => {
    const input = textInput().trim()
    if (!input) {
      toast.error('Please paste text input.')
      return
    }

    // Auto-detect format based on content
    if (input.trim().startsWith('+-')) {
      // MySQL CLI output format
      const result = parseMySQLOutput(input)
      if (result.success && result.data) {
        props.onDataParsed(result.data)
        toast.success('MySQL output parsed successfully!')
      } else if (result.error) {
        toast.error(result.error.message, {
          description: result.error.details,
        })
      }
    } else if (detectTSVFormat(input)) {
      // Tab-separated values (Excel copy/paste)
      const result = parseTSVText(input, true)
      if (result.success && result.data) {
        props.onDataParsed(result.data)
        toast.success('Excel table data parsed successfully!')
      } else if (result.error) {
        toast.error(result.error.message, {
          description: result.error.details,
        })
      }
    } else {
      // Default to CSV format
      const result = parseCSVText(input, true)
      if (result.success && result.data) {
        props.onDataParsed(result.data)
        toast.success('CSV text parsed successfully!')
      } else if (result.error) {
        toast.error(result.error.message, {
          description: result.error.details,
        })
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
        toast.error('Failed to read Excel file', {
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
      toast.error('Please upload a file.')
      return
    }

    setIsParsing(true)
    try {
      const fileType = detectFileType(file)

      if (fileType === 'excel') {
        const sheetIndex = sheetNames().indexOf(selectedSheet())
        const result = await parseExcelFile(file, sheetIndex >= 0 ? sheetIndex : 0)

        if (result.success && result.data) {
          props.onDataParsed(result.data)
          toast.success('Excel file parsed successfully!')
        } else if (result.error) {
          toast.error(result.error.message, {
            description: result.error.details,
          })
        }
      } else {
        const result = await parseCSVFile(file, true)

        if (result.success && result.data) {
          props.onDataParsed(result.data)
          toast.success('CSV file parsed successfully!')
        } else if (result.error) {
          toast.error(result.error.message, {
            description: result.error.details,
          })
        }
      }
    } catch (error) {
      toast.error('Failed to parse file', {
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
      <Tabs>
        <TabsList class="grid grid-cols-2 w-full">
          <TabsTrigger value="text">Text Input</TabsTrigger>
          <TabsTrigger value="file">File Upload</TabsTrigger>
          <TabsIndicator />
        </TabsList>

        <TabsContent value="text">
          <div class="mt-4 flex flex-col gap-3">
            <p class="text-sm text-muted-foreground">
              Paste MySQL CLI output (starts with +-), CSV text, or Excel table data here. Format will be auto-detected.
            </p>
            <TextField>
              <TextFieldTextArea
                class="text-sm font-mono h-100 resize-none"
                placeholder={PLACEHOLDER}
                value={textInput()}
                onInput={e => setTextInput(e.currentTarget.value)}
              />
            </TextField>
            <div class="flex gap-2">
              <Button
                onClick={handleParseText}
                disabled={!textInput().trim()}
                class="flex-1"
              >
                <Icon name="lucide:play" class="mr-2" />
                Parse
              </Button>
              <Button
                variant="secondary"
                onClick={() => setTextInput(MYSQL_EXAMPLE)}
              >
                <Icon name="lucide:database" class="mr-2" />
                MySQL Example
              </Button>
              <Button
                variant="secondary"
                onClick={() => setTextInput(CSV_EXAMPLE)}
              >
                <Icon name="lucide:table" class="mr-2" />
                CSV Example
              </Button>
              <Button
                variant="secondary"
                onClick={() => setTextInput(EXCEL_EXAMPLE)}
              >
                <Icon name="lucide:file-spreadsheet" class="mr-2" />
                Excel Example
              </Button>
              <ClearButton
                onClear={() => setTextInput('')}
                disabled={!textInput().trim()}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="file">
          <div class="mt-4 flex flex-col gap-3">
            <p class="text-sm text-muted-foreground">
              {getFileDescription()}
            </p>
            <FileUpload
              file={uploadedFile()}
              setFile={handleFileSelect}
              accept={['.xlsx', '.xls', '.csv']}
              icon="lucide:file-spreadsheet"
            />

            <Show when={sheetNames().length > 1}>
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium">Select Sheet</label>
                <Select<string>
                  value={selectedSheet()}
                  onChange={setSelectedSheet}
                  options={sheetNames()}
                  placeholder="Select a sheet"
                  itemComponent={props => <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>}
                >
                  <SelectTrigger>
                    <SelectValue<string>>{state => state.selectedOption()}</SelectValue>
                  </SelectTrigger>
                  <SelectContent />
                </Select>
              </div>
            </Show>

            <div class="flex gap-2">
              <Button
                onClick={handleParseFile}
                disabled={!uploadedFile() || isParsing()}
                class="flex-1"
              >
                <Show
                  when={!isParsing()}
                  fallback={(
                    <>
                      <Icon name="lucide:loader" class="mr-2 animate-spin" />
                      Parsing...
                    </>
                  )}
                >
                  <Icon name="lucide:play" class="mr-2" />
                  Parse
                </Show>
              </Button>
              <ClearButton
                onClear={() => handleFileSelect(undefined)}
                disabled={!uploadedFile()}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
