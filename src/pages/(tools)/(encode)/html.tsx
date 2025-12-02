import { EncoderLayout } from '#/components/encoder-layout'
import { createRoute } from 'solid-file-router'
import { toast } from 'solid-sonner'

export default createRoute({
  info: {
    title: 'HTML Entity Encoder/Decoder',
    description: 'Encode and decode HTML entities',
    category: 'Encoding',
    icon: 'lucide:code',
    tags: ['html', 'entities', 'encode', 'decode', 'escape'],
  },
  component: HTMLEncoder,
})

function HTMLEncoder() {
  let div: HTMLDivElement
  const ensureEl = () => {
    if (!div) {
      div = document.createElement('div')
    }
  }

  const encodeToHTML = (input: string) => {
    ensureEl()
    try {
      div.textContent = input
      return div.innerHTML
    } catch {
      toast.error('Invalid input for encoding')
      return ''
    }
  }

  const decodeFromHTML = (input: string) => {
    ensureEl()
    try {
      div.innerHTML = input
      return div.textContent
    } catch {
      toast.error('Invalid HTML entity string')
      return ''
    }
  }

  return (
    <EncoderLayout
      onEncode={encodeToHTML}
      onDecode={decodeFromHTML}
      inputPlaceholder="Enter text to encode or HTML entities to decode..."
      outputLabel="HTML Output"
      outputPlaceholder="Encoded or decoded text will appear here..."
    />
  )
}
