import { EncoderLayout } from '#/components/encoder-layout'
import { createRoute } from 'solid-file-router'
import { toast } from 'solid-sonner'

export default createRoute({
  info: {
    title: 'Unicode Encoder/Decoder',
    description: 'Encode and decode Unicode escape sequences',
    category: 'Encoding',
    icon: 'lucide:globe',
    tags: ['unicode', 'encode', 'decode', 'escape'],
  },
  component: UnicodeEncoder,
})

const REG_DECODE = /\\u([0-9a-fA-F]{4})/g

function UnicodeEncoder() {
  const encodeToUnicode = (input: string) => {
    try {
      return Array.from(input)
        .map((char) => {
          const code = char.charCodeAt(0)
          if (code > 127) {
            return `\\u${code.toString(16).padStart(4, '0')}`
          }
          return char
        })
        .join('')
    } catch {
      toast.error('Invalid input for encoding')
      return ''
    }
  }

  const decodeFromUnicode = (input: string) => {
    try {
      return input.replace(REG_DECODE, (_, hex) =>
        String.fromCharCode(Number.parseInt(hex, 16)))
    } catch {
      toast.error('Invalid Unicode escape sequence')
      return ''
    }
  }

  return (
    <EncoderLayout
      onEncode={encodeToUnicode}
      onDecode={decodeFromUnicode}
      inputPlaceholder="Enter text to encode or Unicode escape sequences to decode..."
      outputLabel="Unicode Output"
      outputPlaceholder="Encoded or decoded text will appear here..."
    />
  )
}
