import Icon from '#/components/ui/icon'
import { useColorMode } from '@solid-hooks/core/web'
import { createMemo } from 'solid-js'

import { Button } from './ui/button'

export function ThemeToggle(props: { class?: string }) {
  const [mode, setMode] = useColorMode()

  const themeIcon = createMemo(() => {
    const current = mode()
    switch (current) {
      case 'light':
        return 'lucide:sun'
      case 'dark':
        return 'lucide:moon'
      default:
        return 'lucide:monitor'
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
      <Icon name={themeIcon() as any} title={mode()} class="mr-2" />
      {mode()}
    </Button>
  )
}
