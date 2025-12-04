import { EncoderLayout } from '#/components/encoder-layout'
import { createRoute } from 'solid-file-router'

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

  const encodeToHTML = (input: string) => {
    if (!div) {
      div = document.createElement('div')
    }
    div.textContent = input
    return div.innerHTML
  }

  const decodeFromHTML = (input: string) => {
    if (!div) {
      div = document.createElement('div')
    }
    div.innerHTML = input
    return div.textContent || ''
  }

  return (
    <EncoderLayout
      mode="HTML"
      onEncode={encodeToHTML}
      onDecode={decodeFromHTML}
    />
  )
}
