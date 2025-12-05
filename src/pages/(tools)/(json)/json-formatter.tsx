import type { JSONError } from '#/utils/json/formatter'
import type { CaseStyle, ConversionError } from '#/utils/json/key-converter'

import { CopyButton } from '#/components/copy-button'
import { DownloadButton } from '#/components/download-button'
import { Button } from '#/components/ui/button'
import { Icon } from '#/components/ui/icon'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Switch } from '#/components/ui/switch'
import {
  TextField,
  TextFieldLabel,
  TextFieldTextArea,
} from '#/components/ui/text-field'
import { formatJSON, repairJSON, sortKeys } from '#/utils/json/formatter'
import { convertKeys } from '#/utils/json/key-converter'
import { createRoute } from 'solid-file-router'
import { createEffect, createSignal, on, Show } from 'solid-js'
import { toast } from 'solid-sonner'

export default createRoute({
  info: {
    title: 'JSON Formatter',
    description: 'Format, minify, sort, and convert JSON keys with automatic repair',
    category: 'JSON',
    icon: 'lucide:braces',
    tags: ['json', 'formatter', 'minify', 'beautify', 'camelCase', 'snake_case', 'kebab-case', 'naming'],
  },
  component: JSONFormatter,
})

const caseOptions: Array<{ value: CaseStyle, label: string }> = [
  { value: 'As is', label: 'Keep Current Case' },
  { value: 'camelCase', label: 'camelCase' },
  { value: 'snake_case', label: 'snake_case' },
  { value: 'kebab-case', label: 'kebab-case' },
  { value: 'PascalCase', label: 'PascalCase' },
  { value: 'CONSTANT_CASE', label: 'CONSTANT_CASE' },
  { value: 'lowercase', label: 'lowercase' },
  { value: 'UPPERCASE', label: 'UPPERCASE' },
]

function JSONFormatter() {
  const [input, setInput] = createSignal('')
  const [output, setOutput] = createSignal('')
  const [autoRepair, setAutoRepair] = createSignal(true)
  const [shouldSortKeys, setShouldSortKeys] = createSignal(false)
  const [targetCase, setTargetCase] = createSignal<CaseStyle>('As is')
  const [isFullscreen, setIsFullscreen] = createSignal(false)

  const tryRepairIfEnabled = (inputValue: string): string => {
    if (autoRepair()) {
      try {
        JSON.parse(inputValue)
        return inputValue
      } catch {
        try {
          return repairJSON(inputValue)
        } catch {
          // Repair failed, continue with original input
        }
      }
    }
    return inputValue
  }

  const processJSON = () => {
    const inputValue = input().trim()
    if (!inputValue) {
      setOutput('')
      return
    }

    try {
      const repairedInput = tryRepairIfEnabled(inputValue)

      // Apply key case conversion if needed
      if (targetCase() !== 'As is') {
        const result = convertKeys(repairedInput, targetCase(), false)
        if (result.success && result.output) {
          const formatted = shouldSortKeys() ? sortKeys(result.output) : formatJSON(result.output)
          setOutput(formatted)
          return
        }
      }

      // Apply sort keys if enabled
      const formatted = shouldSortKeys() ? sortKeys(repairedInput) : formatJSON(repairedInput)
      setOutput(formatted)
    } catch (err) {
      const error = err as JSONError
      const message = error.line && error.column
        ? `${error.message} (Line ${error.line}, Column ${error.column})`
        : error.message
      toast.error('Invalid JSON', { description: message })
      setOutput('')
    }
  }

  // Auto-format on input change
  createEffect(on([input, shouldSortKeys, targetCase, autoRepair], () => {
    processJSON()
  }))

  const handleClear = () => {
    setInput('')
    setOutput('')
  }

  return (
    <div class="space-y-6">
      <div class="flex flex-wrap gap-8 items-center">
        <Switch checked={autoRepair()} onChange={setAutoRepair} text="Auto-repair JSON" />
        <Switch checked={shouldSortKeys()} onChange={setShouldSortKeys} text="Sort Keys" />
        <Select
          value={targetCase()}
          onChange={setTargetCase}
          options={caseOptions.map(o => o.value)}
          disallowEmptySelection
          class="w-50"
          itemComponent={props => (
            <SelectItem item={props.item}>
              {caseOptions.find(o => o.value === props.item.rawValue)?.label}
            </SelectItem>
          )}
        >
          <SelectTrigger>
            <SelectValue<CaseStyle>>
              {state => caseOptions.find(o => o.value === state.selectedOption())?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>
      </div>

      <div class="gap-6 grid lg:grid-cols-2">
        <div class="space-y-4">
          <TextField>
            <TextFieldLabel>Input JSON</TextFieldLabel>
            <TextFieldTextArea
              class="text-sm font-mono h-96 resize-none"
              placeholder="Paste your JSON here..."
              value={input()}
              onInput={e => setInput(e.currentTarget.value)}
            />
          </TextField>
          <Button
            variant="destructive"
            onClick={handleClear}
            disabled={!input() && !output()}
          >
            <Icon name="lucide:trash-2" class="mr-2 size-4" />
            Clear
          </Button>
        </div>

        <div class="space-y-4">
          <TextField class="flex-1 relative">
            <TextFieldLabel>Output</TextFieldLabel>
            <Button
              variant="secondary"
              size="icon"
              class="right-2 top-9 absolute"
              onClick={() => setIsFullscreen(true)}
              disabled={!output()}
            >
              <Icon name="lucide:maximize-2" />
            </Button>
            <TextFieldTextArea
              class="text-sm font-mono bg-muted/50 h-96 resize-none"
              readOnly
              placeholder="Formatted JSON will appear here..."
              value={output()}
            />
          </TextField>
          <div class="flex gap-2">
            <CopyButton
              content={output()}
              variant="secondary"
              disabled={!output()}
            />
            <DownloadButton
              content={output()}
              filename="formatted.json"
              mimeType="application/json"
              variant="secondary"
              disabled={!output()}
            />
          </div>
        </div>
      </div>
      <Show when={isFullscreen()}>
        <div class="p-4 bg-background/95 flex flex-col gap-4 inset-0 fixed z-50 overflow-hidden">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">Formatted JSON (Fullscreen)</h2>
            <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(false)}>
              <Icon name="lucide:x" />
            </Button>
          </div>
          <TextField class="flex-1">
            <TextFieldLabel>Output</TextFieldLabel>
            <TextFieldTextArea
              class="text-sm font-mono bg-muted/50 h-full resize-none"
              readOnly
              value={output()}
            />
          </TextField>
        </div>
      </Show>
    </div>
  )
}
