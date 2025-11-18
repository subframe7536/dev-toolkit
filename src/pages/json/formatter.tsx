import { createRoute } from 'solid-file-router'
import { createSignal, Show } from 'solid-js'
import { formatJSON, minifyJSON, sortKeys, type JSONError } from '../../utils/json/formatter'

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
    if (!output()) return
    
    try {
      await navigator.clipboard.writeText(output())
      setSuccessMessage('Copied to clipboard!')
      setTimeout(() => setSuccessMessage(null), 2000)
    } catch (err) {
      setError({ message: 'Failed to copy to clipboard' })
    }
  }

  const handleDownload = () => {
    if (!output()) return

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
            <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="flex-1">
              <div class="text-sm text-red-800 dark:text-red-200 font-medium">
                Invalid JSON
              </div>
              <div class="text-sm text-red-700 dark:text-red-300 mt-1">
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
            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <div class="text-sm text-green-800 dark:text-green-200 font-medium">
              {successMessage()}
            </div>
          </div>
        </div>
      </Show>

      <div class="gap-6 grid lg:grid-cols-2">
        <div class="space-y-4">
          <div>
            <label class="text-sm text-foreground font-medium mb-2 block">
              Input JSON
            </label>
            <textarea
              class="text-sm font-mono p-4 border border-border rounded-md bg-background h-96 w-full resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Paste your JSON here..."
              value={input()}
              onInput={(e) => setInput(e.currentTarget.value)}
            />
          </div>
          <div class="flex gap-2 flex-wrap">
            <button 
              class="text-primary-foreground px-4 py-2 rounded-md bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleFormat}
              disabled={!input()}
            >
              Format
            </button>
            <button 
              class="text-secondary-foreground px-4 py-2 rounded-md bg-secondary hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleMinify}
              disabled={!input()}
            >
              Minify
            </button>
            <button 
              class="text-secondary-foreground px-4 py-2 rounded-md bg-secondary hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSortKeys}
              disabled={!input()}
            >
              Sort Keys
            </button>
            <button 
              class="text-secondary-foreground px-4 py-2 rounded-md bg-secondary hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleClear}
              disabled={!input() && !output()}
            >
              Clear
            </button>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="text-sm text-foreground font-medium mb-2 block">
              Output
            </label>
            <textarea
              class="text-sm font-mono p-4 border border-border rounded-md bg-muted/50 h-96 w-full resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              readOnly
              placeholder="Formatted JSON will appear here..."
              value={output()}
            />
          </div>
          <div class="flex gap-2 flex-wrap">
            <button 
              class="text-secondary-foreground px-4 py-2 rounded-md bg-secondary hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleCopy}
              disabled={!output()}
            >
              Copy
            </button>
            <button 
              class="text-secondary-foreground px-4 py-2 rounded-md bg-secondary hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleDownload}
              disabled={!output()}
            >
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
