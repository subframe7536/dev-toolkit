import { Button } from '#/components/ui/button'
import {
  TextField,
  TextFieldLabel,
  TextFieldTextArea,
} from '#/components/ui/text-field'
import { copyToClipboard } from '#/utils/download'
import { createRoute } from 'solid-file-router'
import { createSignal } from 'solid-js'
import { toast } from 'solid-sonner'

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
  const [input, setInput] = createSignal('')
  const [output, setOutput] = createSignal('')

  const encodeToURL = () => {
    try {
      const encoded = encodeURIComponent(input())
      setOutput(encoded)
      toast.success('Encoded to URL')
    } catch {
      toast.error('Invalid input for encoding')
      setOutput('')
    }
  }

  const decodeFromURL = () => {
    try {
      const decoded = decodeURIComponent(input())
      setOutput(decoded)
      toast.success('Decoded from URL')
    } catch {
      toast.error('Invalid URL-encoded string')
      setOutput('')
    }
  }

  const clear = () => {
    setInput('')
    setOutput('')
  }

  const handleCopy = async () => {
    if (!output()) {
      return
    }
    await copyToClipboard(output())
  }

  return (
    <div class="gap-6 grid lg:grid-cols-2">
      <div class="space-y-4">
        <TextField>
          <TextFieldLabel>Input Text</TextFieldLabel>
          <TextFieldTextArea
            class="text-sm font-mono h-64"
            placeholder="Enter text to encode or URL-encoded text to decode..."
            value={input()}
            onInput={e => setInput(e.currentTarget.value)}
          />
        </TextField>
        <div class="flex gap-2">
          <Button onClick={encodeToURL} disabled={!input()}>
            Encode to URL
          </Button>
          <Button variant="secondary" onClick={decodeFromURL} disabled={!input()}>
            Decode from URL
          </Button>
          <Button variant="secondary" onClick={clear} disabled={!input() && !output()}>
            Clear
          </Button>
        </div>
      </div>

      <div class="space-y-4">
        <TextField>
          <TextFieldLabel>URL Output</TextFieldLabel>
          <TextFieldTextArea
            class="text-sm font-mono bg-muted/50 h-64"
            readOnly
            placeholder="Encoded or decoded text will appear here..."
            value={output()}
          />
        </TextField>
        <div class="flex gap-2">
          <Button variant="secondary" onClick={handleCopy} disabled={!output()}>
            Copy
          </Button>
        </div>
      </div>
    </div>
  )
}
