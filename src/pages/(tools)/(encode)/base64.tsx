import { CopyButton } from '#/components/copy-button'
import { DownloadButton } from '#/components/download-button'
import { EncoderLayout } from '#/components/encoder-layout'
import { FileUpload } from '#/components/file-upload'
import { Button } from '#/components/ui/button'
import { Icon } from '#/components/ui/icon'
import { Switch } from '#/components/ui/switch'
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { createRoute } from 'solid-file-router'
import { createMemo, createSignal, Show } from 'solid-js'
import { toast } from 'solid-sonner'

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
  const encodeToBase64 = (input: string) => {
    try {
      return btoa(input)
    } catch {
      toast.error('Invalid input for encoding')
      return ''
    }
  }

  const decodeFromBase64 = (input: string) => {
    try {
      return atob(input)
    } catch {
      toast.error('Invalid Base64 string')
      return ''
    }
  }

  return (
    <Tabs defaultValue="text" class="w-full">
      <TabsList>
        <TabsTrigger value="text">Text Mode</TabsTrigger>
        <TabsTrigger value="file">File Mode</TabsTrigger>
        <TabsIndicator />
      </TabsList>

      <TabsContent value="text">
        <EncoderLayout
          onEncode={encodeToBase64}
          onDecode={decodeFromBase64}
          inputPlaceholder="Enter text to encode or Base64 to decode..."
          outputLabel="Base64 Output"
          outputPlaceholder="Encoded or decoded text will appear here..."
        />
      </TabsContent>

      <TabsContent value="file">
        <FileMode />
      </TabsContent>
    </Tabs>
  )
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onloadend = () => {
      const dataURL = reader.result as string
      resolve(dataURL)
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}

function FileMode() {
  const [file, setFile] = createSignal<File | undefined>()
  const [output, setOutput] = createSignal('')
  const [includeDataURL, setIncludeDataURL] = createSignal(false)

  const targetOutput = createMemo(() => includeDataURL() ? output() : output().split(',')[1])

  const processFile = async (file: File) => {
    try {
      setFile(file)
      const text = await fileToBase64(file)
      setOutput(text)
    } catch {
      toast.error('Failed to encode file')
      setOutput('')
    }
  }

  return (
    <div class="space-y-8">
      <div class="space-y-4">
        <FileUpload
          file={file()}
          setFile={processFile}
          icon="lucide:file"
          info="Upload any file to encode to Base64"
        />
        <Show when={file()}>
          <div class="p-4 border rounded-lg bg-input/50 flex flex-wrap gap-4 w-fit items-center">
            <span>{file()?.name}</span>
            <Button
              variant="destructive"
              onClick={() => {
                setFile(undefined)
                setOutput('')
              }}
              disabled={!file() && !output()}
            >
              <Icon name="lucide:trash-2" class="mr-2" />
              Clear
            </Button>
          </div>
        </Show>
      </div>

      <Show when={output()}>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg text-foreground font-semibold">
              Base64 Output
            </h3>
            <div class="flex gap-4">
              <Switch
                checked={includeDataURL()}
                onChange={setIncludeDataURL}
                text="Include Data URL prefix"
              />
              <CopyButton content={targetOutput()} variant="secondary" size="sm" />
              <DownloadButton
                content={targetOutput()}
                filename={`${file()!.name}.base64.txt`}
                variant="secondary"
                size="sm"
              />
            </div>
          </div>
          <div class="text-sm font-mono p-4 border rounded-md bg-muted/50 max-h-96 break-all of-y-auto">
            {targetOutput()}
          </div>
        </div>
      </Show>
    </div>
  )
}
