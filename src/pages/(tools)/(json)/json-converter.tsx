import { Field, Select, Switch, Textarea } from 'moraine'
import { createRoute } from 'solid-file-router'
import { createEffect, createSignal, on } from 'solid-js'
import { toast } from 'solid-toaster'

import { ClearButton } from '#/components/clear-button'
import { CopyButton } from '#/components/copy-button'
import { DownloadButton } from '#/components/download-button'
import type { ConversionResult } from '#/utils/json/converter'
import {
  jsonToJavaClass,
  jsonToJSObject,
  jsonToQueryParams,
  jsonToTSDefinition,
  jsonToYAML,
} from '#/utils/json/converter'

export default createRoute({
  info: {
    title: 'JSON Converter',
    description: 'Convert JSON to YAML, JS Object, TypeScript, Java, and query parameters',
    category: 'JSON',
    icon: 'i-lucide-repeat',
    tags: ['json', 'yaml', 'typescript', 'java', 'javascript', 'converter', 'transform'],
  },
  component: JSONConverter,
})

type ConversionMode = 'yaml' | 'js-object' | 'ts-definition' | 'java-class' | 'query-params'

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
        result = jsonToYAML(inputValue, repair)
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
        result = jsonToQueryParams(inputValue, repair)
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
  createEffect(
    on([input, mode, useRepair], ([value, conversionMode, repair]) => {
      convert(value, conversionMode, repair)
    }),
  )

  const getFileExtension = () => {
    const modeToExtension: Record<ConversionMode, string> = {
      yaml: 'yaml',
      'js-object': 'js',
      'ts-definition': 'ts',
      'java-class': 'java',
      'query-params': 'txt',
    }
    return modeToExtension[mode()]
  }

  const getMimeType = () => {
    const modeToMimeType: Record<ConversionMode, string> = {
      yaml: 'text/yaml',
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
    <div class="space-y-6">
      <div class="flex flex-wrap gap-4 items-center">
        <Switch checked={useRepair()} onCheckedChange={setUseRepair} label="Auto-repair JSON" />
      </div>

      <div class="tool-grid">
        <div class="flex flex-col gap-4">
          <div class="tool-field">
            <label class="font-medium tool-panel-heading text-sm">JSON Input</label>
            <Textarea
              classes={{ root: 'tool-editor' }}
              aria-label="Input JSON"
              placeholder="Paste your JSON here..."
              value={input()}
              onValueChange={setInput}
            />
          </div>
          <div>
            <ClearButton onClear={handleClear} disabled={!input()} />
          </div>
        </div>

        <div class="flex flex-col gap-4">
          <div class="tool-field">
            <div class="tool-panel-heading">
              <label class="font-medium text-sm">Output</label>
              <Field
                label="Output format"
                classes={{ root: 'min-w-0', label: 'sr-only', container: 'mt-0!' }}
              >
                <Select
                  value={mode()}
                  onValueChange={(value) => {
                    if (value !== null) {
                      setMode(value)
                    }
                  }}
                  items={conversionModes.map(({ value, label }) => ({ value, label }))}
                  classes={{ control: 'w-52 max-w-full' }}
                />
              </Field>
            </div>
            <Textarea
              classes={{ root: 'tool-editor bg-muted/30' }}
              aria-label="Output"
              readOnly
              placeholder="Converted output will appear here..."
              value={output()}
            />
          </div>
          <div class="tool-actions">
            <CopyButton content={output()} variant="secondary" disabled={!output()} />
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
