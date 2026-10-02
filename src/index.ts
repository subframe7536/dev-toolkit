import 'solid-toaster/style.css'
import 'uno.css'

import { Router } from '@solidjs/router'
import { createComponent } from 'solid-js'
import { render } from 'solid-js/web'
import { fileRoutes, Root } from 'virtual:routes'

render(
  () => createComponent(Router, { preload: true, root: Root, children: fileRoutes }),
  document.getElementById('root')!,
)
