import type { RouteSectionProps } from '@solidjs/router'
import { A, useBeforeLeave } from '@solidjs/router'
import { Button, cn, Icon, List } from 'moraine'
import { createRoute } from 'solid-file-router'

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
          class="hover:bg-sidebar-accent px-2 py-1.5 rounded-md block transition-colors duration-150"
        >
          <h2 class="text-sidebar-foreground text-lg font-semibold">Developer Toolkit</h2>
          <p class="text-sidebar-foreground/70 text-xs">{count} tools available</p>
        </A>
      )}
      renderSidebarBody={(sidebar) => (
        <List
          as="div"
          class="mt-4 flex flex-col gap-4"
          items={categories}
          itemRender={(categoryContext) => (
            <section class="flex flex-col gap-1">
              <h3 class="text-sidebar-foreground/70 text-xs tracking-wide font-medium px-2 uppercase">
                {categoryContext.item.name}
              </h3>
              <List
                as="div"
                class="flex flex-col gap-1"
                items={categoryContext.item.tools}
                itemRender={(toolContext) => (
                  <A
                    href={toolContext.item.path}
                    title={toolContext.item.info.title}
                    class={cn(
                      'group hover:text-sidebar-accent-foreground dark:hover:bg-sidebar-accent text-sm px-2 py-2 rounded-md flex gap-2 transition-[background-color,color,box-shadow] duration-200 ease-out items-center hover:(bg-primary/12 shadow-xs)',
                      props.location.pathname.endsWith(toolContext.item.path) &&
                        'text-sidebar-accent-foreground dark:bg-sidebar-accent bg-primary/14 shadow-xs',
                    )}
                    onClick={() => {
                      if (sidebar.isMobile()) {
                        sidebar.setOpen(false)
                      }
                    }}
                  >
                    <Icon
                      name={toolContext.item.info.icon as any}
                      class="text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground size-4 transition-colors duration-200"
                    />
                    <span>{toolContext.item.info.title}</span>
                  </A>
                )}
              />
            </section>
          )}
        />
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
