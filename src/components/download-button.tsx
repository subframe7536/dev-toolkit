import { downloadFile } from '#/utils/download'
import { cls } from 'cls-variant'
import { createMemo, Show } from 'solid-js'
import { toast } from 'solid-sonner'

import { Button } from './ui/button'
import { Icon } from './ui/icon'

interface DownloadButtonProps {
  content: string | Blob
  filename: string
  mimeType?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'sm' | 'default' | 'lg'
  disabled?: boolean
  class?: string
  text?: boolean | string
}

export function DownloadButton(props: DownloadButtonProps) {
  const handleDownload = () => {
    downloadFile(props.content, props.filename, props.mimeType ?? 'text/plain')
    toast.success('Downloaded successfully')
  }

  const text = createMemo(() => props.text ?? true)
  const icon = <Icon name="lucide:download" class={cls(text() && 'mr-2')} />
  return (
    <Button
      variant={props.variant ?? 'outline'}
      size={props.size}
      class={props.class}
      disabled={props.disabled}
      onClick={handleDownload}
    >
      <Show when={text()}>
        <>
          {icon}
          Download
        </>
      </Show>
    </Button>
  )
}
