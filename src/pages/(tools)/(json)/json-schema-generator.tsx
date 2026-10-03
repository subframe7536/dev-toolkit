import { Field, Input, Switch, Textarea } from 'moraine'
import { createRoute } from 'solid-file-router'
import { createEffect, createSignal, on } from 'solid-js'
import { toast } from 'solid-toaster'

import { ClearButton } from '#/components/clear-button'
import { CopyButton } from '#/components/copy-button'
import { DownloadButton } from '#/components/download-button'
import { ToolOptions } from '#/components/tool-options'
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

  createEffect(
    on([input, required, additionalProperties, title, description], () => {
      if (!input().trim()) {
        setOutput('')
        return
      }
      try {
        const schema = generateJsonSchema(input(), {
          required: required(),
          additionalProperties: additionalProperties(),
          title: title() || undefined,
          description: description() || undefined,
        })
        setOutput(schema)
      } catch {
        setOutput('')
        toast.error('Invalid JSON input')
      }
    }),
  )

  const handleClear = () => {
    setInput('')
    setOutput('')
    setTitle('')
    setDescription('')
  }

  return (
    <div class="space-y-4">
      <div class="tool-editor-grid">
        <Field
          label="Input JSON"
          classes={{ root: 'min-w-0', label: 'text-muted-foreground font-medium text-xs' }}
        >
          <Textarea
            classes={{ root: 'tool-editor' }}
            placeholder='{"name": "John", "age": 30}'
            value={input()}
            onValueChange={setInput}
          />
        </Field>
        <Field
          label="JSON Schema Output"
          classes={{ root: 'min-w-0', label: 'text-muted-foreground font-medium text-xs' }}
        >
          <Textarea
            classes={{ root: 'tool-editor bg-muted/30' }}
            readOnly
            placeholder="Generated schema will appear here"
            value={output()}
          />
        </Field>
      </div>
      <div class="tool-toolbar">
        <CopyButton
          text="Copy Output"
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
        <ClearButton onClear={handleClear} disabled={!input() && !output()} />
      </div>
      <ToolOptions>
        <div class="tool-toolbar">
          <Field
            label="Mark fields as required"
            classes={{
              root: 'flex flex-row-reverse gap-2 w-fit min-w-0 items-center',
              label: 'font-normal',
              container: 'mt-0! shrink-0',
            }}
          >
            <Switch checked={required()} onCheckedChange={setRequired} />
          </Field>
          <Field
            label="Allow additional properties"
            classes={{
              root: 'flex flex-row-reverse gap-2 w-fit min-w-0 items-center',
              label: 'font-normal',
              container: 'mt-0! shrink-0',
            }}
          >
            <Switch checked={additionalProperties()} onCheckedChange={setAdditionalProperties} />
          </Field>
        </div>
        <div class="gap-4 grid sm:grid-cols-2">
          <Field
            label="Schema Title (optional)"
            classes={{ root: 'min-w-0', label: 'text-muted-foreground font-medium text-xs' }}
          >
            <Input value={title()} onValueChange={setTitle} placeholder="My Schema" />
          </Field>
          <Field
            label="Schema Description (optional)"
            classes={{ root: 'min-w-0', label: 'text-muted-foreground font-medium text-xs' }}
          >
            <Input
              value={description()}
              onValueChange={setDescription}
              placeholder="Description of the schema"
            />
          </Field>
        </div>
      </ToolOptions>
    </div>
  )
}
