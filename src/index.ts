import { createApp } from '@solid-hooks/core'
import { Router } from '@solidjs/router'
import { fileRoutes, Root } from 'virtual:routes'

import '@unocss/reset/tailwind.css'
import 'uno.css'

createApp(
  Router,
  { base: '/dev-toolkit', preload: true, root: Root, children: fileRoutes },
)
  .mount('#root')
