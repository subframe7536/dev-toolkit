import { Button } from 'moraine'
import { createMemo } from 'solid-js'

import { useTheme } from '#/contexts/theme-context'

export function ThemeToggle(props: { class?: string }) {
  const { mode, setMode } = useTheme()

  const themeIcon = createMemo(() => {
    const current = mode()
    switch (current) {
      case 'light':
        return 'i-lucide-sun'
      case 'dark':
        return 'i-lucide-moon'
      default:
        return 'i-lucide-monitor'
    }
  })

  const handleToggle = () => {
    setMode((m) => (m === 'auto' ? 'light' : m === 'light' ? 'dark' : 'auto'))
  }

  return (
    <Button
      onClick={handleToggle}
      variant="ghost"
      aria-label={`Theme: ${mode()}. Switch to ${mode() === 'auto' ? 'light' : mode() === 'light' ? 'dark' : 'auto'} mode`}
      title={`Theme: ${mode()}`}
      size="icon-md"
      classes={{ root: ['size-11 md:size-8', props.class] }}
      leading={themeIcon() as any}
    />
  )
}
