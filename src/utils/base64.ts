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

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const encodeLookup = Object.fromEntries(Array.from(alphabet).map((a, i) => [i, a.codePointAt(0)]))

const encoder = new TextEncoder()
const decoder = new TextDecoder()

/**
 * Encode text string to Base64 (supports Unicode)
 */
export function encodeText(text: string): string {
  const bytes = encoder.encode(text)
  return toBase64(bytes)
}

/**
 * Decode Base64 string to text (supports Unicode)
 */
export function decodeText(base64: string): string {
  const binary = atob(base64.replaceAll('-', '+').replaceAll('_', '/'))
  const bytes = Uint8Array.from(binary, (char) => char.codePointAt(0)!)
  return decoder.decode(bytes)
}

function toBase64(bytes: Uint8Array) {
  let m = bytes.length
  let k = m % 3
  let n = Math.floor(m / 3) * 4 + (k && k + 1)
  let N = Math.ceil(m / 3) * 4
  let encoded = new Uint8Array(N)

  for (let i = 0, j = 0; j < m; i += 4, j += 3) {
    let y = (bytes[j] << 16) + (bytes[j + 1] << 8) + (bytes[j + 2] | 0)
    encoded[i] = encodeLookup[y >> 18]!
    encoded[i + 1] = encodeLookup[(y >> 12) & 0x3f]!
    encoded[i + 2] = encodeLookup[(y >> 6) & 0x3f]!
    encoded[i + 3] = encodeLookup[y & 0x3f]!
  }

  let base64 = decoder.decode(new Uint8Array(encoded.buffer, 0, n))
  if (k === 1) {
    base64 += '=='
  }
  if (k === 2) {
    base64 += '='
  }
  return base64
}
