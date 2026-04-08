import { Show } from 'solid-js'

import { Button, Icon } from 'moraine'

interface ClearButtonProps {
  onClear: () => void
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  class?: string
  text?: boolean
}

export function ClearButton(props: ClearButtonProps) {
  const showText = () => props.text ?? true

  return (
    <Button
      variant="destructive"
      size={props.size}
      classes={{ root: props.class }}
      disabled={props.disabled}
      onClick={props.onClear}
      leading={showText() ? 'i-lucide-x' : undefined}
    >
      <Show when={showText()} fallback={<Icon name="i-lucide-x" />}>
        Clear
      </Show>
    </Button>
  )
}
