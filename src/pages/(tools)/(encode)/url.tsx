import { EncoderLayout } from '#/components/encoder-layout'
import { Switch } from '#/components/ui/switch'
import { createRoute } from 'solid-file-router'
import { createSignal } from 'solid-js'

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
  const [useComponent, setUseComponent] = createSignal(true)

  const encode = (text: string) => {
    return useComponent() ? encodeURIComponent(text) : encodeURI(text)
  }

  const decode = (text: string) => {
    return useComponent() ? decodeURIComponent(text) : decodeURI(text)
  }

  return (
    <div class="flex flex-col gap-4">
      <Switch
        checked={useComponent()}
        onChange={setUseComponent}
        text="Regard as URL component"
      />
      <EncoderLayout
        mode="URL"
        onEncode={encode}
        onDecode={decode}
      />
    </div>
  )
}
