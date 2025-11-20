import type { ParentProps } from 'solid-js'

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
import { flattenRoutes, groupToolsByCategory } from '#/utils/routes'
import { useColorMode } from '@solid-hooks/core/web'
import { A } from '@solidjs/router'
import { createRoute } from 'solid-file-router'
import { createMemo, For, Show } from 'solid-js'
import { fileRoutes } from 'virtual:routes'

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

function App(props: ParentProps) {
  const [mode, setMode] = useColorMode()

  // Extract tool routes from the RouteDefinition tree
  const toolRoutes = createMemo(() => {
    return flattenRoutes(fileRoutes)
  })

  // Group tools by category
  const categories = createMemo(() => {
    return groupToolsByCategory(toolRoutes())
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
              {toolRoutes().length}
              {' '}
              tools available
            </p>
          </A>
        </SidebarHeader>
        <SidebarContent>
          <For each={categories()}>
            {category => (
              <SidebarGroup>
                <SidebarGroupLabel>{category.name}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <For each={category.tools}>
                      {tool => (
                        <SidebarMenuItem>
                          <SidebarMenuButton as={A} href={tool.path} tooltip={tool.info.title}>
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
        <div class="px-24 pt-24">
          {props.children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
