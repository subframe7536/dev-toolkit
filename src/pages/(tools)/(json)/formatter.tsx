import type { JSONError } from '#/utils/json/formatter'

import { Button } from '#/components/ui/button'
import {
  TextField,
  TextFieldLabel,
  TextFieldTextArea,
} from '#/components/ui/text-field'
import { formatJSON, minifyJSON, sortKeys } from '#/utils/json/formatter'
import { createRoute } from 'solid-file-router'
import { createSignal } from 'solid-js'
import { toast } from 'solid-sonner'

export default createRoute({
  info: {
    title: 'JSON Formatter',
    description: 'Format, minify, and sort JSON data with error detection',
    category: 'JSON',
    icon: 'lucide:braces',
    tags: ['json', 'formatter', 'minify', 'beautify'],
  },
  component: JSONFormatter,
})

function JSONFormatter() {
  const [input, setInput] = createSignal('')
  const [output, setOutput] = createSignal('')

  const handleFormat = () => {
    try {
      const formatted = formatJSON(input())
      setOutput(formatted)
      toast.success('JSON formatted successfully')
    } catch (err) {
      const error = err as JSONError
      const message = error.line && error.column
        ? `${error.message} (Line ${error.line}, Column ${error.column})`
        : error.message
      toast.error('Invalid JSON', { description: message })
      setOutput('')
    }
  }

  const handleMinify = () => {
    try {
      const minified = minifyJSON(input())
      setOutput(minified)
      toast.success('JSON minified successfully')
    } catch (err) {
      const error = err as JSONError
      const message = error.line && error.column
        ? `${error.message} (Line ${error.line}, Column ${error.column})`
        : error.message
      toast.error('Invalid JSON', { description: message })
      setOutput('')
    }
  }

  const handleSortKeys = () => {
    try {
      const sorted = sortKeys(input())
      setOutput(sorted)
      toast.success('Keys sorted successfully')
    } catch (err) {
      const error = err as JSONError
      const message = error.line && error.column
        ? `${error.message} (Line ${error.line}, Column ${error.column})`
        : error.message
      toast.error('Invalid JSON', { description: message })
      setOutput('')
    }
  }

  const handleClear = () => {
    setInput('')
    setOutput('')
  }

  const handleCopy = async () => {
    if (!output()) {
      return
    }

    try {
      await navigator.clipboard.writeText(output())
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleDownload = () => {
    if (!output()) {
      return
    }

    const blob = new Blob([output()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'formatted.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('Downloaded successfully')
  }

  return (
    <div class="gap-6 grid lg:grid-cols-2">
      <div class="space-y-4">
        <TextField>
          <TextFieldLabel>Input JSON</TextFieldLabel>
          <TextFieldTextArea
            class="text-sm font-mono h-96"
            placeholder="Paste your JSON here..."
            value={input()}
            onInput={e => setInput(e.currentTarget.value)}
          />
        </TextField>
        <div class="flex flex-wrap gap-2">
          <Button
            onClick={handleFormat}
            disabled={!input()}
          >
            Format
          </Button>
          <Button
            variant="secondary"
            onClick={handleMinify}
            disabled={!input()}
          >
            Minify
          </Button>
          <Button
            variant="secondary"
            onClick={handleSortKeys}
            disabled={!input()}
          >
            Sort Keys
          </Button>
          <Button
            variant="secondary"
            onClick={handleClear}
            disabled={!input() && !output()}
          >
            Clear
          </Button>
        </div>
      </div>

      <div class="space-y-4">
        <TextField>
          <TextFieldLabel>Output</TextFieldLabel>
          <TextFieldTextArea
            class="text-sm font-mono bg-muted/50 h-96"
            readOnly
            placeholder="Formatted JSON will appear here..."
            value={output()}
          />
        </TextField>
        <div class="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={handleCopy}
            disabled={!output()}
          >
            Copy
          </Button>
          <Button
            variant="secondary"
            onClick={handleDownload}
            disabled={!output()}
          >
            Download
          </Button>
        </div>
      </div>
    </div>
  )
}
