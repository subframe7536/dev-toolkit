import { createApp } from '@solid-hooks/core'
import { Router } from '@solidjs/router'
import { fileRoutes, Root } from 'virtual:routes'

import 'uno.css'

createApp(
  Router,
  { preload: true, root: Root, children: fileRoutes },
)
  .mount('#root')
