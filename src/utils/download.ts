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
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  // Modal layers block clicks outside their content, including temporary download links.
  const host =
    Array.from(document.querySelectorAll('[role="dialog"][aria-modal="true"]')).at(-1) ??
    document.body
  host.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
