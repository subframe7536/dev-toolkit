import { Button, Icon, SidebarFrame, useSidebarFrame } from 'moraine'
import type { JSX } from 'solid-js'
import { Show, createContext, useContext } from 'solid-js'

export interface SidebarContextValue {
  isMobile: () => boolean
  open: () => boolean
  setOpen: (open: boolean) => void
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextValue>()

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarLayout.')
  }

  return context
}

interface SidebarLayoutProps {
  renderSidebarHeader?: (context: SidebarContextValue) => JSX.Element
  renderSidebarBody: (context: SidebarContextValue) => JSX.Element
  renderSidebarFooter?: (context: SidebarContextValue) => JSX.Element
  children: JSX.Element
}

export function SidebarLayout(props: SidebarLayoutProps) {
  return (
    <SidebarFrame
      variant="default"
      classes={{
        root: 'bg-sidebar h-[100dvh]',
        sidebar: 'bg-sidebar text-sidebar-foreground w-60 duration-200 ease-out',
        sidebarHeader: 'p-2',
        sidebarBody: 'px-2 pb-2',
        main: 'bg-background min-w-0',
      }}
    >
      <SidebarLayoutContent {...props} />
    </SidebarFrame>
  )
}

function SidebarLayoutContent(props: SidebarLayoutProps) {
  const frame = useSidebarFrame()
  const context: SidebarContextValue = {
    isMobile: frame.isMobile,
    open: frame.isOpen,
    setOpen: frame.setOpen,
    toggleSidebar: frame.toggle,
  }

  return (
    <SidebarContext.Provider value={context}>
      <SidebarFrame.Sidebar>
        <Show when={props.renderSidebarHeader}>
          <SidebarFrame.SidebarHeader>
            {props.renderSidebarHeader?.(context)}
          </SidebarFrame.SidebarHeader>
        </Show>
        <SidebarFrame.SidebarBody>{props.renderSidebarBody(context)}</SidebarFrame.SidebarBody>
        <Show when={props.renderSidebarFooter}>
          <SidebarFrame.SidebarFooter>
            {props.renderSidebarFooter?.(context)}
          </SidebarFrame.SidebarFooter>
        </Show>
      </SidebarFrame.Sidebar>
      <SidebarFrame.Main>{props.children}</SidebarFrame.Main>
    </SidebarContext.Provider>
  )
}

export function SidebarTrigger(props: { class?: string }) {
  return (
    <SidebarFrame.Trigger
      as={Button}
      variant="ghost"
      size="icon-md"
      classes={{
        root: [
          'border border-border/70 bg-background/90 size-8 shadow-sm transition-colors hover:(text-foreground bg-muted) focus-visible:effect-fv',
          props.class,
        ],
      }}
    >
      <Icon name="i-lucide-panel-left" />
      <span class="sr-only">Toggle Sidebar</span>
    </SidebarFrame.Trigger>
  )
}
