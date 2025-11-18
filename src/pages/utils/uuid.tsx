import { Button } from '#/components/ui/button'
import { createRoute } from 'solid-file-router'
import { createSignal, For } from 'solid-js'

export default createRoute({
  info: {
    title: 'UUID Generator',
    description: 'Generate unique identifiers (UUIDs)',
    category: 'Utilities',
    icon: 'lucide:fingerprint',
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
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const copyAll = () => {
    navigator.clipboard.writeText(uuids().join('\n'))
  }

  return (
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl text-foreground font-bold">UUID Generator</h1>
        <p class="text-muted-foreground mt-2">
          Generate Universally Unique Identifiers (UUIDs)
        </p>
      </div>

      <div class="space-y-6">
        <div class="flex gap-4 items-center">
          <div>
            <label class="text-sm text-foreground font-medium mb-1 block">
              Number of UUIDs
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={count()}
              onInput={e => setCount(Number.parseInt(e.target.value))}
              class="px-3 py-2 text-center border border-border rounded-md bg-background w-20"
            />
          </div>
          <Button onClick={generateUUIDs} class="mt-6">
            Generate UUIDs
          </Button>
        </div>

        {uuids().length > 0 && (
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
                      onClick={() => copyToClipboard(uuid)}
                    >
                      Copy
                    </Button>
                  </div>
                )}
              </For>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
