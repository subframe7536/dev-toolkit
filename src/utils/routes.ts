import type { RouteDefinition } from '@solidjs/router'

export interface ToolRoute {
  path: string
  info: {
    title: string
    description: string
    category: string
    icon?: string
  }
}

export interface CategoryGroup {
  name: string
  tools: ToolRoute[]
}

/**
 * Utility function to flatten RouteDefinition tree and extract tool routes
 */
export function flattenRoutes(routes: RouteDefinition | RouteDefinition[], parentPath = ''): ToolRoute[] {
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

/**
 * Group tool routes by category
 */
export function groupToolsByCategory(tools: ToolRoute[]): CategoryGroup[] {
  const grouped = new Map<string, ToolRoute[]>()

  tools.forEach((route) => {
    const category = route.info.category
    if (!grouped.has(category)) {
      grouped.set(category, [])
    }
    grouped.get(category)!.push(route)
  })

  // Convert to array and sort categories
  return Array.from(grouped.entries())
    .map(([name, tools]) => ({ name, tools }))
    .sort((a, b) => a.name.localeCompare(b.name))
}
