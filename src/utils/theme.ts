import { createSingletonRoot } from '@solid-primitives/rootless'
import { createMediaQuery } from 'moraine/utils'
import { createMemo, createRenderEffect, createSignal } from 'solid-js'

type ColorMode = 'auto' | 'light' | 'dark'

// Share the resolved mode between the theme toggle and syntax highlighting.
export const useTheme = createSingletonRoot(() => {
  const [mode, setMode] = createSignal<ColorMode>('auto')
  const prefersDark = createMediaQuery('(prefers-color-scheme: dark)')
  const isDark = createMemo(() => (mode() === 'auto' ? prefersDark() : mode() === 'dark'))

  createRenderEffect(() => {
    document.documentElement.classList.toggle('dark', isDark())
    document.documentElement.classList.toggle('light', !isDark())
  })

  return { mode, setMode, isDark }
})
