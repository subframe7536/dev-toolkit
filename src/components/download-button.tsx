import { downloadFile } from '#/utils/download'
import { createMemo, Show } from 'solid-js'
import { toast } from 'solid-toaster'

import { Button } from 'moraine'

interface DownloadButtonProps {
  content: string | Blob
  filename: string
  mimeType?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'sm' | 'default' | 'lg'
  disabled?: boolean
  class?: string
  text?: boolean | string
  onClick?: () => void
}

export function DownloadButton(props: DownloadButtonProps) {
  const handleDownload = () => {
    downloadFile(props.content, props.filename, props.mimeType ?? 'text/plain')
    toast.success('Downloaded successfully')
  }

  const text = createMemo(() => props.text ?? true)
  return (
    <Button
      variant={props.variant ?? 'outline'}
      size={props.size}
      classes={{ root: props.class }}
      disabled={props.disabled}
      onClick={props.onClick || handleDownload}
      leading={text() ? 'i-lucide-download' : undefined}
    >
      <Show when={text()}>
        {text() === true ? 'Download' : text()}
      </Show>
    </Button>
  )
}
