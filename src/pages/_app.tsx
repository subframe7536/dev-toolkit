import type { RouteSectionProps } from '@solidjs/router'

import { Button } from '#/components/ui/button'
import Icon from '#/components/ui/icon'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
import { getCategories } from '#/utils/routes'
import { useColorMode } from '@solid-hooks/core/web'
import { A } from '@solidjs/router'
import { createRoute } from 'solid-file-router'
import { For, Show } from 'solid-js'

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
  const [mode, setMode] = useColorMode()
  const { categories, count } = getCategories()

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
                            <Show when={tool.info.icon}>
                              <Icon name={tool.info.icon as `lucide:${string}`} />
                            </Show>
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
        <SidebarFooter>
          <div class="text-xs text-sidebar-foreground/70 px-2 py-1">
            <div class="flex items-center justify-between">
              <span>Theme: {mode()}</span>
              <button
                onClick={() => setMode(m => m === 'auto' ? 'light' : m === 'light' ? 'dark' : 'auto')}
                class="px-2 py-1 rounded hover:bg-sidebar-accent"
              >
                Toggle
              </button>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <SidebarTrigger class="left-2 top-2 absolute" />
        <div class="p-12 md:p-24">
          {props.children}
        </div>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  )
}
