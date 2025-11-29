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
    title: 'Hex Encoder/Decoder',
    description: 'Encode and decode hexadecimal strings',
    category: 'Encoding',
    icon: 'lucide:hash',
    tags: ['hex', 'hexadecimal', 'encode', 'decode'],
  },
  component: HexEncoder,
})

function HexEncoder() {
  const [input, setInput] = createSignal('')
  const [output, setOutput] = createSignal('')

  const encodeToHex = () => {
    try {
      const hex = Array.from(input())
        .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
      setOutput(hex)
      toast.success('Encoded to Hex')
    } catch {
      toast.error('Invalid input for encoding')
      setOutput('')
    }
  }

  const decodeFromHex = () => {
    try {
      const cleaned = input().replace(/[^0-9a-f]/gi, '')
      if (cleaned.length % 2 !== 0) {
        throw new Error('Invalid hex string length')
      }
      const decoded = cleaned.match(/.{2}/g)
        ?.map(byte => String.fromCharCode(Number.parseInt(byte, 16)))
        .join('') || ''
      setOutput(decoded)
      toast.success('Decoded from Hex')
    } catch {
      toast.error('Invalid hexadecimal string')
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
            placeholder="Enter text to encode or hex to decode..."
            value={input()}
            onInput={e => setInput(e.currentTarget.value)}
          />
        </TextField>
        <div class="flex gap-2">
          <Button onClick={encodeToHex} disabled={!input()}>
            Encode to Hex
          </Button>
          <Button variant="secondary" onClick={decodeFromHex} disabled={!input()}>
            Decode from Hex
          </Button>
          <Button variant="secondary" onClick={clear} disabled={!input() && !output()}>
            Clear
          </Button>
        </div>
      </div>

      <div class="space-y-4">
        <TextField>
          <TextFieldLabel>Hex Output</TextFieldLabel>
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
