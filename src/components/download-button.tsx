import type { JSX } from 'solid-js'

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
    const blob = props.content instanceof Blob
      ? props.content
      : new Blob([props.content], { type: props.mimeType ?? 'text/plain' })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = props.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

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
