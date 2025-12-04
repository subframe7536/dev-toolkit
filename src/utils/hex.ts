// ----------------------------------------------------------------------------
// Pre-computed Lookup Tables (LUTs) for O(1) access
// ----------------------------------------------------------------------------

// Array of '00'..'ff'
const byteToHex: string[] = Array.from({ length: 256 }, (_, i) =>
  i.toString(16).padStart(2, '0'))

// Map of charCode -> 0-15 (0-9, a-f, A-F)
const hexToByte = new Int8Array(256).fill(-1)
// '0'-'9'
for (let i = 48; i <= 57; i++) {
  hexToByte[i] = i - 48
}
// 'a'-'f'
for (let i = 97; i <= 102; i++) {
  hexToByte[i] = i - 97 + 10
}
// 'A'-'F'
for (let i = 65; i <= 70; i++) {
  hexToByte[i] = i - 65 + 10
}

// Reusable Text instances to avoid instantiation overhead
const encoder = new TextEncoder()
const decoder = new TextDecoder()

// ----------------------------------------------------------------------------
// Implementation
// ----------------------------------------------------------------------------

/**
 * Converts a String or Uint8Array to a Hex string.
 * Uses a pre-computed lookup table for performance.
 */
export function toHex(input: string | Uint8Array): string {
  let bytes: Uint8Array

  // 1. Convert input to bytes
  if (typeof input === 'string') {
    bytes = encoder.encode(input)
  } else {
    bytes = input
  }

  // 2. Map bytes to hex strings
  // Pre-allocating the array size helps V8/SpiderMonkey optimization
  const len = bytes.length
  // eslint-disable-next-line unicorn/no-new-array
  const hexArr = new Array(len)

  for (let i = 0; i < len; i++) {
    hexArr[i] = byteToHex[bytes[i]]
  }

  // 3. Join with empty separator (highly optimized in modern JS engines)
  return hexArr.join('')
}

/**
 * Converts a Hex string back to its original String representation (UTF-8).
 * Throws if the hex string is invalid or has an odd length.
 */
export function fromHex(input: string): string {
  const len = input.length

  if (len % 2 !== 0) {
    throw new Error('Invalid hex string: Length must be even.')
  }

  // Allocate exact size for binary data
  const bytes = new Uint8Array(len / 2)

  for (let i = 0, j = 0; i < len; i += 2, j++) {
    // Read char codes directly (faster than input[i])
    const high = hexToByte[input.charCodeAt(i)]
    const low = hexToByte[input.charCodeAt(i + 1)]

    if (high === -1 || low === -1) {
      throw new Error(`Invalid hex character at index ${i}`)
    }

    // Shift high 4 bits, OR with low 4 bits
    bytes[j] = (high << 4) | low
  }

  // Decode UTF-8 bytes back to string
  return decoder.decode(bytes)
}

/**
 * Converts a Uint8Array (file bytes) to a Hex string.
 * This is a convenience wrapper for file encoding.
 */
export async function fileToHex(file: File): Promise<string> {
  const buf = await new Promise<Uint8Array>((resolve, reject) => {
    const reader = new FileReader()

    reader.onloadend = () => {
      const dataURL = reader.result as ArrayBuffer
      resolve(new Uint8Array(dataURL))
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsArrayBuffer(file)
  })
  return toHex(buf)
}
