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
    title: 'Unicode Encoder/Decoder',
    description: 'Encode and decode Unicode escape sequences',
    category: 'Encoding',
    icon: 'lucide:globe',
    tags: ['unicode', 'encode', 'decode', 'escape'],
  },
  component: UnicodeEncoder,
})

function UnicodeEncoder() {
  const [input, setInput] = createSignal('')
  const [output, setOutput] = createSignal('')

  const encodeToUnicode = () => {
    try {
      const encoded = Array.from(input())
        .map((char) => {
          const code = char.charCodeAt(0)
          if (code > 127) {
            return `\\u${code.toString(16).padStart(4, '0')}`
          }
          return char
        })
        .join('')
      setOutput(encoded)
      toast.success('Encoded to Unicode')
    } catch {
      toast.error('Invalid input for encoding')
      setOutput('')
    }
  }

  const decodeFromUnicode = () => {
    try {
      const decoded = input().replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
        String.fromCharCode(Number.parseInt(hex, 16)))
      setOutput(decoded)
      toast.success('Decoded from Unicode')
    } catch {
      toast.error('Invalid Unicode escape sequence')
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
            placeholder="Enter text to encode or Unicode escape sequences to decode..."
            value={input()}
            onInput={e => setInput(e.currentTarget.value)}
          />
        </TextField>
        <div class="flex gap-2">
          <Button onClick={encodeToUnicode} disabled={!input()}>
            Encode to Unicode
          </Button>
          <Button variant="secondary" onClick={decodeFromUnicode} disabled={!input()}>
            Decode from Unicode
          </Button>
          <Button variant="secondary" onClick={clear} disabled={!input() && !output()}>
            Clear
          </Button>
        </div>
      </div>

      <div class="space-y-4">
        <TextField>
          <TextFieldLabel>Unicode Output</TextFieldLabel>
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
