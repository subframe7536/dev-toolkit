import { Button, Icon, InputNumber, Tabs } from 'moraine'
import { createRoute } from 'solid-file-router'
import { createSignal, For, onMount, Show } from 'solid-js'
import { toast } from 'solid-toaster'

import { ClearButton } from '#/components/clear-button'
import { CopyButton } from '#/components/copy-button'

const PRESET_COUNTS = [1, 5, 10, 15, 20] as const

export default createRoute({
  info: {
    title: 'UUID Generator',
    description: 'Generate unique identifiers (UUIDs)',
    category: 'Utilities',
    icon: 'i-lucide-fingerprint',
    tags: ['uuid', 'generator', 'unique', 'identifier'],
  },
  component: UUIDGenerator,
})

function UUIDGenerator() {
  const [uuids, setUuids] = createSignal<string[]>([])
  const [count, setCount] = createSignal(5)
  const [selectedTab, setSelectedTab] = createSignal('5')

  const generateUUIDs = () => {
    const newUuids = Array.from({ length: count() }, () => crypto.randomUUID())
    setUuids(newUuids)
    toast.success(`Generated ${count()} UUID${count() > 1 ? 's' : ''}`)
  }

  const handleClear = () => {
    setUuids([])
    toast.info('Cleared all UUIDs')
  }

  const handleTabChange = (value: string) => {
    setSelectedTab(value)
    const newCount = Number.parseInt(value)
    if (!Number.isNaN(newCount)) {
      setCount(newCount)
    }
  }

  const handleCustomInput = (value: number) => {
    const newCount = Math.trunc(value) || 1
    setCount(newCount)
    // Update tab selection if it matches a preset
    if (PRESET_COUNTS.includes(newCount as any)) {
      setSelectedTab(String(newCount))
    }
  }

  onMount(() => {
    generateUUIDs()
  })

  return (
    <div class="gap-6 grid grid-cols-1 lg:grid-cols-[auto_1fr]">
      <div class="flex flex-col gap-6 lg:w-80">
        <div>
          <div class="font-semibold mb-4 text-lg">Quick Select</div>
          <Tabs
            value={selectedTab()}
            onChange={handleTabChange}
            items={PRESET_COUNTS.map((preset) => ({
              value: preset.toString(),
              label: String(preset),
            }))}
          />
        </div>

        <div>
          <label class="font-medium text-sm">Custom Count</label>
          <InputNumber
            minValue={1}
            maxValue={100}
            rawValue={count()}
            onRawValueChange={(val) => handleCustomInput(val)}
            classes={{ input: 'text-center h-9' }}
          />
        </div>

        <div class="flex gap-2">
          <Button
            classes={{ root: 'flex-1' }}
            onClick={generateUUIDs}
            leading="i-lucide-refresh-cw"
          >
            Generate
          </Button>
          <ClearButton class="flex-1" onClear={handleClear} disabled={uuids().length === 0} />
        </div>
      </div>

      <Show
        when={uuids().length > 0}
        fallback={
          <div class="text-muted-foreground p-12 text-center border border-dashed flex items-center justify-center rounded-lg">
            <div>
              <Icon name="i-lucide-fingerprint" class="mx-auto mb-4 opacity-50 size-12" />
              <p>Click "Generate" to create UUIDs</p>
            </div>
          </div>
        }
      >
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h3 class="text-foreground font-semibold text-lg">
              Generated UUIDs ({uuids().length})
            </h3>
            <CopyButton
              content={uuids().join('\n')}
              variant="secondary"
              size="sm"
              text="Copy All"
            />
          </div>

          <div class="flex flex-col gap-2">
            <For each={uuids()}>
              {(uuid) => (
                <div class="font-mono p-3 border bg-muted/50 flex gap-2 items-center text-sm rounded-md">
                  <span class="flex-1 truncate">{uuid}</span>
                  <CopyButton content={uuid} variant="ghost" size="sm" text={false} />
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
    </div>
  )
}
