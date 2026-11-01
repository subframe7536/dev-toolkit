import { createMediaQuery } from 'moraine/utils'
import type { Accessor, ParentProps, Setter } from 'solid-js'
import { createContext, createMemo, createRenderEffect, createSignal, useContext } from 'solid-js'

type ColorMode = 'auto' | 'light' | 'dark'

const ThemeContext = createContext<{
  mode: Accessor<ColorMode>
  setMode: Setter<ColorMode>
  isDark: Accessor<boolean>
}>()

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

export function ThemeProvider(props: ParentProps) {
  const [mode, setMode] = createSignal<ColorMode>('auto')
  const prefersDark = createMediaQuery('(prefers-color-scheme: dark)')
  const isDark = createMemo(() => (mode() === 'auto' ? prefersDark() : mode() === 'dark'))

  createRenderEffect(() => {
    document.documentElement.classList.toggle('dark', isDark())
    document.documentElement.classList.toggle('light', !isDark())
  })

  return (
    <ThemeContext.Provider value={{ mode, setMode, isDark }}>
      {props.children}
    </ThemeContext.Provider>
  )
}
