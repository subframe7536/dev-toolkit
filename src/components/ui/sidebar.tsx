import type { SidebarFrameT } from 'moraine'
import { Button, SidebarFrame, SidebarFrameSheetOnlyRender, cn } from 'moraine'
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
  renderSidebarHeader?: (context: SidebarContextValue) => JSX.Element
  renderSidebarBody: (context: SidebarContextValue) => JSX.Element
  renderSidebarFooter?: (context: SidebarContextValue) => JSX.Element
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
      frameRender={(frameContext) => {
        const context = toSidebarContext(frameContext)

        return (
          <SidebarContext.Provider value={context}>
            <SidebarFrameSheetOnlyRender {...frameContext} />
          </SidebarContext.Provider>
        )
      }}
      sidebarHeaderRender={
        props.renderSidebarHeader
          ? (frameContext) => props.renderSidebarHeader?.(toSidebarContext(frameContext))
          : undefined
      }
      sidebarBodyRender={(frameContext) => props.renderSidebarBody(toSidebarContext(frameContext))}
      sidebarFooterRender={
        props.renderSidebarFooter
          ? (frameContext) => props.renderSidebarFooter?.(toSidebarContext(frameContext))
          : undefined
      }
      mainRender={() => props.children}
    />
  )
}

export function SidebarTrigger(props: ParentProps<{ class?: string }>) {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      variant="ghost"
      size="icon-md"
      classes={{
        root: cn(
          'border border-border/70 bg-background/90 size-8 shadow-sm transition-colors hover:(text-foreground bg-muted) focus-visible:effect-fv',
          props.class,
        ),
      }}
      leading="i-lucide-panel-left"
      onClick={toggleSidebar}
    >
      <span class="sr-only">Toggle Sidebar</span>
      {props.children}
    </Button>
  )
}

function toSidebarContext(context: SidebarFrameT.BaseContext): SidebarContextValue {
  return {
    isMobile: context.isMobile,
    open: context.isOpen,
    setOpen: context.setOpen,
    toggleSidebar: context.toggle,
  }
}
