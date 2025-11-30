import type { TableData } from '#/utils/table/types'
import type { Component } from 'solid-js'

import { FileUpload } from '#/components/file-upload'
import { Button } from '#/components/ui/button'
import Icon from '#/components/ui/icon'
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { TextField, TextFieldTextArea } from '#/components/ui/text-field'
import { getExcelSheetNames, parseExcelFile, parseMySQLOutput } from '#/utils/table/parser'
import { createSignal, For, Show } from 'solid-js'
import { toast } from 'solid-sonner'

const PLACEHOLDER = `+----+----------+-------+
| id | name     | age   |
+----+----------+-------+
|  1 | Alice    |    30 |
|  2 | Bob      |    25 |
+----+----------+-------+`

interface InputSectionProps {
  onDataParsed: (data: TableData) => void
}

export const InputSection: Component<InputSectionProps> = (props) => {
  // Local state for input management
  const [mysqlInput, setMysqlInput] = createSignal('')
  const [excelFile, setExcelFile] = createSignal<File | undefined>(undefined)
  const [sheetNames, setSheetNames] = createSignal<string[]>([])
  const [selectedSheet, setSelectedSheet] = createSignal<string>('')
  const [isParsingExcel, setIsParsingExcel] = createSignal(false)

  // Handle MySQL output parsing
  const handleParseMySQLOutput = () => {
    const input = mysqlInput().trim()
    if (!input) {
      toast.error('Please paste MySQL output text.')
      return
    }

    const result = parseMySQLOutput(input)
    if (result.success && result.data) {
      props.onDataParsed(result.data)
      toast.success('MySQL output parsed successfully!')
    } else if (result.error) {
      toast.error(result.error.message, {
        description: result.error.details,
      })
    }
  }

  // Handle Excel file selection
  const handleExcelFileSelect = async (file: File | undefined) => {
    setExcelFile(file)
    if (!file) {
      setSheetNames([])
      setSelectedSheet('')
      return
    }

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
      setExcelFile(undefined)
      setSheetNames([])
      setSelectedSheet('')
    }
  }

  // Handle Excel file parsing
  const handleParseExcelFile = async () => {
    const file = excelFile()
    if (!file) {
      toast.error('Please upload an Excel file.')
      return
    }

    setIsParsingExcel(true)
    try {
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
    } catch (error) {
      toast.error('Failed to parse Excel file', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsParsingExcel(false)
    }
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
              Paste MySQL CLI output here
            </p>
            <TextField>
              <TextFieldTextArea
                class="text-sm font-mono h-100 resize-none"
                placeholder={PLACEHOLDER}
                value={mysqlInput()}
                onInput={e => setMysqlInput(e.currentTarget.value)}
              />
            </TextField>
            <div class="flex gap-2">
              <Button onClick={handleParseMySQLOutput} disabled={!mysqlInput().trim()} class="flex-1">
                <Icon name="lucide:play" class="mr-2 size-4" />
                Parse
              </Button>
              <Button
                variant="outline"
                onClick={() => setMysqlInput('')}
                disabled={!mysqlInput().trim()}
              >
                <Icon name="lucide:x" class="mr-2 size-4" />
                Clear
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="file">
          <div class="mt-4 flex flex-col gap-3">
            <p class="text-sm text-muted-foreground">
              Upload an Excel file (.xlsx or .xls)
            </p>
            <FileUpload
              file={excelFile()}
              setFile={handleExcelFileSelect}
              accept={['.xlsx', '.xls']}
              icon="lucide:file-spreadsheet"
            />

            <Show when={sheetNames().length > 1}>
              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium">Select Sheet</label>
                <select
                  class="text-sm px-3 border border-border rounded-md bg-input flex h-8 w-full ring-offset-background items-center focus:effect-fv disabled:effect-dis"
                  value={selectedSheet()}
                  onChange={e => setSelectedSheet(e.currentTarget.value)}
                >
                  <For each={sheetNames()}>
                    {sheet => <option value={sheet}>{sheet}</option>}
                  </For>
                </select>
              </div>
            </Show>

            <div class="flex gap-2">
              <Button
                onClick={handleParseExcelFile}
                disabled={!excelFile() || isParsingExcel()}
                class="flex-1"
              >
                <Show
                  when={!isParsingExcel()}
                  fallback={(
                    <>
                      <Icon name="lucide:loader-2" class="mr-2 size-4 animate-spin" />
                      Parsing...
                    </>
                  )}
                >
                  <Icon name="lucide:play" class="mr-2 size-4" />
                  Parse
                </Show>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExcelFileSelect(undefined)}
                disabled={!excelFile()}
              >
                <Icon name="lucide:x" class="mr-2 size-4" />
                Clear
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
