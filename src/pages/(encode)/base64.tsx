import { Button } from '#/components/ui/button'
import {
  TextField,
  TextFieldLabel,
  TextFieldTextArea,
} from '#/components/ui/text-field'
import { createRoute } from 'solid-file-router'
import { createSignal } from 'solid-js'

export default createRoute({
  info: {
    title: 'Base64 Encoder/Decoder',
    description: 'Encode and decode Base64 strings',
    category: 'Encoding',
    icon: 'lucide:binary',
  },
  component: Base64Encoder,
})

function Base64Encoder() {
  const [input, setInput] = createSignal('')
  const [output, setOutput] = createSignal('')

  const encodeToBase64 = () => {
    try {
      const encoded = btoa(input())
      setOutput(encoded)
    } catch {
      setOutput('Error: Invalid input for encoding')
    }
  }

  const decodeFromBase64 = () => {
    try {
      const decoded = atob(input())
      setOutput(decoded)
    } catch {
      setOutput('Error: Invalid Base64 string')
    }
  }

  const clear = () => {
    setInput('')
    setOutput('')
  }

  const copyToClipboard = async () => {
    if (!output()) {
      return
    }
    try {
      await navigator.clipboard.writeText(output())
    } catch {
      console.error('Failed to copy to clipboard')
    }
  }

  return (
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl text-foreground font-bold">Base64 Encoder/Decoder</h1>
        <p class="text-muted-foreground mt-2">
          Encode and decode Base64 strings
        </p>
      </div>

      <div class="gap-6 grid lg:grid-cols-2">
        <div class="space-y-4">
          <TextField>
            <TextFieldLabel>Input Text</TextFieldLabel>
            <TextFieldTextArea
              class="text-sm font-mono h-64"
              placeholder="Enter text to encode or Base64 to decode..."
              value={input()}
              onInput={e => setInput(e.currentTarget.value)}
            />
          </TextField>
          <div class="flex gap-2">
            <Button onClick={encodeToBase64} disabled={!input()}>
              Encode to Base64
            </Button>
            <Button variant="secondary" onClick={decodeFromBase64} disabled={!input()}>
              Decode from Base64
            </Button>
            <Button variant="secondary" onClick={clear} disabled={!input() && !output()}>
              Clear
            </Button>
          </div>
        </div>

        <div class="space-y-4">
          <TextField>
            <TextFieldLabel>Base64 Output</TextFieldLabel>
            <TextFieldTextArea
              class="text-sm font-mono bg-muted/50 h-64"
              readOnly
              placeholder="Encoded or decoded text will appear here..."
              value={output()}
            />
          </TextField>
          <div class="flex gap-2">
            <Button variant="secondary" onClick={copyToClipboard} disabled={!output()}>
              Copy
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
