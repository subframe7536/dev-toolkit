import { Button } from '#/components/ui/button'
import {
  TextField,
  TextFieldInput,
  TextFieldLabel,
} from '#/components/ui/text-field'
import { copyToClipboard } from '#/utils/download'
import { createRoute } from 'solid-file-router'
import { createSignal, For, Show } from 'solid-js'
import { toast } from 'solid-sonner'

export default createRoute({
  info: {
    title: 'UUID Generator',
    description: 'Generate unique identifiers (UUIDs)',
    category: 'Utilities',
    icon: 'lucide:fingerprint',
    tags: ['uuid', 'generator', 'unique', 'identifier'],
  },
  component: UUIDGenerator,
})

function UUIDGenerator() {
  const [uuids, setUuids] = createSignal<string[]>([])
  const [count, setCount] = createSignal(1)

  const generateUUIDs = () => {
    const newUuids = Array.from({ length: count() }, () =>
      crypto.randomUUID())
    setUuids(newUuids)
    toast.success(`Generated ${count()} UUID${count() > 1 ? 's' : ''}`)
  }

  const handleCopy = async (text: string) => {
    await copyToClipboard(text)
  }

  const copyAll = async () => {
    await copyToClipboard(uuids().join('\n'))
  }

  return (
    <div class="space-y-6">
      <div class="flex gap-4 items-end">
        <TextField>
          <TextFieldLabel>Number of UUIDs</TextFieldLabel>
          <TextFieldInput
            type="number"
            min="1"
            max="100"
            value={count().toString()}
            onInput={e => setCount(Number.parseInt((e.target as any).value) || 1)}
            class="text-center"
          />
        </TextField>
        <Button onClick={generateUUIDs}>
          Generate UUIDs
        </Button>
      </div>

      <Show when={uuids().length > 0}>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg text-foreground font-semibold">
              Generated UUIDs ({uuids().length})
            </h3>
            <Button variant="secondary" size="sm" onClick={copyAll}>
              Copy All
            </Button>
          </div>

          <div class="space-y-2">
            <For each={uuids()}>
              {uuid => (
                <div class="text-sm font-mono p-3 border border-border rounded-md bg-muted/50 flex gap-2 items-center">
                  <span class="flex-1">{uuid}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(uuid)}
                  >
                    Copy
                  </Button>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
    </div>
  )
}
