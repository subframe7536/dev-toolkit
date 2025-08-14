import { createApp } from '@solid-hooks/core'

import { FileRouter } from './route'

import '@unocss/reset/tailwind.css'
import 'uno.css'

createApp(
  FileRouter,
  { base: '/dev-toolkit', preload: true },
)
  .mount('#root')
