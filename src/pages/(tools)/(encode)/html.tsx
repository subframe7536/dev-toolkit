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
    title: 'HTML Entity Encoder/Decoder',
    description: 'Encode and decode HTML entities',
    category: 'Encoding',
    icon: 'lucide:code',
    tags: ['html', 'entities', 'encode', 'decode', 'escape'],
  },
  component: HTMLEncoder,
})

function HTMLEncoder() {
  const [input, setInput] = createSignal('')
  const [output, setOutput] = createSignal('')

  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;',
  }

  const htmlEntitiesReverse: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': '\'',
    '&apos;': '\'',
  }

  const encodeToHTML = () => {
    try {
      const encoded = input().replace(/[&<>"']/g, char => htmlEntities[char] || char)
      setOutput(encoded)
      toast.success('Encoded to HTML entities')
    } catch {
      toast.error('Invalid input for encoding')
      setOutput('')
    }
  }

  const decodeFromHTML = () => {
    try {
      let decoded = input()
      // Decode named entities
      Object.entries(htmlEntitiesReverse).forEach(([entity, char]) => {
        decoded = decoded.replace(new RegExp(entity, 'g'), char)
      })
      // Decode numeric entities (&#123; and &#x7B;)
      decoded = decoded.replace(/&#(\d+);/g, (_, dec) =>
        String.fromCharCode(Number.parseInt(dec, 10)))
      decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
        String.fromCharCode(Number.parseInt(hex, 16)))
      setOutput(decoded)
      toast.success('Decoded from HTML entities')
    } catch {
      toast.error('Invalid HTML entity string')
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
            placeholder="Enter text to encode or HTML entities to decode..."
            value={input()}
            onInput={e => setInput(e.currentTarget.value)}
          />
        </TextField>
        <div class="flex gap-2">
          <Button onClick={encodeToHTML} disabled={!input()}>
            Encode to HTML
          </Button>
          <Button variant="secondary" onClick={decodeFromHTML} disabled={!input()}>
            Decode from HTML
          </Button>
          <Button variant="secondary" onClick={clear} disabled={!input() && !output()}>
            Clear
          </Button>
        </div>
      </div>

      <div class="space-y-4">
        <TextField>
          <TextFieldLabel>HTML Output</TextFieldLabel>
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
