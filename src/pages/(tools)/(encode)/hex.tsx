import { EncoderLayout } from '#/components/encoder-layout'
import { FileEncoder } from '#/components/file-encoder'
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { fileToHex, fromHex, toHex } from '#/utils/hex'
import { createRoute } from 'solid-file-router'

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
    <Tabs defaultValue="text" class="w-full">
      <TabsList>
        <TabsTrigger value="text">Text Mode</TabsTrigger>
        <TabsTrigger value="file">File Mode</TabsTrigger>
        <TabsIndicator />
      </TabsList>

      <TabsContent value="text">
        <EncoderLayout
          mode="Hex"
          onEncode={toHex}
          onDecode={fromHex}
        />
      </TabsContent>

      <TabsContent value="file">
        <FileEncoder
          mode="Hex"
          onEncode={fileToHex}
          uploadInfo="Upload any file to encode to Hexadecimal"
          outputTitle="Hex Output"
          fileExtension="hex"
        />
      </TabsContent>
    </Tabs>
  )
}
