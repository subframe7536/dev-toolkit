import { Field, Button, InputNumber, Tabs } from 'moraine'
import { createRoute } from 'solid-file-router'
import { createSignal, For, onMount, Show } from 'solid-js'
import { toast } from 'solid-toaster'

import { ClearButton } from '#/components/clear-button'
import { CopyButton } from '#/components/copy-button'
import { ToolOptions } from '#/components/tool-options'

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
    <div class="space-y-4">
      <ToolOptions>
        <div class="tool-toolbar items-end">
          <Field
            label="Quick Select"
            classes={{
              root: 'w-full min-w-0 md:w-60 shrink-0',
              label: 'text-muted-foreground font-medium text-xs',
            }}
          >
            <Tabs
              aria-label="Quick Select"
              value={selectedTab()}
              onChange={handleTabChange}
              items={PRESET_COUNTS.map((preset) => ({
                value: preset.toString(),
                label: String(preset),
              }))}
            />
          </Field>

          <Field
            label="Custom Count"
            classes={{ root: 'min-w-0 w-32', label: 'text-muted-foreground font-medium text-xs' }}
          >
            <InputNumber
              minValue={1}
              maxValue={100}
              rawValue={count()}
              onRawValueChange={(val) => handleCustomInput(val)}
              classes={{ input: 'text-center h-9' }}
            />
          </Field>
        </div>
      </ToolOptions>
      <div class="tool-actions">
        <Button onClick={generateUUIDs} leading="i-lucide-refresh-cw">
          Generate
        </Button>
        <ClearButton class="min-w-0" onClear={handleClear} disabled={uuids().length === 0} />
      </div>

      <Show
        when={uuids().length > 0}
        fallback={
          <p class="text-muted-foreground py-4 border-t border-border text-sm">
            Click "Generate" to create UUIDs
          </p>
        }
      >
        <div class="pt-4 border-t border-border flex flex-col gap-4">
          <div class="tool-panel-heading">
            <h3 class="text-foreground font-medium text-sm">Generated UUIDs ({uuids().length})</h3>
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
                  <span class="flex-1 min-w-0 break-all">{uuid}</span>
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
