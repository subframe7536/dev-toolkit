import { EncoderLayout } from '#/components/encoder-layout'
import { createRoute } from 'solid-file-router'
import { toast } from 'solid-sonner'

export default createRoute({
  info: {
    title: 'URL Encoder/Decoder',
    description: 'Encode and decode URL strings',
    category: 'Encoding',
    icon: 'lucide:link',
    tags: ['url', 'encode', 'decode', 'percent-encoding'],
  },
  component: URLEncoder,
})

function URLEncoder() {
  const encodeToURL = (input: string) => {
    try {
      return encodeURIComponent(input)
    } catch {
      toast.error('Invalid input for encoding')
      return ''
    }
  }

  const decodeFromURL = (input: string) => {
    try {
      return decodeURIComponent(input)
    } catch {
      toast.error('Invalid URL-encoded string')
      return ''
    }
  }

  return (
    <EncoderLayout
      onEncode={encodeToURL}
      onDecode={decodeFromURL}
      inputPlaceholder="Enter text to encode or URL-encoded text to decode..."
      outputLabel="URL Output"
      outputPlaceholder="Encoded or decoded text will appear here..."
    />
  )
}
