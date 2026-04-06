import type { ConversionResult } from '#/utils/json/converter'

import { ClearButton } from '#/components/clear-button'
import { CopyButton } from '#/components/copy-button'
import { DownloadButton } from '#/components/download-button'
import { Select, Switch, Textarea } from 'moraine'
import {
  jsonToJavaClass,
  jsonToJSObject,
  jsonToQueryParams,
  jsonToTSDefinition,
  jsonToYAML,
} from '#/utils/json/converter'
import { createRoute } from 'solid-file-router'
import { createEffect, createSignal } from 'solid-js'
import { toast } from 'solid-toaster'

export default createRoute({
  info: {
    title: 'JSON Converter',
    description: 'Convert JSON to YAML, JS Object, TypeScript, Java, and query parameters',
    category: 'JSON',
    icon: 'lucide:repeat',
    tags: ['json', 'yaml', 'typescript', 'java', 'javascript', 'converter', 'transform'],
  },
  component: JSONConverter,
})

type ConversionMode =
  | 'yaml'
  | 'js-object'
  | 'ts-definition'
  | 'java-class'
  | 'query-params'

function JSONConverter() {
  const [input, setInput] = createSignal('')
  const [output, setOutput] = createSignal('')
  const [mode, setMode] = createSignal<ConversionMode>('yaml')
  const [useRepair, setUseRepair] = createSignal(false)

  const conversionModes = [
    { value: 'yaml', label: 'YAML' },
    { value: 'js-object', label: 'JS Object' },
    { value: 'ts-definition', label: 'TypeScript Definition' },
    { value: 'java-class', label: 'Java Class' },
    { value: 'query-params', label: 'Query Parameters' },
  ] as const

  const convert = (inputValue: string, conversionMode: ConversionMode, repair: boolean) => {
    if (!inputValue.trim()) {
      setOutput('')
      return
    }

    let result: ConversionResult

    switch (conversionMode) {
      case 'yaml':
        result = jsonToYAML(inputValue)
        break
      case 'js-object':
        result = jsonToJSObject(inputValue, repair)
        break
      case 'ts-definition':
        result = jsonToTSDefinition(inputValue, repair)
        break
      case 'java-class':
        result = jsonToJavaClass(inputValue, repair)
        break
      case 'query-params':
        result = jsonToQueryParams(inputValue)
        break
      default:
        result = { success: false, error: { message: 'Unknown conversion mode' } }
    }

    if (result.success && result.output) {
      setOutput(result.output)
    } else {
      const error = result.error!
      toast.error('Conversion failed', {
        description: error.details ? `${error.message}: ${error.details}` : error.message,
      })
      setOutput('')
    }
  }

  // Auto-convert on input or mode change
  createEffect(() => {
    convert(input(), mode(), useRepair())
  })

  const getFileExtension = () => {
    const modeToExtension: Record<ConversionMode, string> = {
      'yaml': 'yaml',
      'js-object': 'js',
      'ts-definition': 'ts',
      'java-class': 'java',
      'query-params': 'txt',
    }
    return modeToExtension[mode()]
  }

  const getMimeType = () => {
    const modeToMimeType: Record<ConversionMode, string> = {
      'yaml': 'text/yaml',
      'js-object': 'text/javascript',
      'ts-definition': 'text/typescript',
      'java-class': 'text/x-java',
      'query-params': 'text/plain',
    }
    return modeToMimeType[mode()]
  }

  const handleClear = () => {
    setInput('')
    setOutput('')
  }

  return (
    <div class="space-y-4">
      <div class="flex flex-wrap gap-4 items-center">
        <Switch
          checked={useRepair()}
          onChange={setUseRepair}
          label="Auto-repair JSON"
        />
      </div>

      <div class="gap-6 grid lg:grid-cols-2">
        <div class="flex flex-col gap-4">
          <div class="mt-3 flex-1">
            <label class="text-sm font-medium">JSON Input</label>
            <Textarea
              classes={{ input: 'text-sm font-mono mt-2 h-96 resize-none' }}
              placeholder="Paste your JSON here..."
              value={input()}
              onInput={e => setInput(e.currentTarget.value)}
            />
          </div>
          <div>
            <ClearButton
              onClear={handleClear}
              disabled={!input()}
            />
          </div>
        </div>

        <div class="flex flex-col gap-4">
          <div class="flex-1">
            <Select
              value={mode()}
              onChange={setMode}
              options={conversionModes.map(({ value, label }) => ({ value, label }))}
              disallowEmptySelection
              classes={{ root: 'w-60' }}
            />
            <Textarea
              classes={{ input: 'text-sm font-mono mt-2 bg-muted/50 h-96 resize-none' }}
              readOnly
              placeholder="Converted output will appear here..."
              value={output()}
            />
          </div>
          <div class="flex flex-wrap gap-4">
            <CopyButton
              content={output()}
              variant="secondary"
              disabled={!output()}
            />
            <DownloadButton
              content={output()}
              filename={`converted.${getFileExtension()}`}
              mimeType={getMimeType()}
              disabled={!output()}
              variant="secondary"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
