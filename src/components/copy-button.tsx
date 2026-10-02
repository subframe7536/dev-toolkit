import { writeClipboard } from '@solid-primitives/clipboard'
import { debounce } from '@solid-primitives/scheduled'
import { Button, Icon } from 'moraine'
import { createMemo, createSignal, Show } from 'solid-js'
import { toast } from 'solid-toaster'

interface CopyButtonProps {
  content: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  class?: string
  text?: boolean | string
}

export function CopyButton(props: CopyButtonProps) {
  const [isCopied, setCopied] = createSignal(false)
  const resetCopied = debounce(() => setCopied(false), 1500)

  const handleCopy = async () => {
    try {
      await writeClipboard(props.content)
      setCopied(true)
      resetCopied()
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
      <Show
        when={text()}
        fallback={<Icon name={isCopied() ? 'i-lucide-check' : 'i-lucide-copy'} />}
      >
        {isCopied() ? 'Copied!' : text() === true ? 'Copy' : props.text}
      </Show>
    </Button>
  )
}
