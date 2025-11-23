import { useCopy } from '@solid-hooks/core/web'
import { toast } from 'solid-sonner'

export interface DownloadOptions {
  content: string
  filename: string
  mimeType?: string
}

/**
 * Download content as a file
 */
export function downloadFile(options: DownloadOptions): void {
  const { content, filename, mimeType = 'text/plain' } = options

  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  toast.success('Downloaded successfully')
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await useCopy().copy(text)
    toast.success('Copied to clipboard')
  } catch {
    toast.error('Failed to copy to clipboard')
  }
}
