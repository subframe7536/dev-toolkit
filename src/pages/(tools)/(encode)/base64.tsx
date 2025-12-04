import { EncoderLayout } from '#/components/encoder-layout'
import { FileEncoder } from '#/components/file-encoder'
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { fileToBase64 } from '#/utils/base64'
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
    <Tabs defaultValue="text" class="w-full">
      <TabsList>
        <TabsTrigger value="text">Text Mode</TabsTrigger>
        <TabsTrigger value="file">File Mode</TabsTrigger>
        <TabsIndicator />
      </TabsList>

      <TabsContent value="text">
        <EncoderLayout
          mode="Base64"
          onEncode={btoa}
          onDecode={atob}
        />
      </TabsContent>

      <TabsContent value="file">
        <FileEncoder
          mode="Base64"
          onEncode={fileToBase64}
          uploadInfo="Upload any file to encode to Base64"
          outputTitle="Base64 Output"
          fileExtension="base64"
          showDataURLSwitch={true}
        />
      </TabsContent>
    </Tabs>
  )
}
