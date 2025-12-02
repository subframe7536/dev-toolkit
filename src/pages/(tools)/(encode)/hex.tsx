import { EncoderLayout } from '#/components/encoder-layout'
import { createRoute } from 'solid-file-router'
import { toast } from 'solid-sonner'

export default createRoute({
  info: {
    title: 'Hex Encoder/Decoder',
    description: 'Encode and decode hexadecimal strings',
    category: 'Encoding',
    icon: 'lucide:hash',
    tags: ['hex', 'hexadecimal', 'encode', 'decode'],
  },
  component: HexEncoder,
})

function HexEncoder() {
  const encodeToHex = (input: string) => {
    try {
      const hex = Array.from(input)
        .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
      toast.success('Encoded to Hex')
      return hex
    } catch {
      toast.error('Invalid input for encoding')
      return ''
    }
  }

  const decodeFromHex = (input: string) => {
    try {
      const cleaned = input.replace(/[^0-9a-f]/gi, '')
      if (cleaned.length % 2 !== 0) {
        throw new Error('Invalid hex string length')
      }
      const decoded = cleaned.match(/.{2}/g)
        ?.map(byte => String.fromCharCode(Number.parseInt(byte, 16)))
        .join('') || ''
      toast.success('Decoded from Hex')
      return decoded
    } catch {
      toast.error('Invalid hexadecimal string')
      return ''
    }
  }

  return (
    <EncoderLayout
      onEncode={encodeToHex}
      onDecode={decodeFromHex}
      inputPlaceholder="Enter text to encode or hex to decode..."
      outputLabel="Hex Output"
      outputPlaceholder="Encoded or decoded text will appear here..."
    />
  )
}
