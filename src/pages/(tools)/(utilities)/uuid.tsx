import { ClearButton } from '#/components/clear-button'
import { CopyButton } from '#/components/copy-button'
import { Button } from '#/components/ui/button'
import { Icon } from '#/components/ui/icon'
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsTrigger,
} from '#/components/ui/tabs'
import {
  TextField,
  TextFieldInput,
  TextFieldLabel,
} from '#/components/ui/text-field'
import { createRoute } from 'solid-file-router'
import { createSignal, For, onMount, Show } from 'solid-js'
import { toast } from 'solid-sonner'

const PRESET_COUNTS = [1, 5, 10, 15, 20] as const

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

  const handleCustomInput = (value: string) => {
    const newCount = Number.parseInt(value) || 1
    setCount(newCount)
    // Update tab selection if it matches a preset
    if (PRESET_COUNTS.includes(newCount as any)) {
      setSelectedTab(value)
    }
  }

  onMount(() => {
    generateUUIDs()
  })

  return (
    <div class="gap-6 grid grid-cols-1 lg:grid-cols-[auto_1fr]">
      <div class="flex flex-col gap-6 lg:w-80">
        <div>
          <div class="text-lg font-semibold mb-4">Quick Select</div>
          <Tabs value={selectedTab()} onChange={handleTabChange}>
            <TabsList>
              <For each={PRESET_COUNTS}>
                {preset => (
                  <TabsTrigger value={preset.toString()}>{preset}</TabsTrigger>
                )}
              </For>
              <TabsIndicator />
            </TabsList>
          </Tabs>
        </div>

        <TextField>
          <TextFieldLabel>Custom Count</TextFieldLabel>
          <TextFieldInput
            type="number"
            min="1"
            max="100"
            value={count().toString()}
            onInput={e => handleCustomInput((e.target as HTMLInputElement).value)}
            class="text-center h-9"
          />
        </TextField>

        <div class="flex gap-2">
          <Button class="flex-1" onClick={generateUUIDs}>
            <Icon name="lucide:refresh-cw" class="mr-2 size-4" />
            Generate
          </Button>
          <ClearButton
            class="flex-1"
            onClear={handleClear}
            disabled={uuids().length === 0}
          />
        </div>
      </div>

      <Show
        when={uuids().length > 0}
        fallback={(
          <div class="text-muted-foreground p-12 text-center border rounded-lg border-dashed flex items-center justify-center">
            <div>
              <Icon name="lucide:fingerprint" class="mx-auto mb-4 opacity-50 size-12" />
              <p>Click "Generate" to create UUIDs</p>
            </div>
          </div>
        )}
      >
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg text-foreground font-semibold">
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
              {uuid => (
                <div class="text-sm font-mono p-3 border rounded-md bg-muted/50 flex gap-2 items-center">
                  <span class="flex-1 truncate">{uuid}</span>
                  <CopyButton
                    content={uuid}
                    variant="ghost"
                    size="sm"
                    text={false}
                  />
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
    </div>
  )
}
