import Icon from '#/components/ui/icon'
import { useColorMode } from '@solid-hooks/core/web'
import { createMemo } from 'solid-js'

import { Button } from './ui/button'

export function ThemeToggle(props: { class?: string }) {
  const [mode, setMode] = useColorMode()

  const themeConfig = createMemo(() => {
    const current = mode()
    switch (current) {
      case 'light':
        return { icon: 'lucide:sun', label: 'Light' }
      case 'dark':
        return { icon: 'lucide:moon', label: 'Dark' }
      default:
        return { icon: 'lucide:monitor', label: 'System' }
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
      <Icon name={themeConfig().icon as any} class="mr-2" />
      <span class="text-sm font-medium">{themeConfig().label}</span>
    </Button>
  )
}
