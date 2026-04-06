import { Icon } from 'moraine'
import { useColorMode } from '@solid-hooks/core/web'
import { createMemo } from 'solid-js'

import { Button } from 'moraine'

export function ThemeToggle(props: { class?: string }) {
  const [mode, setMode] = useColorMode()

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
    setMode(m => m === 'auto' ? 'light' : m === 'light' ? 'dark' : 'auto')
  }

  return (
    <Button
      onClick={handleToggle}
      variant="ghost"
      aria-label="Toggle theme"
      class={props.class}
    >
      <Icon name={themeIcon() as any} title={mode()} classes={{ icon: 'mr-2' }} />
      {mode()}
    </Button>
  )
}
