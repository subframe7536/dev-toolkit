import type { RouteDefinition } from '@solidjs/router'
import type { FileRouteInfo, FileRoutePath } from 'solid-file-router'
import { fileRoutes } from 'virtual:routes'

export interface ToolRoute {
  path: keyof FileRoutePath & string
  info: FileRouteInfo
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
        path: currentPath as any,
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

  // Keep navigation order explicit rather than dependent on category names.
  return Array.from(grouped.entries())
    .map(([name, tools]) => ({ name, tools }))
    .sort(
      (a, b) =>
        ['JSON', 'Encoding', 'Utilities'].indexOf(a.name) -
        ['JSON', 'Encoding', 'Utilities'].indexOf(b.name),
    )
}

let tools: ToolRoute[] | undefined
let categories: CategoryGroup[] | undefined

export function getTools() {
  return (tools ??= flattenRoutes(fileRoutes))
}

export function getCategories() {
  categories ??= groupToolsByCategory(getTools())
  return { count: getTools().length, categories }
}

/** Rank metadata matches, preserving directory order for equally relevant tools. */
export function searchTools(tools: ToolRoute[], query: string): ToolRoute[] {
  const term = query.trim().toLowerCase()
  if (!term) {
    return tools
  }

  const rank = (tool: ToolRoute) => {
    const title = tool.info.title.toLowerCase()
    if (title === term) {
      return 0
    }
    if (title.startsWith(term)) {
      return 1
    }
    if (title.includes(term)) {
      return 2
    }
    if (tool.info.tags?.some((tag) => tag.toLowerCase().includes(term))) {
      return 3
    }
    if (tool.info.category.toLowerCase().includes(term)) {
      return 4
    }
    if (tool.info.description.toLowerCase().includes(term)) {
      return 5
    }
    return 6
  }

  return tools
    .map((tool, index) => ({ tool, index, rank: rank(tool) }))
    .filter((match) => match.rank < 6)
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((match) => match.tool)
}
