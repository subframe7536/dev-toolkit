import { EncoderLayout } from '#/components/encoder-layout'
import { FileEncoder } from '#/components/file-encoder'
import { Tabs } from 'moraine'
import { decodeText, encodeText, fileToBase64 } from '#/utils/base64'
import { createRoute } from 'solid-file-router'

export default createRoute({
  info: {
    title: 'Base64 Encoder/Decoder',
    description: 'Encode and decode Base64 strings',
    category: 'Encoding',
    icon: 'lucide:binary',
    tags: ['base64', 'encode', 'decode', 'binary'],
  },
  component: Base64Encoder,
})

function Base64Encoder() {
  return (
    <Tabs
      defaultValue="text"
      class="w-full"
      items={[
        {
          value: 'text',
          label: 'Text Mode',
          content: <EncoderLayout mode="Base64" onEncode={encodeText} onDecode={decodeText} />,
        },
        {
          value: 'file',
          label: 'File Mode',
          content: (
            <FileEncoder
              mode="Base64"
              onEncode={fileToBase64}
              uploadInfo="Upload any file to encode to Base64"
              outputTitle="Base64 Output"
              fileExtension="base64"
              showDataURLSwitch={true}
            />
          ),
        },
      ]}
    />
  )
}
