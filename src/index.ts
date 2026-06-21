import 'solid-toaster/style.css'
import 'uno.css'

import { createApp } from '@solid-hooks/core'
import { Router } from '@solidjs/router'
import { fileRoutes, Root } from 'virtual:routes'

createApp(Router, { preload: true, root: Root, children: fileRoutes }).mount('#root')
