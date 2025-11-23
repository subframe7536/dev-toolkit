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
  TextField,
  TextFieldLabel,
  TextFieldTextArea,
} from '#/components/ui/text-field'
import { copyToClipboard, downloadFile } from '#/utils/download'
import { convertKeys } from '#/utils/json/key-converter'
import { createRoute } from 'solid-file-router'
import { createSignal } from 'solid-js'
import { toast } from 'solid-sonner'

export default createRoute({
  info: {
    title: 'JSON Key Converter',
    description: 'Convert JSON key naming conventions between multiple cases',
    category: 'JSON',
    icon: 'lucide:text-cursor-input',
    tags: ['json', 'camelCase', 'snake_case', 'kebab-case', 'naming'],
  },
  component: JSONKeyConverter,
})

const caseOptions: Array<{ value: CaseStyle, label: string, example: string }> = [
  { value: 'camelCase', label: 'camelCase', example: 'firstName' },
  { value: 'snake_case', label: 'snake_case', example: 'first_name' },
  { value: 'kebab-case', label: 'kebab-case', example: 'first-name' },
  { value: 'PascalCase', label: 'PascalCase', example: 'FirstName' },
  { value: 'CONSTANT_CASE', label: 'CONSTANT_CASE', example: 'FIRST_NAME' },
  { value: 'lowercase', label: 'lowercase', example: 'firstname' },
  { value: 'UPPERCASE', label: 'UPPERCASE', example: 'FIRSTNAME' },
]

function JSONKeyConverter() {
  const [input, setInput] = createSignal('')
  const [output, setOutput] = createSignal('')
  const [targetCase, setTargetCase] = createSignal<CaseStyle>('camelCase')

  const handleConvert = () => {
    const result = convertKeys(input(), targetCase())

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
      filename: `converted-${targetCase()}.json`,
      mimeType: 'application/json',
    })
  }

  return (
    <div class="space-y-4">
      <div class="w-fit space-y-2">
        <label class="text-sm font-medium">Target Case Style</label>
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
                  <span class="text-xs text-muted-foreground">
                    Example: {caseOptions.find(o => o.value === props.item.rawValue)?.example}
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
              onClick={handleConvert}
              disabled={!input()}
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
            <TextFieldLabel>Output</TextFieldLabel>
            <TextFieldTextArea
              class="text-sm font-mono bg-muted/50 h-96"
              readOnly
              placeholder="Converted JSON will appear here..."
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
