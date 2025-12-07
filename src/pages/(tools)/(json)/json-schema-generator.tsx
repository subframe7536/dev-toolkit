import { ClearButton } from '#/components/clear-button'
import { CopyButton } from '#/components/copy-button'
import { DownloadButton } from '#/components/download-button'
import { Switch } from '#/components/ui/switch'
import {
  TextField,
  TextFieldInput,
  TextFieldLabel,
  TextFieldTextArea,
} from '#/components/ui/text-field'
import { generateJsonSchema } from '#/utils/json/schema-generator'
import { createRoute } from 'solid-file-router'
import { createSignal } from 'solid-js'
import { toast } from 'solid-sonner'

export default createRoute({
  info: {
    title: 'JSON Schema Generator',
    description: 'Generate JSON Schema from JSON data',
    category: 'JSON',
    icon: 'lucide:file-json-2',
    tags: ['json', 'schema', 'generator', 'validation'],
  },
  component: JSONSchemaGenerator,
})

function JSONSchemaGenerator() {
  const [input, setInput] = createSignal('')
  const [output, setOutput] = createSignal('')
  const [required, setRequired] = createSignal(true)
  const [additionalProperties, setAdditionalProperties] = createSignal(false)
  const [title, setTitle] = createSignal('')
  const [description, setDescription] = createSignal('')

  const handleGenerate = () => {
    try {
      const schema = generateJsonSchema(input(), {
        required: required(),
        additionalProperties: additionalProperties(),
        title: title() || undefined,
        description: description() || undefined,
      })
      setOutput(schema)
      toast.success('Schema generated successfully')
    } catch {
      toast.error('Invalid JSON input')
    }
  }

  const handleClear = () => {
    setInput('')
    setOutput('')
    setTitle('')
    setDescription('')
  }

  return (
    <div class="space-y-6">
      <div class="flex flex-wrap gap-6">
        <Switch checked={required()} onChange={setRequired} text="Mark fields as required" />
        <Switch
          checked={additionalProperties()}
          onChange={setAdditionalProperties}
          text="Allow additional properties"
        />
      </div>
      <div class="flex flex-wrap gap-6 items-center">
        <TextField class="flex-1 min-w-60">
          <TextFieldLabel>Schema Title (optional)</TextFieldLabel>
          <TextFieldInput
            value={title()}
            onInput={e => setTitle(e.currentTarget.value)}
            placeholder="My Schema"
          />
        </TextField>
        <TextField class="flex-1 min-w-60">
          <TextFieldLabel>Schema Description (optional)</TextFieldLabel>
          <TextFieldInput
            value={description()}
            onInput={e => setDescription(e.currentTarget.value)}
            placeholder="Description of the schema"
          />
        </TextField>
      </div>

      <div class="gap-6 grid lg:grid-cols-2">
        <div class="space-y-4">
          <TextField>
            <TextFieldLabel>Input JSON</TextFieldLabel>
            <TextFieldTextArea
              class="text-sm font-mono h-96"
              placeholder='{"name": "John", "age": 30}'
              value={input()}
              onInput={(e) => {
                setInput(e.currentTarget.value)
                handleGenerate()
              }}
            />
          </TextField>
          <div class="flex flex-wrap gap-2">
            <ClearButton
              onClear={handleClear}
              disabled={!input() && !output()}
            />
          </div>
        </div>

        <div class="space-y-4">
          <TextField>
            <TextFieldLabel>JSON Schema Output</TextFieldLabel>
            <TextFieldTextArea
              class="text-sm font-mono bg-muted/50 h-96"
              readOnly
              placeholder="Generated schema will appear here"
              value={output()}
            />
          </TextField>
          <div class="flex flex-wrap gap-2">
            <CopyButton
              content={output()}
              disabled={!output()}
              variant="secondary"
            />
            <DownloadButton
              content={output()}
              disabled={!output()}
              filename="schema.json"
              mimeType="application/json"
              variant="secondary"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
