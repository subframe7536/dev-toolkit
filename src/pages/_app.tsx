import type { RouteSectionProps } from '@solidjs/router'
import { A, useBeforeLeave } from '@solidjs/router'
import { Button, cn, Icon } from 'moraine'
import { createRoute } from 'solid-file-router'
import { For, Show } from 'solid-js'

import { ThemeToggle } from '#/components/theme-toggle'
import { ToolLayout } from '#/components/tool-layout'
import { ToolSearchDialog, ToolSearchProvider, ToolSearchTrigger } from '#/components/tool-search'
import { SidebarLayout, SidebarTrigger, useSidebar } from '#/components/ui/sidebar'
import { Toaster } from '#/components/ui/sonner'
import { registPWA } from '#/utils/pwa'
import { getCategories } from '#/utils/routes'

export default createRoute({
  component: App,
  errorComponent: Catch,
  loadingComponent: () => <div>Loading...</div>,
})

function Catch(props: { error: Error; reset: () => void }) {
  console.error(props)
  return (
    <div>
      Something went wrong: {props.error.message}
      <Button onClick={() => props.reset()}>Reset</Button>
    </div>
  )
}

function App(props: RouteSectionProps) {
  const { categories, count } = getCategories()
  registPWA()

  useBeforeLeave((e) => {
    if (document.startViewTransition) {
      e.preventDefault()

      document.startViewTransition(() => {
        e.retry(true)
      })
    }
  })

  return (
    <ToolSearchProvider>
      <SidebarLayout
        renderSidebarHeader={(sidebar) => (
          <>
            <A
              href="/"
              class="flex flex-col min-h-11 justify-center rounded-sm focus-visible:effect-fv"
              onClick={() => {
                if (sidebar.isMobile()) {
                  sidebar.setOpen(false)
                }
              }}
            >
              <h2 class="text-sidebar-foreground font-semibold text-base">Dev Toolkit</h2>
              <p class="text-sidebar-muted-foreground text-xs">{count} tools</p>
            </A>
            <ToolSearchTrigger />
          </>
        )}
        renderSidebarBody={(sidebar) => (
          <div class="mt-2 flex flex-col gap-3">
            <For each={categories}>
              {(category) => (
                <section class="flex flex-col gap-1">
                  <h3 class="text-[11px] text-sidebar-muted-foreground tracking-wide font-semibold px-2 uppercase">
                    {category.name}
                  </h3>
                  <div class="flex flex-col gap-0.5">
                    <For each={category.tools}>
                      {(tool) => (
                        <A
                          href={tool.path}
                          title={tool.info.title}
                          aria-current={props.location.pathname === tool.path ? 'page' : undefined}
                          class={cn(
                            'group text-[13px] text-sidebar-foreground leading-5 px-2 py-1 flex gap-2 min-h-11 transition-colors duration-200 ease-out items-center rounded-md hover:(text-sidebar-accent-foreground bg-sidebar-accent) focus-visible:effect-fv md:min-h-8',
                            props.location.pathname === tool.path &&
                              'text-sidebar-accent-foreground font-semibold bg-sidebar-accent',
                          )}
                          onClick={() => {
                            if (sidebar.isMobile()) {
                              sidebar.setOpen(false)
                            }
                          }}
                        >
                          <Icon
                            name={tool.info.icon as any}
                            class="text-sidebar-muted-foreground shrink-0 size-4 transition-colors duration-200 group-hover:text-sidebar-accent-foreground"
                          />
                          <span class="truncate">{tool.info.title}</span>
                        </A>
                      )}
                    </For>
                  </div>
                </section>
              )}
            </For>
          </div>
        )}
        renderSidebarFooter={() => (
          <>
            <Button
              variant="ghost"
              as="a"
              href="https://github.com/subframe7536/dev-toolkit"
              target="_blank"
              rel="noopener noreferrer"
              leading="i-lucide-github"
              classes={{
                root: 'min-h-11 min-w-0 flex-1 justify-start text-sidebar-muted-foreground md:min-h-8',
              }}
            >
              GitHub
            </Button>
            <ThemeToggle />
          </>
        )}
      >
        <div class="flex flex-col min-h-full min-w-0">
          <MobileToolbar />
          <main class="px-4 py-4 flex-1 min-w-0 lg:px-6 sm:px-5">
            <ToolLayout>{props.children}</ToolLayout>
          </main>
          <ToolSearchDialog />
          <Toaster />
        </div>
      </SidebarLayout>
    </ToolSearchProvider>
  )
}

function MobileToolbar() {
  const sidebar = useSidebar()
  return (
    <Show when={sidebar.isMobile()}>
      <header class="px-3 py-2 border-b border-border/60 bg-background flex gap-2 min-w-0 items-center top-0 sticky z-20">
        <SidebarTrigger />
        <div class="flex-1 min-w-0">
          <ToolSearchTrigger />
        </div>
      </header>
    </Show>
  )
}
