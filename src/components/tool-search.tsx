import { useNavigate } from '@solidjs/router'
import { Button, CommandPalette, Dialog, Icon } from 'moraine'
import type { Accessor, ParentProps } from 'solid-js'
import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
  useContext,
} from 'solid-js'

import { useSidebar } from '#/components/ui/sidebar'
import { getTools, searchTools } from '#/utils/routes'

const ToolSearchContext = createContext<{
  open: () => void
  isOpen: Accessor<boolean>
  setOpen: (open: boolean) => void
  shortcut: Accessor<string>
}>()

export function ToolSearchProvider(props: ParentProps) {
  const [open, setOpen] = createSignal(false)
  const [shortcut, setShortcut] = createSignal('Ctrl K')
  const show = () => setOpen(true)

  onMount(() => {
    const mac = /Mac|iPhone|iPad/.test(navigator.platform)
    setShortcut(mac ? '⌘ K' : 'Ctrl K')
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing || event.repeat || event.altKey || event.shiftKey) {
        return
      }
      if ((mac ? event.metaKey : event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        show()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    onCleanup(() => document.removeEventListener('keydown', onKeyDown))
  })

  return (
    <ToolSearchContext.Provider value={{ open: show, isOpen: open, setOpen, shortcut }}>
      {props.children}
    </ToolSearchContext.Provider>
  )
}

export function ToolSearchDialog() {
  const context = useContext(ToolSearchContext)
  if (!context) {
    throw new Error('ToolSearchDialog must be inside ToolSearchProvider.')
  }
  const navigate = useNavigate()
  const sidebar = useSidebar()
  const [query, setQuery] = createSignal('')
  const tools = getTools()
  const groups = createMemo(() => [
    {
      id: 'tools',
      items: searchTools(tools, query()).map((tool) => ({
        value: tool.path,
        label: tool.info.title,
        description: `${tool.info.category} · ${tool.info.description}`,
        leadingRender: () => <Icon name={tool.info.icon} class="size-4" />,
      })),
    },
  ])

  createEffect(
    on(context.isOpen, (open) => {
      if (open) {
        setQuery('')
      }
    }),
  )

  return (
    <Dialog
      open={context.isOpen()}
      onOpenChange={context.setOpen}
      ariaLabel="Find a tool"
      close={false}
    >
      <Dialog.Content
        classes={{ content: 'p-0 w-[calc(100vw-2rem)] max-w-xl min-w-0 overflow-hidden' }}
      >
        <CommandPalette
          groups={groups()}
          searchTerm={query()}
          onSearchTermChange={setQuery}
          disableFilter
          placeholder="Search tools by name or task..."
          inputProps={{ 'aria-label': 'Search tools' }}
          listboxProps={{ 'aria-label': 'Tools' }}
          showClose
          onClose={() => context.setOpen(false)}
          onSelect={(item) => {
            context.setOpen(false)
            if (sidebar.isMobile()) {
              sidebar.setOpen(false)
            }
            navigate(item.value)
          }}
          emptyRender="No tools found. Try a name, format, or task."
          footerRender={<span class="text-xs">↑ ↓ to select · Enter to open · Esc to close</span>}
          classes={{
            root: 'border-0 shadow-none',
            inputWrapper: 'min-h-12',
            input: 'min-w-0',
            close: 'size-11 md:size-8',
            listbox: 'max-h-[min(24rem,55dvh)]',
            item: 'min-h-12 py-2 data-highlighted:bg-accent',
            footer: 'border-t border-border px-3 py-2',
          }}
        />
      </Dialog.Content>
    </Dialog>
  )
}

export function ToolSearchTrigger(props: { prominent?: boolean }) {
  const context = useContext(ToolSearchContext)
  if (!context) {
    throw new Error('ToolSearchTrigger must be inside ToolSearchProvider.')
  }

  return (
    <Button
      variant="ghost"
      aria-label="Search tools"
      aria-haspopup="dialog"
      onClick={context.open}
      classes={{
        label: 'flex w-full min-w-0 gap-2 items-center',
        root: props.prominent
          ? 'text-muted-foreground border border-border bg-card px-3 min-h-11 w-full justify-start rounded-md'
          : 'text-muted-foreground border border-border px-3 min-h-11 min-w-0 w-full justify-start rounded-md md:min-h-8 md:max-w-md',
      }}
    >
      <Icon name="i-lucide-search" class="shrink-0 size-4" />
      <span class="truncate">
        {props.prominent ? 'Search tools by name or task...' : 'Search tools...'}
      </span>
      <kbd class="text-[11px] font-sans ml-auto pl-3 shrink-0 hidden sm:block">
        {context.shortcut()}
      </kbd>
    </Button>
  )
}
