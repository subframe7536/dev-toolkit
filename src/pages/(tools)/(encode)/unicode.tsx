import { EncoderLayout } from '#/components/encoder-layout'
import { createRoute } from 'solid-file-router'

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
    return Array.from(input)
      .map((char) => {
        const code = char.charCodeAt(0)
        if (code > 127) {
          return `\\u${code.toString(16).padStart(4, '0')}`
        }
        return char
      })
      .join('')
  }

  const decodeFromUnicode = (input: string) => {
    return input.replace(REG_DECODE, (_, hex) =>
      String.fromCharCode(Number.parseInt(hex, 16)))
  }

  return (
    <EncoderLayout
      mode="Unicode"
      onEncode={encodeToUnicode}
      onDecode={decodeFromUnicode}
    />
  )
}
