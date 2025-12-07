import { useCopy } from '@solid-hooks/core/web'
import { cls } from 'cls-variant'
import { createMemo, Show } from 'solid-js'
import { toast } from 'solid-sonner'

import { Button } from './ui/button'
import { Icon } from './ui/icon'

interface CopyButtonProps {
  content: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'sm' | 'default' | 'lg'
  disabled?: boolean
  class?: string
  text?: boolean | string
}

export function CopyButton(props: CopyButtonProps) {
  const { copy, isCopied } = useCopy()

  const handleCopy = async () => {
    try {
      await copy(props.content)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }
  const text = createMemo(() => props.text ?? true)
  const icon = <Icon name={isCopied() ? 'lucide:check' : 'lucide:copy'} class={cls(text() && 'mr-2')} />
  return (
    <Button
      variant={props.variant ?? 'outline'}
      size={props.size}
      class={props.class}
      disabled={props.disabled}
      onClick={handleCopy}
    >
      <Show when={text()} fallback={icon}>
        {icon}
        {isCopied() ? 'Copied!' : (text() === true ? 'Copy' : props.text)}
      </Show>
    </Button>
  )
}
