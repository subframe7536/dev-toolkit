import type { JSONError } from '#/utils/json/formatter'

import { Button } from '#/components/ui/button'
import Icon from '#/components/ui/icon'
import {
  TextField,
  TextFieldLabel,
  TextFieldTextArea,
} from '#/components/ui/text-field'
import { createRoute } from 'solid-file-router'
import { createSignal, Show } from 'solid-js'

import { formatJSON, minifyJSON, sortKeys } from '../../utils/json/formatter'

export default createRoute({
  info: {
    title: 'JSON Formatter',
    description: 'Format, minify, and sort JSON data with error detection',
    category: 'JSON',
    icon: 'lucide:braces',
  },
  component: JSONFormatter,
})

function JSONFormatter() {
  const [input, setInput] = createSignal('')
  const [output, setOutput] = createSignal('')
  const [error, setError] = createSignal<JSONError | null>(null)
  const [successMessage, setSuccessMessage] = createSignal<string | null>(null)

  const handleFormat = () => {
    setError(null)
    setSuccessMessage(null)
    try {
      const formatted = formatJSON(input())
      setOutput(formatted)
    } catch (err) {
      setError(err as JSONError)
      setOutput('')
    }
  }

  const handleMinify = () => {
    setError(null)
    setSuccessMessage(null)
    try {
      const minified = minifyJSON(input())
      setOutput(minified)
    } catch (err) {
      setError(err as JSONError)
      setOutput('')
    }
  }

  const handleSortKeys = () => {
    setError(null)
    setSuccessMessage(null)
    try {
      const sorted = sortKeys(input())
      setOutput(sorted)
    } catch (err) {
      setError(err as JSONError)
      setOutput('')
    }
  }

  const handleClear = () => {
    setInput('')
    setOutput('')
    setError(null)
    setSuccessMessage(null)
  }

  const handleCopy = async () => {
    if (!output()) {
      return
    }

    try {
      await navigator.clipboard.writeText(output())
      setSuccessMessage('Copied to clipboard!')
      setTimeout(() => setSuccessMessage(null), 2000)
    } catch {
      setError({ message: 'Failed to copy to clipboard' })
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

    setSuccessMessage('Downloaded successfully!')
    setTimeout(() => setSuccessMessage(null), 2000)
  }

  return (
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl text-foreground font-bold">JSON Formatter</h1>
        <p class="text-muted-foreground mt-2">
          Format, minify, and sort JSON data with error detection
        </p>
      </div>

      <Show when={error()}>
        <div class="p-4 border border-red-500 rounded-md bg-red-50 dark:bg-red-950/20" role="alert">
          <div class="flex gap-2 items-start">
            <Icon name="lucide:alert-circle" class="text-red-500 mt-0.5 flex-shrink-0 h-5 w-5" />
            <div class="flex-1">
              <div class="text-sm text-red-800 font-medium dark:text-red-200">
                Invalid JSON
              </div>
              <div class="text-sm text-red-700 mt-1 dark:text-red-300">
                {error()?.message}
                <Show when={error()?.line && error()?.column}>
                  <div class="mt-1">
                    Location: Line {error()?.line}, Column {error()?.column}
                  </div>
                </Show>
              </div>
            </div>
          </div>
        </div>
      </Show>

      <Show when={successMessage()}>
        <div class="p-4 border border-green-500 rounded-md bg-green-50 dark:bg-green-950/20" role="status">
          <div class="flex gap-2 items-center">
            <Icon name="lucide:check-circle" class="text-green-500 h-5 w-5" />
            <div class="text-sm text-green-800 font-medium dark:text-green-200">
              {successMessage()}
            </div>
          </div>
        </div>
      </Show>

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
    </div>
  )
}
