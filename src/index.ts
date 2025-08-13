import { createApp } from '@solid-hooks/core'

import { Routes } from './route'

import '@unocss/reset/tailwind.css'
import 'uno.css'

createApp(
  Routes,
  { base: '/dev-toolkit', preload: true },
)
  .mount('#root')
