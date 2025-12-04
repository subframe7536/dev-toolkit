/**
 * Downloads content as a file by creating a temporary anchor element.
 *
 * @param content - The content to download (string or Blob)
 * @param filename - The name of the file to download
 * @param mimeType - The MIME type of the file (default: 'text/plain')
 */
export function downloadFile(
  content: string | Blob,
  filename: string,
  mimeType = 'text/plain',
): void {
  const blob = content instanceof Blob
    ? content
    : new Blob([content], { type: mimeType })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
