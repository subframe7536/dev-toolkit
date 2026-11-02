import 'uno.css'

import type { RouteDefinition } from '@solidjs/router'
import type { RouteMetadata } from 'solid-file-router'
import { createClientEntry } from 'solid-file-router'
import { createComponent } from 'solid-js'
import { fileRoutes, FileRouter } from 'virtual:routes'

type RouteWithMetadata = RouteDefinition & { metadata?: RouteMetadata }

// Let the router own head updates so tool metadata survives client-side navigation.
function applyToolMetadata(routes: RouteDefinition | RouteDefinition[]) {
  for (const item of Array.isArray(routes) ? routes : [routes]) {
    const route = item as RouteWithMetadata
    if (route.info?.title) {
      route.metadata = {
        title: `${route.info.title} - Dev Toolkit`,
        meta: [
          { name: 'description', content: route.info.description },
          { name: 'keywords', content: route.info.tags.join(', ') },
        ],
      }
    }
    if (route.children) {
      applyToolMetadata(route.children)
    }
  }
}

applyToolMetadata(fileRoutes)

createClientEntry(
  () => createComponent(FileRouter, { preload: true }),
  document.getElementById('root')!,
)
