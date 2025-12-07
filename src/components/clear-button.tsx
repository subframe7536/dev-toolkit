import { Show } from 'solid-js'

import { Button } from './ui/button'
import Icon from './ui/icon'

interface ClearButtonProps {
  onClear: () => void
  size?: 'sm' | 'default' | 'lg'
  disabled?: boolean
  class?: string
  text?: boolean
}

export function ClearButton(props: ClearButtonProps) {
  const showText = () => props.text ?? true

  const icon = <Icon name="lucide:x" class={showText() ? 'mr-2 size-4' : 'size-4'} />
  return (
    <Button
      variant="destructive"
      size={props.size}
      class={props.class}
      disabled={props.disabled}
      onClick={props.onClear}
    >
      <Show when={showText()} fallback={icon}>
        {icon}
        Clear
      </Show>
    </Button>
  )
}
