import type { RouteSectionProps } from '@solidjs/router'
import { A, useBeforeLeave } from '@solidjs/router'
import { Button, cn, Icon } from 'moraine'
import { createRoute } from 'solid-file-router'
import { For } from 'solid-js'

import { ThemeToggle } from '#/components/theme-toggle'
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
      renderSidebar={() => (
        <div class="flex flex-col gap-4 h-full">
          <A href="/" class="hover:bg-sidebar-accent px-2 py-1 rounded-md block transition-colors">
            <h2 class="text-sidebar-foreground text-lg font-semibold">Developer Toolkit</h2>
            <p class="text-sidebar-foreground/70 text-xs">{count} tools available</p>
          </A>
          <div class="flex flex-col gap-4">
            <For each={categories}>
              {(category) => (
                <section class="flex flex-col gap-1">
                  <h3 class="text-sidebar-foreground/70 text-xs tracking-wide font-medium px-2 uppercase">
                    {category.name}
                  </h3>
                  <div class="flex flex-col gap-1">
                    <For each={category.tools}>
                      {(tool) => (
                        <A
                          href={tool.path}
                          title={tool.info.title}
                          class={cn(
                            'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm px-2 py-2 rounded-md flex gap-2 transition-colors items-center',
                            props.location.pathname.endsWith(tool.path) &&
                              'bg-sidebar-accent text-sidebar-accent-foreground',
                          )}
                        >
                          <Icon name={tool.info.icon} />
                          <span>{tool.info.title}</span>
                        </A>
                      )}
                    </For>
                  </div>
                </section>
              )}
            </For>
          </div>
        </div>
      )}
    >
      <div class="h-full relative">
        <SidebarTrigger class="left-2 top-2 sticky z-50" />
        <div class="flex flex-row-reverse right-2 top-2 absolute">
          <ThemeToggle class="w-24" />
          <Button
            variant="ghost"
            as="a"
            href="https://github.com/subframe7536/dev-toolkit"
            target="_blank"
            leading="lucide:github"
          >
            GitHub
          </Button>
        </div>
        <div class="p-12 md:(p-24 pt-12)">{props.children}</div>
        <Toaster />
      </div>
    </SidebarLayout>
  )
}
