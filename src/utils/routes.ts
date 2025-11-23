import type { RouteDefinition } from '@solidjs/router'

import { fileRoutes } from 'virtual:routes'

export interface ToolRoute {
  path: string
  info: {
    title: string
    description: string
    category: string
    icon?: string
    tags?: string[]
  }
}

export interface CategoryGroup {
  name: string
  tools: ToolRoute[]
}

/**
 * Utility function to flatten RouteDefinition tree and extract tool routes
 */
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
          tags: route.info.tags,
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
function groupToolsByCategory(tools: ToolRoute[]): CategoryGroup[] {
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

let count = 0
let categories: CategoryGroup[] | undefined

export function getCategories() {
  if (!categories) {
    const toolRoutes = flattenRoutes(fileRoutes)
    categories = groupToolsByCategory(toolRoutes)
    count = toolRoutes.length
  }
  return { count, categories }
}
