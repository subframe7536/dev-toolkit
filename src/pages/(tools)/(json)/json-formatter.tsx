import type { JSONError } from '#/utils/json/formatter'
import type { CaseStyle, ConversionError } from '#/utils/json/key-converter'

import { CopyButton } from '#/components/copy-button'
import { DownloadButton } from '#/components/download-button'
import { Button } from '#/components/ui/button'
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
import { formatJSON, minifyJSON, repairJSON, sortKeys } from '#/utils/json/formatter'
import { convertKeys } from '#/utils/json/key-converter'
import { createRoute } from 'solid-file-router'
import { createSignal, Show } from 'solid-js'
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
  { value: 'As is', label: 'As is' },
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

  const handleFormat = () => {
    try {
      const repairedInput = tryRepairIfEnabled(input())
      const formatted = formatJSON(repairedInput)
      setOutput(formatted)
      toast.success('JSON formatted successfully')
    } catch (err) {
      const error = err as JSONError
      const message = error.line && error.column
        ? `${error.message} (Line ${error.line}, Column ${error.column})`
        : error.message
      toast.error('Invalid JSON', { description: message })
      setOutput('')
    }
  }

  const handleMinify = () => {
    try {
      const repairedInput = tryRepairIfEnabled(input())
      const minified = minifyJSON(repairedInput)
      setOutput(minified)
      toast.success('JSON minified successfully')
    } catch (err) {
      const error = err as JSONError
      const message = error.line && error.column
        ? `${error.message} (Line ${error.line}, Column ${error.column})`
        : error.message
      toast.error('Invalid JSON', { description: message })
      setOutput('')
    }
  }

  const handleSortKeys = () => {
    try {
      const repairedInput = tryRepairIfEnabled(input())
      const sorted = sortKeys(repairedInput)
      setOutput(sorted)
      toast.success('Keys sorted successfully')
    } catch (err) {
      const error = err as JSONError
      const message = error.line && error.column
        ? `${error.message} (Line ${error.line}, Column ${error.column})`
        : error.message
      toast.error('Invalid JSON', { description: message })
      setOutput('')
    }
  }

  const handleConvertKeys = () => {
    const result = convertKeys(input(), targetCase(), autoRepair())

    if (result.success && result.output) {
      setOutput(result.output)
      toast.success(`Keys converted to ${targetCase()}`)
    } else if (result.error) {
      const error = result.error as ConversionError
      toast.error(error.message, {
        description: error.details,
      })
      setOutput('')
    }
  }

  const handleClear = () => {
    setInput('')
    setOutput('')
  }

  return (
    <div class="space-y-6">
      <div class="flex flex-wrap gap-3 items-end">
        <div class="flex h-10 items-center">
          <Switch checked={autoRepair()} onChange={setAutoRepair} text="Auto-repair JSON" />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">Key Case Style</label>
          <Select
            value={targetCase()}
            onChange={setTargetCase}
            options={caseOptions.map(o => o.value)}
            disallowEmptySelection
            itemComponent={props => (
              <SelectItem item={props.item}>
                {caseOptions.find(o => o.value === props.item.rawValue)?.label}
              </SelectItem>
            )}
          >
            <SelectTrigger class="w-48">
              <SelectValue<CaseStyle>>
                {state => caseOptions.find(o => o.value === state.selectedOption())?.label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent />
          </Select>
        </div>
      </div>

      <div class="gap-6 grid lg:grid-cols-2">
        <div class="flex flex-col gap-3">
          <TextField class="flex-1">
            <TextFieldLabel>Input JSON</TextFieldLabel>
            <TextFieldTextArea
              class="text-sm font-mono h-96 resize-none"
              placeholder="Paste your JSON here..."
              value={input()}
              onInput={e => setInput(e.currentTarget.value)}
            />
          </TextField>
          <div class="flex flex-wrap gap-2">
            <Button
              onClick={handleFormat}
              disabled={!input()}
            >
              Format
            </Button>
            <Button
              variant="secondary"
              onClick={handleMinify}
              disabled={!input()}
            >
              Minify
            </Button>
            <Button
              variant="secondary"
              onClick={handleSortKeys}
              disabled={!input()}
            >
              Sort Keys
            </Button>
            <Button
              variant="secondary"
              onClick={handleConvertKeys}
              disabled={!input()}
            >
              Convert Keys
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

        <div class="flex flex-col gap-3">
          <TextField class="flex-1">
            <TextFieldLabel>Output</TextFieldLabel>
            <TextFieldTextArea
              class="text-sm font-mono bg-muted/50 h-96 resize-none"
              readOnly
              placeholder="Formatted JSON will appear here..."
              value={output()}
            />
          </TextField>
          <div class="flex flex-wrap gap-2">
            <CopyButton
              content={output()}
              variant="secondary"
            />
            <DownloadButton
              content={output()}
              filename="formatted.json"
              mimeType="application/json"
              variant="secondary"
            />
            <Button
              variant="secondary"
              onClick={() => setIsFullscreen(true)}
              disabled={!output()}
            >
              Fullscreen
            </Button>
          </div>
        </div>
      </div>
      <Show when={isFullscreen()}>
        <div class="p-4 bg-background/95 flex flex-col gap-4 inset-0 fixed z-50 overflow-hidden">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">Formatted JSON (Fullscreen)</h2>
            <Button variant="secondary" size="sm" onClick={() => setIsFullscreen(false)}>
              Close
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
