import 'solid-toaster/style.css'
import 'uno.css'

import { Router } from '@solidjs/router'
import { createComponent } from 'solid-js'
import { render } from 'solid-js/web'
import { fileRoutes, Root } from 'virtual:routes'

// Let the router own head updates so tool metadata survives client-side navigation.
const routes = Array.isArray(fileRoutes) ? fileRoutes : [fileRoutes]
for (const route of routes) {
  if (route.info?.title) {
    route.metadata = {
      title: `${route.info.title} - Dev Toolkit`,
      meta: [
        { name: 'description', content: route.info.description },
        { name: 'keywords', content: route.info.tags.join(', ') },
      ],
    }
  }
}

render(
  () => createComponent(Router, { preload: true, root: Root, children: routes }),
  document.getElementById('root')!,
)
