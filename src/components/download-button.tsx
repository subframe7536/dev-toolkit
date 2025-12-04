import type { JSX } from 'solid-js'

import { downloadFile } from '#/utils/download'
import { toast } from 'solid-sonner'

import { Button } from './ui/button'
import { Icon } from './ui/icon'

interface DownloadButtonProps {
  content: string | Blob
  filename: string
  mimeType?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'sm' | 'default' | 'lg'
  class?: string
  children?: JSX.Element
}

export function DownloadButton(props: DownloadButtonProps) {
  const handleDownload = () => {
    downloadFile(props.content, props.filename, props.mimeType ?? 'text/plain')
    toast.success('Downloaded successfully')
  }

  return (
    <Button
      variant={props.variant ?? 'outline'}
      size={props.size}
      class={props.class}
      onClick={handleDownload}
    >
      {props.children ?? (
        <>
          <Icon name="lucide:download" class="mr-2 h-4 w-4" />
          Download
        </>
      )}
    </Button>
  )
}
