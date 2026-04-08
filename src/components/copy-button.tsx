import { useCopy } from '@solid-hooks/core/web'
import { createMemo, Show } from 'solid-js'
import { toast } from 'solid-toaster'

import { Button, Icon } from 'moraine'

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
  return (
    <Button
      variant={props.variant ?? 'outline'}
      size={props.size}
      classes={{ root: props.class }}
      disabled={props.disabled}
      onClick={handleCopy}
      leading={text() ? (isCopied() ? 'i-lucide-check' : 'i-lucide-copy') : undefined}
    >
      <Show when={text()} fallback={<Icon name={isCopied() ? 'i-lucide-check' : 'i-lucide-copy'} />}>
        {isCopied() ? 'Copied!' : (text() === true ? 'Copy' : props.text)}
      </Show>
    </Button>
  )
}
