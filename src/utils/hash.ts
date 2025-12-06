import SparkMD5 from 'spark-md5'

export type HashAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'

export async function generateHash(
  input: string | File,
  algorithm: HashAlgorithm,
): Promise<string> {
  const isString = typeof input === 'string'
  if (algorithm === 'MD5') {
    return isString ? SparkMD5.hash(input) : SparkMD5.ArrayBuffer.hash(await input.arrayBuffer())
  }

  let data: BufferSource
  if (isString) {
    const encoder = new TextEncoder()
    data = encoder.encode(input)
  } else {
    data = await input.arrayBuffer()
  }

  const buf = await crypto.subtle.digest(algorithm, data)
  const byteArray = new Uint8Array(buf)
  return Array.from(byteArray)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}
