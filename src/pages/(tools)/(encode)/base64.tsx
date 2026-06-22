import { Tabs } from 'moraine'
import { createRoute } from 'solid-file-router'

import { EncoderLayout } from '#/components/encoder-layout'
import { FileEncoder } from '#/components/file-encoder'
import { decodeText, encodeText, fileToBase64 } from '#/utils/base64'

export default createRoute({
  info: {
    title: 'Base64 Encoder/Decoder',
    description: 'Encode and decode Base64 strings',
    category: 'Encoding',
    icon: 'i-lucide-binary',
    tags: ['base64', 'encode', 'decode', 'binary'],
  },
  component: Base64Encoder,
})

function Base64Encoder() {
  return (
    <Tabs
      defaultValue="text"
      classes={{ root: 'w-full' }}
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
