import { Field, Switch } from 'moraine'
import { createRoute } from 'solid-file-router'
import { createSignal } from 'solid-js'

import { EncoderLayout } from '#/components/encoder-layout'

export default createRoute({
  info: {
    title: 'URL Encoder/Decoder',
    description: 'Encode and decode URL strings',
    category: 'Encoding',
    icon: 'i-lucide-link',
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
      <EncoderLayout mode="URL" onEncode={encode} onDecode={decode} />
      <Field
        label="Regard as URL component"
        classes={{
          root: 'flex flex-row-reverse gap-2 w-fit min-w-0 items-center pt-4 border-t border-border',
          label: 'font-normal',
          container: 'mt-0! shrink-0',
        }}
      >
        <Switch checked={useComponent()} onCheckedChange={setUseComponent} />
      </Field>
    </div>
  )
}
