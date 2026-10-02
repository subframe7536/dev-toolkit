import type { RouteSectionProps } from '@solidjs/router'
import { A, useBeforeLeave } from '@solidjs/router'
import { Button, cn, Icon } from 'moraine'
import { createRoute } from 'solid-file-router'
import { For } from 'solid-js'

import { ThemeToggle } from '#/components/theme-toggle'
import { ToolLayout } from '#/components/tool-layout'
import { SidebarLayout, SidebarTrigger } from '#/components/ui/sidebar'
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
    <SidebarLayout
      renderSidebarHeader={() => (
        <A
          href="/"
          class="px-2 py-2 block transition-colors duration-150 rounded-md hover:bg-sidebar-accent"
        >
          <h2 class="text-sidebar-foreground font-semibold text-base">Dev Toolkit</h2>
          <p class="text-sidebar-muted-foreground text-xs">{count} tools available</p>
        </A>
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
                        class={cn(
                          'group text-[13px] text-sidebar-foreground leading-5 px-2 py-1 flex gap-2 min-h-11 transition-colors duration-200 ease-out items-center rounded-md hover:(text-sidebar-accent-foreground bg-sidebar-accent) focus-visible:effect-fv md:min-h-8',
                          props.location.pathname.endsWith(tool.path) &&
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
    >
      <div class="flex flex-col min-h-full min-w-0">
        <header class="px-4 py-3 border-b border-border/60 bg-background flex gap-3 items-center top-0 justify-between sticky z-20 sm:px-6">
          <SidebarTrigger />
          <div class="flex gap-2 items-center">
            <ThemeToggle class="min-w-22" />
            <Button
              variant="ghost"
              as="a"
              href="https://github.com/subframe7536/dev-toolkit"
              target="_blank"
              leading="i-lucide-github"
            >
              GitHub
            </Button>
          </div>
        </header>
        <main class="px-4 py-6 flex-1 min-w-0 lg:px-8 sm:px-6 sm:py-8 xl:px-10">
          <ToolLayout>{props.children}</ToolLayout>
        </main>
        <Toaster />
      </div>
    </SidebarLayout>
  )
}
