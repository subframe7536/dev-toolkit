import type { ConversionResult } from '#/utils/json/converter'

import { Button } from '#/components/ui/button'
import {
  Combobox,
  ComboboxContent,
  ComboboxControl,
  ComboboxInput,
  ComboboxItem,
  ComboboxTrigger,
} from '#/components/ui/combobox'
import {
  TextField,
  TextFieldLabel,
  TextFieldTextArea,
} from '#/components/ui/text-field'
import {
  csvToJSON,
  detectFormat,
  jsonToCSV,
  jsonToQueryParams,
  jsonToYAML,
  queryParamsToJSON,
  yamlToJSON,
} from '#/utils/json/converter'
import { createRoute } from 'solid-file-router'
import { createSignal } from 'solid-js'
import { toast } from 'solid-sonner'

export default createRoute({
  info: {
    title: 'JSON Converter',
    description: 'Convert JSON to/from CSV, YAML, and query parameters',
    category: 'JSON',
    icon: 'lucide:repeat',
    tags: ['json', 'csv', 'yaml', 'converter', 'transform'],
  },
  component: JSONConverter,
})

type ConversionMode = | 'json-to-csv'
  | 'csv-to-json'
  | 'json-to-yaml'
  | 'yaml-to-json'
  | 'json-to-query'
  | 'query-to-json'

function JSONConverter() {
  const [input, setInput] = createSignal('')
  const [output, setOutput] = createSignal('')
  const [mode, setMode] = createSignal<ConversionMode>('json-to-csv')

  const conversionModes = [
    { value: 'json-to-csv', label: 'JSON → CSV' },
    { value: 'csv-to-json', label: 'CSV → JSON' },
    { value: 'json-to-yaml', label: 'JSON → YAML' },
    { value: 'yaml-to-json', label: 'YAML → JSON' },
    { value: 'json-to-query', label: 'JSON → Query Params' },
    { value: 'query-to-json', label: 'Query Params → JSON' },
  ] as const

  const handleConvert = () => {
    if (!input().trim()) {
      toast.error('Please provide input to convert')
      return
    }

    let result: ConversionResult

    switch (mode()) {
      case 'json-to-csv':
        result = jsonToCSV(input())
        break
      case 'csv-to-json':
        result = csvToJSON(input())
        break
      case 'json-to-yaml':
        result = jsonToYAML(input())
        break
      case 'yaml-to-json':
        result = yamlToJSON(input())
        break
      case 'json-to-query':
        result = jsonToQueryParams(input())
        break
      case 'query-to-json':
        result = queryParamsToJSON(input())
        break
      default:
        result = { success: false, error: { message: 'Unknown conversion mode' } }
    }

    if (result.success && result.output) {
      setOutput(result.output)
      toast.success('Conversion completed successfully')
    } else {
      const error = result.error!
      toast.error('Conversion failed', {
        description: error.details ? `${error.message}: ${error.details}` : error.message,
      })
      setOutput('')
    }
  }

  const handleAutoDetect = () => {
    if (!input().trim()) {
      return
    }

    const detected = detectFormat(input())

    switch (detected) {
      case 'json':
        setMode('json-to-csv')
        break
      case 'csv':
        setMode('csv-to-json')
        break
      case 'yaml':
        setMode('yaml-to-json')
        break
      case 'query':
        setMode('query-to-json')
        break
      default:
        toast.error('Could not detect input format', {
          description: 'Please select conversion mode manually',
        })
        return
    }

    toast.success(`Detected ${detected.toUpperCase()} format`)
  }

  const handleClear = () => {
    setInput('')
    setOutput('')
  }

  const handleCopy = async () => {
    if (!output()) {
      return
    }

    try {
      await navigator.clipboard.writeText(output())
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleDownload = () => {
    if (!output()) {
      return
    }

    const modeToExtension = {
      'json-to-csv': 'csv',
      'csv-to-json': 'json',
      'json-to-yaml': 'yaml',
      'yaml-to-json': 'json',
      'json-to-query': 'txt',
      'query-to-json': 'json',
    }

    const modeToMimeType = {
      'json-to-csv': 'text/csv',
      'csv-to-json': 'application/json',
      'json-to-yaml': 'text/yaml',
      'yaml-to-json': 'application/json',
      'json-to-query': 'text/plain',
      'query-to-json': 'application/json',
    }

    const extension = modeToExtension[mode()]
    const mimeType = modeToMimeType[mode()]

    const blob = new Blob([output()], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `converted.${extension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('Downloaded successfully')
  }

  const getInputPlaceholder = () => {
    switch (mode()) {
      case 'json-to-csv':
      case 'json-to-yaml':
      case 'json-to-query':
        return 'Paste your JSON here...'
      case 'csv-to-json':
        return 'Paste your CSV here...'
      case 'yaml-to-json':
        return 'Paste your YAML here...'
      case 'query-to-json':
        return 'Paste your query parameters here (e.g., name=John&age=30)...'
      default:
        return 'Paste your data here...'
    }
  }

  const getOutputLabel = () => {
    switch (mode()) {
      case 'json-to-csv':
        return 'CSV Output'
      case 'csv-to-json':
      case 'yaml-to-json':
      case 'query-to-json':
        return 'JSON Output'
      case 'json-to-yaml':
        return 'YAML Output'
      case 'json-to-query':
        return 'Query Parameters Output'
      default:
        return 'Output'
    }
  }

  return (
    <>
      <div class="space-y-4">
        <div class="flex flex-wrap gap-4 items-center">
          <TextField class="w-48">
            <TextFieldLabel>Conversion Mode</TextFieldLabel>
            <Combobox<ConversionMode>
              value={mode()}
              onChange={setMode}
              class="w-full"
              options={conversionModes.map(({ value }) => value)}
              optionValue={option => option}
              optionLabel={option => conversionModes.find(m => m.value === option)?.label ?? option}
              itemComponent={props => (
                <ComboboxItem item={props.item}>
                  {conversionModes.find(m => m.value === props.item.rawValue)?.label ?? props.item.rawValue}
                </ComboboxItem>
              )}
            >
              <ComboboxControl>
                <ComboboxInput />
                <ComboboxTrigger />
              </ComboboxControl>
              <ComboboxContent />
            </Combobox>
          </TextField>

          <Button
            variant="secondary"
            onClick={handleAutoDetect}
            disabled={!input().trim()}
            class="mt-6"
          >
            Auto-Detect Format
          </Button>
        </div>
      </div>

      <div class="gap-6 grid lg:grid-cols-2">
        <div class="space-y-4">
          <TextField>
            <TextFieldLabel>Input</TextFieldLabel>
            <TextFieldTextArea
              class="text-sm font-mono h-96"
              placeholder={getInputPlaceholder()}
              value={input()}
              onInput={e => setInput(e.currentTarget.value)}
            />
          </TextField>
          <div class="flex flex-wrap gap-2">
            <Button
              onClick={handleConvert}
              disabled={!input().trim()}
            >
              Convert
            </Button>
            <Button
              variant="secondary"
              onClick={handleClear}
              disabled={!input() && !output()}
            >
              Clear
            </Button>
          </div>
        </div>

        <div class="space-y-4">
          <TextField>
            <TextFieldLabel>{getOutputLabel()}</TextFieldLabel>
            <TextFieldTextArea
              class="text-sm font-mono bg-muted/50 h-96"
              readOnly
              placeholder="Converted output will appear here..."
              value={output()}
            />
          </TextField>
          <div class="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={handleCopy}
              disabled={!output()}
            >
              Copy
            </Button>
            <Button
              variant="secondary"
              onClick={handleDownload}
              disabled={!output()}
            >
              Download
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
