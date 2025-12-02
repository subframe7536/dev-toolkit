import type { JSX } from 'solid-js'

import { useCopy } from '@solid-hooks/core/web'
import { cls } from 'cls-variant'
import { Show } from 'solid-js'
import { toast } from 'solid-sonner'

import { Button } from './ui/button'
import { Icon } from './ui/icon'

interface CopyButtonProps {
  content: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'sm' | 'default' | 'lg'
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

  const icon = <Icon name={isCopied() ? 'lucide:check' : 'lucide:copy'} class={cls(props.text && 'mr-2')} />
  return (
    <Button
      variant={props.variant ?? 'outline'}
      size={props.size}
      class={props.class}
      onClick={handleCopy}
    >
      <Show when={props.text} fallback={icon}>
        <>
          {icon}
          {isCopied() ? 'Copied!' : (props.text === true ? 'Copy' : props.text)}
        </>
      </Show>
    </Button>
  )
}
