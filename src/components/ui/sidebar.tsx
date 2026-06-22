import type { SidebarFrameT } from 'moraine'
import { Button, SidebarFrame, SidebarFrameSheetOnlyRender, cn } from 'moraine'
import type { JSX, ParentProps } from 'solid-js'
import { Show, createContext, createSignal, useContext } from 'solid-js'

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
  const [desktopOpen, setDesktopOpen] = createSignal(true)

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
      renderFrame={(frameContext) => {
        return (
          <Show
            when={frameContext.isMobile()}
            fallback={
              <div class="p-2 flex gap-2 h-full min-h-0">
                <div
                  class={cn(
                    'min-h-0 transition-[width,opacity,transform] duration-200 ease-out overflow-hidden',
                    desktopOpen()
                      ? 'opacity-100 w-[clamp(14rem,20vw,20rem)] translate-x-0'
                      : 'opacity-0 w-0 pointer-events-none -translate-x-2',
                  )}
                  aria-hidden={!desktopOpen()}
                >
                  <frameContext.sidebar />
                </div>
                <frameContext.main />
              </div>
            }
          >
            <SidebarFrameSheetOnlyRender {...frameContext} />
          </Show>
        )
      }}
      renderSidebarHeader={
        props.renderSidebarHeader
          ? (frameContext) => {
              const context = toSidebarContext(frameContext, desktopOpen, setDesktopOpen)
              return (
                <SidebarContext.Provider value={context}>
                  {props.renderSidebarHeader?.(context)}
                </SidebarContext.Provider>
              )
            }
          : undefined
      }
      renderSidebarBody={(frameContext) => {
        const context = toSidebarContext(frameContext, desktopOpen, setDesktopOpen)
        return (
          <SidebarContext.Provider value={context}>
            {props.renderSidebarBody(context)}
          </SidebarContext.Provider>
        )
      }}
      renderSidebarFooter={
        props.renderSidebarFooter
          ? (frameContext) => {
              const context = toSidebarContext(frameContext, desktopOpen, setDesktopOpen)
              return (
                <SidebarContext.Provider value={context}>
                  {props.renderSidebarFooter?.(context)}
                </SidebarContext.Provider>
              )
            }
          : undefined
      }
      renderMain={(frameContext) => {
        const context = toSidebarContext(frameContext, desktopOpen, setDesktopOpen)
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

function toSidebarContext(
  context: SidebarFrameT.Context,
  desktopOpen: () => boolean,
  setDesktopOpen: (open: boolean | ((open: boolean) => boolean)) => void,
): SidebarContextValue {
  return {
    isMobile: context.isMobile,
    open: () => (context.isMobile() ? context.isOpen() : desktopOpen()),
    setOpen: (open) => {
      if (context.isMobile()) {
        context.setOpen(open)
        return
      }

      setDesktopOpen(open)
    },
    toggleSidebar: () => {
      if (context.isMobile()) {
        context.toggle()
        return
      }

      setDesktopOpen((open) => !open)
    },
  }
}
