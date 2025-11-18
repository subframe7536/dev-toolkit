import type { ParentProps } from 'solid-js'
import type { RouteDefinition } from '@solidjs/router'

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
      Caught at _app error boundary
      <button onClick={() => props.reset}>reset</button>
    </div>
  )
}

interface ToolRoute {
  path: string
  info: {
    title: string
    description: string
    category: string
    icon?: string
  }
}

interface CategoryGroup {
  name: string
  tools: ToolRoute[]
}

// Utility function to flatten RouteDefinition tree and extract tool routes
function flattenRoutes(routes: RouteDefinition | RouteDefinition[], parentPath = ''): ToolRoute[] {
  const routeArray = Array.isArray(routes) ? routes : [routes]
  const result: ToolRoute[] = []

  for (const route of routeArray) {
    // Build the full path
    const currentPath = route.path
      ? `${parentPath}${route.path.startsWith('/') ? '' : '/'}${route.path}`
      : parentPath

    // If this route has tool info, add it to results
    if (route.info?.title && route.info?.category) {
      result.push({
        path: currentPath || '/',
        info: {
          title: route.info.title,
          description: route.info.description || '',
          category: route.info.category,
          icon: route.info.icon,
        },
      })
    }

    // Recursively process children
    if (route.children) {
      result.push(...flattenRoutes(route.children, currentPath))
    }
  }

  return result
}

function App(props: ParentProps) {
  const [mode, setMode, isDark] = useColorMode()

  // Extract tool routes from the RouteDefinition tree
  const toolRoutes = createMemo(() => {
    return flattenRoutes(fileRoutes)
  })

  // Group tools by category
  const categories = createMemo(() => {
    const grouped = new Map<string, ToolRoute[]>()

    toolRoutes().forEach((route) => {
      const category = route.info.category
      if (!grouped.has(category)) {
        grouped.set(category, [])
      }
      grouped.get(category)!.push(route)
    })

    // Convert to array and sort categories
    const result: CategoryGroup[] = Array.from(grouped.entries())
      .map(([name, tools]) => ({ name, tools }))
      .sort((a, b) => a.name.localeCompare(b.name))

    return result
  })

  return (
    <SidebarProvider>
      <Sidebar variant="floating">
        <SidebarHeader>
          <A href="/" class="px-2 py-1 block transition-colors hover:bg-sidebar-accent rounded-md">
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
          <div class="px-2 py-1 text-xs text-sidebar-foreground/70">
            <div class="flex items-center justify-between">
              <span>Theme: {isDark() ? 'Dark' : 'Light'}</span>
              <button
                onClick={() => setMode(m => m === 'dark' ? 'light' : 'dark')}
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
