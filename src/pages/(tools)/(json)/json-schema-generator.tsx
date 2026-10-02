import { Input, Switch, Textarea } from 'moraine'
import { createRoute } from 'solid-file-router'
import { createSignal } from 'solid-js'
import { toast } from 'solid-toaster'

import { ClearButton } from '#/components/clear-button'
import { CopyButton } from '#/components/copy-button'
import { DownloadButton } from '#/components/download-button'
import { generateJsonSchema } from '#/utils/json/schema-generator'

export default createRoute({
  info: {
    title: 'JSON Schema Generator',
    description: 'Generate JSON Schema from JSON data',
    category: 'JSON',
    icon: 'i-lucide-file-json-2',
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
        <Switch
          checked={required()}
          onCheckedChange={setRequired}
          label="Mark fields as required"
        />
        <Switch
          checked={additionalProperties()}
          onCheckedChange={setAdditionalProperties}
          label="Allow additional properties"
        />
      </div>
      <div class="flex flex-wrap gap-6 items-center">
        <div class="flex-1 min-w-60">
          <label class="font-medium text-sm">Schema Title (optional)</label>
          <Input value={title()} onValueChange={setTitle} placeholder="My Schema" />
        </div>
        <div class="flex-1 min-w-60">
          <label class="font-medium text-sm">Schema Description (optional)</label>
          <Input
            value={description()}
            onValueChange={setDescription}
            placeholder="Description of the schema"
          />
        </div>
      </div>

      <div class="gap-6 grid lg:grid-cols-2">
        <div class="space-y-4">
          <div>
            <label class="font-medium text-sm">Input JSON</label>
            <Textarea
              classes={{ root: 'text-sm font-mono h-96' }}
              placeholder='{"name": "John", "age": 30}'
              value={input()}
              onValueChange={(value) => {
                setInput(value)
                handleGenerate()
              }}
            />
          </div>
          <div class="flex flex-wrap gap-2">
            <ClearButton onClear={handleClear} disabled={!input() && !output()} />
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="font-medium text-sm">JSON Schema Output</label>
            <Textarea
              classes={{ root: 'text-sm font-mono bg-muted/50 h-96' }}
              readOnly
              placeholder="Generated schema will appear here"
              value={output()}
            />
          </div>
          <div class="flex flex-wrap gap-2">
            <CopyButton content={output()} disabled={!output()} variant="secondary" />
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
