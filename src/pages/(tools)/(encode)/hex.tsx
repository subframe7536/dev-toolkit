import { Tabs } from 'moraine'
import { createRoute } from 'solid-file-router'

import { EncoderLayout } from '#/components/encoder-layout'
import { FileEncoder } from '#/components/file-encoder'
import { fileToHex, fromHex, toHex } from '#/utils/hex'

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
  return (
    <Tabs
      defaultValue="text"
      classes={{ root: 'w-full' }}
      items={[
        {
          value: 'text',
          label: 'Text Mode',
          content: <EncoderLayout mode="Hex" onEncode={toHex} onDecode={fromHex} />,
        },
        {
          value: 'file',
          label: 'File Mode',
          content: (
            <FileEncoder
              mode="Hex"
              onEncode={fileToHex}
              uploadInfo="Upload any file to encode to Hexadecimal"
              outputTitle="Hex Output"
              fileExtension="hex"
            />
          ),
        },
      ]}
    />
  )
}
