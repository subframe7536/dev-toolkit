/**
 * Converts a Uint8Array (file bytes) to a Base64 data URL string.
 * Includes the data URL prefix (data:application/octet-stream;base64,)
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onloadend = () => {
      const dataURL = reader.result as string
      resolve(dataURL)
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}
