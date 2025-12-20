import type { RouteSectionProps } from '@solidjs/router'

import { ThemeToggle } from '#/components/theme-toggle'
import { Button } from '#/components/ui/button'
import Icon from '#/components/ui/icon'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '#/components/ui/sidebar'
import { Toaster } from '#/components/ui/sonner'
import { registPWA } from '#/utils/pwa'
import { getCategories } from '#/utils/routes'
import { A, useBeforeLeave } from '@solidjs/router'
import { createRoute } from 'solid-file-router'
import { For } from 'solid-js'

export default createRoute({
  component: App,
  errorComponent: Catch,
  loadingComponent: () => <div>Loading...</div>,
})

function Catch(props: { error: Error, reset: () => void }) {
  console.error(props)
  return (
    <div>
      Something went wrong:
      {' '}
      {props.error.message}
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
    <SidebarProvider>
      <Sidebar variant="floating">
        <SidebarHeader>
          <A href="/" class="px-2 py-1 rounded-md block transition-colors hover:bg-sidebar-accent">
            <h2 class="text-lg text-sidebar-foreground font-semibold">
              Developer Toolkit
            </h2>
            <p class="text-xs text-sidebar-foreground/70">
              {count}
              {' '}
              tools available
            </p>
          </A>
        </SidebarHeader>
        <SidebarContent>
          <For each={categories}>
            {category => (
              <SidebarGroup>
                <SidebarGroupLabel>{category.name}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <For each={category.tools}>
                      {tool => (
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            as={A}
                            href={tool.path}
                            tooltip={tool.info.title}
                            isActive={props.location.pathname.endsWith(tool.path)}
                          >
                            <Icon name={tool.info.icon} />
                            <span>{tool.info.title}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )}
                    </For>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </For>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <SidebarTrigger class="left-2 top-2 sticky z-50" />
        <div class="flex flex-row-reverse right-2 top-2 absolute">
          <ThemeToggle class="w-24" />
          <Button
            variant="ghost"
            as="a"
            href="https://github.com/subframe7536/dev-toolkit"
            target="_blank"
          >
            <Icon name="lucide:github" title="GitHub Link" class="mr-2" />
            GitHub
          </Button>
        </div>
        <div class="p-12 md:(p-24 pt-12)">
          {props.children}
        </div>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  )
}
