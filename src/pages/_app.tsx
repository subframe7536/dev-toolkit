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
      renderSidebarHeader={() => (
        <A
          href="/"
          class="px-2 py-1.5 block transition-colors duration-150 rounded-md hover:bg-sidebar-accent"
        >
          <h2 class="text-sidebar-foreground font-semibold text-lg">Developer Toolkit</h2>
          <p class="text-sidebar-muted-foreground text-sm">{count} tools available</p>
        </A>
      )}
      renderSidebarBody={(sidebar) => (
        <div class="mt-4 flex flex-col gap-4">
          <For each={categories}>
            {(category) => (
              <section class="flex flex-col gap-1">
                <h3 class="text-sidebar-muted-foreground tracking-wide font-semibold px-2 uppercase text-xs">
                  {category.name}
                </h3>
                <div class="flex flex-col gap-1">
                  <For each={category.tools}>
                    {(tool) => (
                      <A
                        href={tool.path}
                        title={tool.info.title}
                        class={cn(
                          'group text-sidebar-foreground leading-5 px-2 py-2 flex gap-2 transition-colors duration-200 ease-out items-center text-sm rounded-md hover:(text-sidebar-accent-foreground bg-sidebar-accent) focus-visible:effect-fv',
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
                        <span>{tool.info.title}</span>
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
      <div class="h-full relative">
        <SidebarTrigger class="left-3 top-3 sticky z-50" />
        <div class="flex flex-row-reverse gap-1 right-3 top-3 absolute">
          <ThemeToggle class="w-24" />
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
        <main class="px-6 py-12 lg:px-16 md:px-12 sm:px-8">{props.children}</main>
        <Toaster />
      </div>
    </SidebarLayout>
  )
}
