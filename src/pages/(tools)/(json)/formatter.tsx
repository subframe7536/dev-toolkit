import type { JSONError } from '#/utils/json/formatter'
import type { CaseStyle, ConversionError } from '#/utils/json/key-converter'

import { Button } from '#/components/ui/button'
import {
  Combobox,
  ComboboxContent,
  ComboboxControl,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxItemLabel,
  ComboboxTrigger,
} from '#/components/ui/combobox'
import {
  Switch,
  SwitchControl,
  SwitchLabel,
  SwitchThumb,
} from '#/components/ui/switch'
import {
  TextField,
  TextFieldLabel,
  TextFieldTextArea,
} from '#/components/ui/text-field'
import { copyToClipboard, downloadFile } from '#/utils/download'
import { formatJSON, minifyJSON, repairJSON, sortKeys } from '#/utils/json/formatter'
import { convertKeys } from '#/utils/json/key-converter'
import { createRoute } from 'solid-file-router'
import { createSignal } from 'solid-js'
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
  const [autoRepair, setAutoRepair] = createSignal(false)
  const [targetCase, setTargetCase] = createSignal<CaseStyle>('As is')

  const tryRepairIfEnabled = (inputValue: string): string => {
    if (autoRepair()) {
      try {
        JSON.parse(inputValue)
        return inputValue
      } catch {
        try {
          const repaired = repairJSON(inputValue)
          toast.success('JSON repaired automatically')
          return repaired
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

  const handleCopy = async () => {
    if (!output()) {
      return
    }
    await copyToClipboard(output())
  }

  const handleDownload = () => {
    if (!output()) {
      return
    }
    downloadFile({
      content: output(),
      filename: 'formatted.json',
      mimeType: 'application/json',
    })
  }

  return (
    <div class="space-y-4">
      <div class="flex flex-wrap gap-4 items-center">
        <Switch checked={autoRepair()} onChange={setAutoRepair}>
          <SwitchLabel>Auto-repair JSON</SwitchLabel>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
        </Switch>
        <div class="w-fit space-y-2">
          <label class="text-sm font-medium">Key Case Style</label>
          <Combobox<CaseStyle>
            value={targetCase()}
            onChange={setTargetCase}
            options={caseOptions.map(opt => opt.value)}
            optionValue={option => option}
            optionLabel={option => caseOptions.find(o => o.value === option)?.label ?? option}
            placeholder="Select case style..."
            itemComponent={props => (
              <ComboboxItem item={props.item}>
                <ComboboxItemLabel>
                  <div class="flex flex-col">
                    <span class="font-medium">
                      {caseOptions.find(o => o.value === props.item.rawValue)?.label}
                    </span>
                  </div>
                </ComboboxItemLabel>
                <ComboboxItemIndicator />
              </ComboboxItem>
            )}
          >
            <ComboboxControl>
              <ComboboxInput />
              <ComboboxTrigger />
            </ComboboxControl>
            <ComboboxContent />
          </Combobox>
        </div>
      </div>
      <div class="gap-6 grid lg:grid-cols-2">
        <div class="space-y-4">
          <TextField>
            <TextFieldLabel>Input JSON</TextFieldLabel>
            <TextFieldTextArea
              class="text-sm font-mono h-96"
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

        <div class="space-y-4">
          <TextField>
            <TextFieldLabel>Output</TextFieldLabel>
            <TextFieldTextArea
              class="text-sm font-mono bg-muted/50 h-96"
              readOnly
              placeholder="Formatted JSON will appear here..."
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
    </div>
  )
}
