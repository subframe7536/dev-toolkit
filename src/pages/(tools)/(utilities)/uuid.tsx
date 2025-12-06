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
    <div class="flex flex-col gap-6">
      <div class="flex flex-col gap-4 lg:(flex-row items-end)">
        <div class="flex-1 max-w-120">
          <div class="font-medium mb-2">Quick Select</div>
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

        <div class="flex flex-wrap gap-4 items-end">
          <TextField class="w-full sm:w-24">
            <TextFieldLabel>Custom</TextFieldLabel>
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
            <Button onClick={generateUUIDs} class="flex-1 sm:flex-initial">
              <Icon name="lucide:refresh-cw" class="mr-2 size-4" />
              Generate
            </Button>
            <Button
              onClick={handleClear}
              variant="destructive"
              disabled={uuids().length > 0}
              class="flex-1 sm:flex-initial"
            >
              <Icon name="lucide:trash-2" class="mr-2 size-4" />
              Clear
            </Button>
          </div>
        </div>
      </div>

      <Show when={uuids().length > 0}>
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
                  <span class="flex-1">{uuid}</span>
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
