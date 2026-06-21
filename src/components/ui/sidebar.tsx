import type { SidebarFrameT } from 'moraine'
import { Button, cn, SidebarFrame } from 'moraine'
import type { JSX, ParentProps } from 'solid-js'
import { createContext, useContext } from 'solid-js'

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
  renderSidebar: (context: SidebarContextValue) => JSX.Element
  children: JSX.Element
}

export function SidebarLayout(props: SidebarLayoutProps) {
  return (
    <SidebarFrame
      variant="inset"
      classes={{
        root: 'bg-sidebar',
        sidebar: 'bg-sidebar text-sidebar-foreground',
        sidebarHeader: 'p-2',
        sidebarBody: 'px-2 pb-2',
        main: 'bg-background',
      }}
      renderSidebarBody={(frameContext) => {
        const context = toSidebarContext(frameContext)
        return (
          <SidebarContext.Provider value={context}>
            {props.renderSidebar(context)}
          </SidebarContext.Provider>
        )
      }}
      renderMain={(frameContext) => {
        const context = toSidebarContext(frameContext)
        return <SidebarContext.Provider value={context}>{props.children}</SidebarContext.Provider>
      }}
    />
  )
}

export function SidebarTrigger(props: ParentProps<{ class?: string }>) {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      variant="ghost"
      size="icon-md"
      classes={{ root: cn('size-7', props.class) }}
      leading="i-lucide-panel-left"
      onClick={toggleSidebar}
    >
      <span class="sr-only">Toggle Sidebar</span>
      {props.children}
    </Button>
  )
}

function toSidebarContext(context: SidebarFrameT.Context): SidebarContextValue {
  return {
    isMobile: context.isMobile,
    open: context.isOpen,
    setOpen: context.setOpen,
    toggleSidebar: context.toggle,
  }
}
