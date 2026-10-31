import type { ButtonProps } from 'moraine'
import { Button } from 'moraine'
import { splitProps } from 'solid-js'
import { toast } from 'solid-toaster'

import { downloadFile } from '#/utils/download'

type DownloadButtonProps = Omit<ButtonProps, 'onClick'> & {
  content: string | Blob
  filename: string
  mimeType?: string
  /** Replaces the default download behavior. */
  onClick?: () => void
}

export function DownloadButton(props: DownloadButtonProps) {
  const [local, rest] = splitProps(props, [
    'content',
    'filename',
    'mimeType',
    'onClick',
    'children',
  ])

  const handleDownload = () => {
    if (local.onClick) {
      local.onClick()
      return
    }
    downloadFile(local.content, local.filename, local.mimeType ?? 'text/plain')
    toast.success('Downloaded successfully')
  }

  return (
    <Button variant="outline" leading="i-lucide-download" {...rest} onClick={handleDownload}>
      {local.children ?? 'Download'}
    </Button>
  )
}
