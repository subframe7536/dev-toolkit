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
        root: 'bg-background h-[100dvh]',
        sidebar: 'bg-sidebar text-sidebar-foreground w-60 duration-200 ease-out',
        sidebarHeader: 'px-3 py-3 flex-col gap-3',
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
    setOpen: (open) => {
      if (frame.isMobile()) {
        frame.setOpen(open)
      }
    },
    toggleSidebar: () => {
      if (frame.isMobile()) {
        frame.toggle()
      }
    },
  }

  return (
    <SidebarContext.Provider value={context}>
      <Show when={frame.isMobile()}>
        <SidebarFrame.Sidebar ariaLabel="Tools navigation">
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
      </Show>
      <SidebarFrame.Main>{props.children}</SidebarFrame.Main>
    </SidebarContext.Provider>
  )
}

export function SidebarTrigger(props: { class?: string }) {
  const sidebar = useSidebar()
  return (
    <Show when={sidebar.isMobile()}>
      <SidebarFrame.Trigger
        as={Button}
        variant="ghost"
        size="icon-md"
        classes={{
          root: [
            'size-11 md:size-8 shrink-0 transition-colors hover:(text-foreground bg-muted)',
            props.class,
          ],
        }}
      >
        <Icon name="i-lucide-menu" />
        <span class="sr-only">Browse tools</span>
      </SidebarFrame.Trigger>
    </Show>
  )
}
