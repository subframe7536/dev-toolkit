import type { RouteDefinition } from '@solidjs/router'

import { Card } from '#/components/card'
import Icon from '#/components/ui/icon'
import { A } from '@solidjs/router'
import { createRoute } from 'solid-file-router'
import { createMemo, For, Show } from 'solid-js'
import { fileRoutes } from 'virtual:routes'

export default createRoute({
  component: Index,
})

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

function Index() {
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
    <div class="flex flex-col gap-8 items-center">
      <div class="text-center">
        <h1 class="text-4xl text-foreground tracking-tight font-bold sm:text-5xl">
          Developer Toolkit
        </h1>
        <p class="text-lg text-muted-foreground mt-4">
          A collection of
          {' '}
          {toolRoutes().length}
          {' '}
          essential tools for developers
        </p>
      </div>

      <div class="gap-8 grid lg:grid-cols-2 xl:grid-cols-3 w-full max-w-7xl">
        <For each={categories()}>
          {category => (
            <Card
              title={category.name}
              description={`${category.tools.length} tool${category.tools.length !== 1 ? 's' : ''}`}
              content={(
                <div class="space-y-1">
                  <For each={category.tools}>
                    {tool => (
                      <A
                        href={tool.path}
                        class="p-3 rounded-md flex gap-3 items-start transition-colors hover:(text-accent-foreground bg-accent)"
                      >
                        <Show when={tool.info.icon}>
                          <Icon name={tool.info.icon as `lucide:${string}`} class="mt-0.5 shrink-0" />
                        </Show>
                        <div class="flex-1 min-w-0">
                          <div class="font-medium">{tool.info.title}</div>
                          <div class="text-sm text-muted-foreground">{tool.info.description}</div>
                        </div>
                      </A>
                    )}
                  </For>
                </div>
              )}
            />
          )}
        </For>
      </div>

      <div class="p-8 text-center border border-border rounded-lg bg-card max-w-2xl">
        <h3 class="text-lg text-card-foreground font-semibold">
          More tools coming soon
        </h3>
        <p class="text-(sm muted-foreground) mt-2">
          This toolkit is actively being developed with new features added regularly.
        </p>
      </div>
    </div>
  )
}
