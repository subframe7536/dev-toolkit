import type { RouteSectionProps } from '@solidjs/router'
import { A, useBeforeLeave, useNavigate } from '@solidjs/router'
import { Button, DropdownMenu, Icon, Sidebar } from 'moraine'
import { createRoute } from 'solid-file-router'
import { For, Show } from 'solid-js'

import { ThemeToggle } from '#/components/theme-toggle'
import { Toaster } from '#/components/toaster'
import { ToolLayout } from '#/components/tool-layout'
import { ToolSearchDialog, ToolSearchProvider, ToolSearchTrigger } from '#/components/tool-search'
import { ThemeProvider } from '#/contexts/theme-context'
import { registPWA } from '#/utils/pwa'
import { getCategories } from '#/utils/routes'

export default createRoute({
  component: App,
  errorComponent: Catch,
  loadingComponent: () => <div class="p-4">Loading...</div>,
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
      <ThemeProvider>
        <Sidebar
          width="15rem"
          class="h-dvh"
          classes={{
            panel: 'bg-sidebar text-sidebar-foreground',
            header: 'px-3 py-3 flex-col items-stretch gap-3',
            groupLabel:
              'text-[11px] text-sidebar-muted-foreground tracking-wide font-semibold uppercase',
            menuButton: 'text-[13px] text-sidebar-foreground md:h-8',
          }}
        >
          <AppContent {...props} />
        </Sidebar>
      </ThemeProvider>
    </ToolSearchProvider>
  )
}

function AppContent(props: RouteSectionProps) {
  const sidebar = Sidebar.useContext()
  const { categories, count } = getCategories()

  return (
    <>
      <Show when={sidebar.isMobile()}>
        <Sidebar.Panel aria-label="Tools navigation">
          <Sidebar.Header>
            <A
              href="/"
              class="rounded-sm flex flex-col min-h-11 justify-center focus-visible:effect-fv"
              onClick={() => sidebar.setOpen(false)}
            >
              <h2 class="text-base text-sidebar-foreground font-semibold">Dev Toolkit</h2>
              <p class="text-xs text-sidebar-muted-foreground">{count} tools</p>
            </A>
            <ToolSearchTrigger />
          </Sidebar.Header>
          <Sidebar.Content>
            <For each={categories}>
              {(category) => (
                <Sidebar.Group>
                  <Sidebar.GroupLabel as="h3">{category.name}</Sidebar.GroupLabel>
                  <Sidebar.Menu>
                    <For each={category.tools}>
                      {(tool) => (
                        <Sidebar.MenuItem>
                          <Sidebar.MenuButton
                            as={A}
                            href={tool.path}
                            title={tool.info.title}
                            leading={tool.info.icon}
                            isActive={props.location.pathname === tool.path}
                          >
                            {tool.info.title}
                          </Sidebar.MenuButton>
                        </Sidebar.MenuItem>
                      )}
                    </For>
                  </Sidebar.Menu>
                </Sidebar.Group>
              )}
            </For>
          </Sidebar.Content>
          <Sidebar.Footer>
            <Button
              variant="ghost"
              as="a"
              href="https://github.com/subframe7536/dev-toolkit"
              target="_blank"
              rel="noopener noreferrer"
              leading="i-lucide-github"
              class="text-sidebar-muted-foreground flex-1 min-h-11 min-w-0 justify-start md:min-h-8"
            >
              GitHub
            </Button>
            <ThemeToggle />
          </Sidebar.Footer>
        </Sidebar.Panel>
      </Show>
      <Sidebar.Inset as="div">
        <div class="flex flex-col min-h-full min-w-0 lg:bg-gutter-pattern">
          <AppToolbar pathname={props.location.pathname} />
          <main class="mx-auto border-x border-border/70 bg-background flex-1 max-w-5xl min-w-0 w-full">
            <ToolLayout>{props.children}</ToolLayout>
          </main>
          <footer class="text-xs text-muted-foreground mx-auto px-4 py-5 border-x border-t border-border/70 bg-background flex flex-wrap gap-2 max-w-5xl w-full items-center justify-between sm:px-6">
            <span>{count} tools · All processing stays in your browser.</span>
            <a
              href="https://github.com/subframe7536/dev-toolkit"
              target="_blank"
              rel="noopener noreferrer"
              class="rounded-sm inline-flex gap-1.5 min-h-11 items-center focus-visible:effect-fv sm:min-h-8"
            >
              <Icon name="i-lucide-github" class="size-3.5" />
              GitHub
            </a>
          </footer>
          <ToolSearchDialog />
          <Toaster />
        </div>
      </Sidebar.Inset>
    </>
  )
}

function AppToolbar(props: { pathname: string }) {
  const sidebar = Sidebar.useContext()
  const navigate = useNavigate()
  const { categories } = getCategories()

  return (
    <header class="border-b border-border bg-background top-0 sticky z-20">
      <div class="mx-auto px-3 border-x border-border/70 flex gap-1 h-14 max-w-5xl min-w-0 items-center sm:(px-6 gap-3)">
        <A
          href="/"
          class="text-sm font-semibold rounded-sm flex shrink-0 gap-2 min-h-11 items-center focus-visible:effect-fv"
        >
          <Icon name="i-lucide-code-xml" class="size-4" />
          <span>Dev Toolkit</span>
        </A>
        <div class="flex flex-1 min-w-0 justify-end sm:justify-center">
          <ToolSearchTrigger compact />
        </div>
        <nav aria-label="Tool navigation" class="flex shrink-0 items-center sm:gap-1">
          <Show
            when={!sidebar.isMobile()}
            fallback={
              <Sidebar.Trigger
                as={Button}
                variant="ghost"
                size="icon-md"
                classes={{
                  root: 'size-11 md:size-8 shrink-0 transition-colors hover:(text-foreground bg-muted)',
                }}
              >
                <Icon name="i-lucide-menu" />
                <span class="sr-only">Browse tools</span>
              </Sidebar.Trigger>
            }
          >
            <DropdownMenu
              align="end"
              gutter={8}
              classes={{
                content: 'w-72 max-h-[calc(100dvh-5rem)] overflow-y-auto',
                groupLabel: 'text-[11px] tracking-wide uppercase',
                item: 'min-h-9',
              }}
            >
              <DropdownMenu.Trigger
                as={Button}
                variant="ghost"
                trailing="i-lucide-chevron-down"
                classes={{ root: 'min-h-9 px-2 text-sm' }}
              >
                Tools
              </DropdownMenu.Trigger>
              <DropdownMenu.Content
                aria-label="Tools"
                items={categories.map((category) => ({
                  type: 'group' as const,
                  label: category.name,
                  children: category.tools.map((tool) => ({
                    label: tool.info.title,
                    icon: tool.info.icon,
                    value: tool.path,
                    class: tool.path === props.pathname ? 'font-semibold bg-accent' : undefined,
                    onSelect: () => navigate(tool.path),
                  })),
                }))}
              />
            </DropdownMenu>
          </Show>
          <Button
            variant="ghost"
            as="a"
            href="https://github.com/subframe7536/dev-toolkit"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View Dev Toolkit on GitHub"
            title="GitHub"
            size="icon-md"
            leading="i-lucide-github"
            classes={{ root: 'hidden sm:flex size-9' }}
          />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
