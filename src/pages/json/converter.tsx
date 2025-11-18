import { createRoute } from 'solid-file-router'
import { createSignal, Show } from 'solid-js'
import {
  jsonToCSV,
  csvToJSON,
  jsonToYAML,
  yamlToJSON,
  jsonToQueryParams,
  queryParamsToJSON,
  detectFormat,
  type ConversionResult,
  type ConversionError
} from '../../utils/json/converter'

export default createRoute({
  info: {
    title: 'JSON Converter',
    description: 'Convert JSON to/from CSV, YAML, and query parameters',
    category: 'JSON',
    icon: 'lucide:repeat',
  },
  component: JSONConverter,
})

type ConversionMode = 
  | 'json-to-csv'
  | 'csv-to-json'
  | 'json-to-yaml'
  | 'yaml-to-json'
  | 'json-to-query'
  | 'query-to-json'

function JSONConverter() {
  const [input, setInput] = createSignal('')
  const [output, setOutput] = createSignal('')
  const [mode, setMode] = createSignal<ConversionMode>('json-to-csv')
  const [error, setError] = createSignal<ConversionError | null>(null)
  const [successMessage, setSuccessMessage] = createSignal<string | null>(null)
  const [autoDetect, setAutoDetect] = createSignal(true)

  const conversionModes = [
    { value: 'json-to-csv', label: 'JSON → CSV' },
    { value: 'csv-to-json', label: 'CSV → JSON' },
    { value: 'json-to-yaml', label: 'JSON → YAML' },
    { value: 'yaml-to-json', label: 'YAML → JSON' },
    { value: 'json-to-query', label: 'JSON → Query Params' },
    { value: 'query-to-json', label: 'Query Params → JSON' },
  ] as const

  const handleConvert = () => {
    setError(null)
    setSuccessMessage(null)
    
    if (!input().trim()) {
      setError({ message: 'Please provide input to convert' })
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
      setSuccessMessage('Conversion completed successfully!')
      setTimeout(() => setSuccessMessage(null), 2000)
    } else {
      setError(result.error!)
      setOutput('')
    }
  }

  const handleAutoDetect = () => {
    if (!input().trim()) return

    const detected = detectFormat(input())
    
    switch (detected) {
      case 'json':
        // Default to JSON to CSV for JSON input
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
        setError({ message: 'Could not detect input format. Please select conversion mode manually.' })
        return
    }
    
    setSuccessMessage(`Detected ${detected.toUpperCase()} format`)
    setTimeout(() => setSuccessMessage(null), 2000)
  }

  const handleClear = () => {
    setInput('')
    setOutput('')
    setError(null)
    setSuccessMessage(null)
  }

  const handleCopy = async () => {
    if (!output()) return
    
    try {
      await navigator.clipboard.writeText(output())
      setSuccessMessage('Copied to clipboard!')
      setTimeout(() => setSuccessMessage(null), 2000)
    } catch (err) {
      setError({ message: 'Failed to copy to clipboard' })
    }
  }

  const handleDownload = () => {
    if (!output()) return

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
    
    setSuccessMessage('Downloaded successfully!')
    setTimeout(() => setSuccessMessage(null), 2000)
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
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl text-foreground font-bold">JSON Converter</h1>
        <p class="text-muted-foreground mt-2">
          Convert JSON to/from CSV, YAML, and query parameters
        </p>
      </div>

      <Show when={error()}>
        <div class="p-4 border border-red-500 rounded-md bg-red-50 dark:bg-red-950/20" role="alert">
          <div class="flex gap-2 items-start">
            <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="flex-1">
              <div class="text-sm text-red-800 dark:text-red-200 font-medium">
                Conversion Error
              </div>
              <div class="text-sm text-red-700 dark:text-red-300 mt-1">
                {error()?.message}
                <Show when={error()?.details}>
                  <div class="mt-1 text-xs">
                    {error()?.details}
                  </div>
                </Show>
              </div>
            </div>
          </div>
        </div>
      </Show>

      <Show when={successMessage()}>
        <div class="p-4 border border-green-500 rounded-md bg-green-50 dark:bg-green-950/20" role="status">
          <div class="flex gap-2 items-center">
            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <div class="text-sm text-green-800 dark:text-green-200 font-medium">
              {successMessage()}
            </div>
          </div>
        </div>
      </Show>

      <div class="space-y-4">
        <div class="flex gap-4 items-center flex-wrap">
          <div class="flex gap-2 items-center">
            <label class="text-sm text-foreground font-medium">
              Conversion Mode:
            </label>
            <select
              class="text-sm px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              value={mode()}
              onChange={(e) => setMode(e.currentTarget.value as ConversionMode)}
            >
              {conversionModes.map(({ value, label }) => (
                <option value={value}>{label}</option>
              ))}
            </select>
          </div>
          
          <button
            class="text-secondary-foreground px-4 py-2 rounded-md bg-secondary hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            onClick={handleAutoDetect}
            disabled={!input().trim()}
          >
            Auto-Detect Format
          </button>
        </div>
      </div>

      <div class="gap-6 grid lg:grid-cols-2">
        <div class="space-y-4">
          <div>
            <label class="text-sm text-foreground font-medium mb-2 block">
              Input
            </label>
            <textarea
              class="text-sm font-mono p-4 border border-border rounded-md bg-background h-96 w-full resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={getInputPlaceholder()}
              value={input()}
              onInput={(e) => setInput(e.currentTarget.value)}
            />
          </div>
          <div class="flex gap-2 flex-wrap">
            <button 
              class="text-primary-foreground px-4 py-2 rounded-md bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleConvert}
              disabled={!input().trim()}
            >
              Convert
            </button>
            <button 
              class="text-secondary-foreground px-4 py-2 rounded-md bg-secondary hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleClear}
              disabled={!input() && !output()}
            >
              Clear
            </button>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="text-sm text-foreground font-medium mb-2 block">
              {getOutputLabel()}
            </label>
            <textarea
              class="text-sm font-mono p-4 border border-border rounded-md bg-muted/50 h-96 w-full resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              readOnly
              placeholder="Converted output will appear here..."
              value={output()}
            />
          </div>
          <div class="flex gap-2 flex-wrap">
            <button 
              class="text-secondary-foreground px-4 py-2 rounded-md bg-secondary hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleCopy}
              disabled={!output()}
            >
              Copy
            </button>
            <button 
              class="text-secondary-foreground px-4 py-2 rounded-md bg-secondary hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleDownload}
              disabled={!output()}
            >
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}