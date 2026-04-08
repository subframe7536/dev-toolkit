import type { JSONError } from '#/utils/json/formatter'
import type { CaseStyle } from '#/utils/json/key-converter'

import { ClearButton } from '#/components/clear-button'
import { CopyButton } from '#/components/copy-button'
import { DownloadButton } from '#/components/download-button'
import { Button, Icon, Select, Slider, Switch, Textarea } from 'moraine'
import { formatJSON, formatJSONWithNested, repairJSON, sortKeys } from '#/utils/json/formatter'
import { convertKeys } from '#/utils/json/key-converter'
import { createRoute } from 'solid-file-router'
import { createEffect, createSignal, on, Show } from 'solid-js'
import { toast } from 'solid-toaster'

export default createRoute({
  info: {
    title: 'JSON Formatter',
    description: 'Format, minify, sort, and convert JSON keys with automatic repair',
    category: 'JSON',
    icon: 'lucide:braces',
    tags: ['json', 'formatter', 'minify', 'beautify', 'camelCase', 'snake_case', 'kebab-case', 'naming'],
  },
  component: JSONFormatter,
})

const caseOptions: Array<{ value: CaseStyle, label: string }> = [
  { value: 'As is', label: 'Keep Current' },
  { value: 'camelCase', label: 'camelCase' },
  { value: 'snake_case', label: 'snake_case' },
  { value: 'kebab-case', label: 'kebab-case' },
  { value: 'PascalCase', label: 'PascalCase' },
  { value: 'CONSTANT_CASE', label: 'CONSTANT_CASE' },
  { value: 'lowercase', label: 'lowercase' },
  { value: 'UPPERCASE', label: 'UPPERCASE' },
]

function JSONFormatter() {
  const [input, setInput] = createSignal('')
  const [output, setOutput] = createSignal('')
  const [autoRepair, setAutoRepair] = createSignal(true)
  const [shouldSortKeys, setShouldSortKeys] = createSignal(false)
  const [parseNested, setParseNested] = createSignal(false)
  const [targetCase, setTargetCase] = createSignal<CaseStyle>('As is')
  const [indent, setIndent] = createSignal(2)
  const [isFullscreen, setIsFullscreen] = createSignal(false)

  const tryRepairIfEnabled = (inputValue: string): string => {
    if (autoRepair()) {
      try {
        JSON.parse(inputValue)
        return inputValue
      } catch {
        try {
          return repairJSON(inputValue)
        } catch {
          // Repair failed, continue with original input
        }
      }
    }
    return inputValue
  }

  const processJSON = () => {
    const inputValue = input().trim()
    if (!inputValue) {
      setOutput('')
      return
    }

    try {
      const repairedInput = tryRepairIfEnabled(inputValue)

      const indentSize = indent()

      // Apply key case conversion if needed
      if (targetCase() !== 'As is') {
        const result = convertKeys(repairedInput, targetCase(), false)
        if (result.success && result.output) {
          const formatted = parseNested()
            ? formatJSONWithNested(result.output, { sortKeys: shouldSortKeys(), indent: indentSize })
            : shouldSortKeys() ? sortKeys(result.output, indentSize) : formatJSON(result.output, { indent: indentSize })
          setOutput(formatted)
          return
        }
      }

      // Apply nested parsing if enabled
      if (parseNested()) {
        const formatted = formatJSONWithNested(repairedInput, { sortKeys: shouldSortKeys(), indent: indentSize })
        setOutput(formatted)
        return
      }

      // Apply sort keys if enabled
      const formatted = shouldSortKeys() ? sortKeys(repairedInput, indentSize) : formatJSON(repairedInput, { indent: indentSize })
      setOutput(formatted)
    } catch (err) {
      const error = err as JSONError
      const message = error.line && error.column
        ? `${error.message} (Line ${error.line}, Column ${error.column})`
        : error.message
      toast.error('Invalid JSON', { description: message })
      setOutput('')
    }
  }

  // Auto-format on input change
  createEffect(on([input, shouldSortKeys, parseNested, targetCase, autoRepair, indent], () => {
    processJSON()
  }))

  const handleClear = () => {
    setInput('')
    setOutput('')
  }

  return (
    <div class="space-y-6">
      <div class="flex flex-wrap gap-8">
        <div class="space-y-4">
          <div class="text-sm font-medium">Options</div>
          <div class="flex flex-wrap gap-4">
            <Switch checked={autoRepair()} onChange={setAutoRepair} label="Auto repair JSON string" />
            <Switch checked={shouldSortKeys()} onChange={setShouldSortKeys} label="Sort Keys" />
            <Switch checked={parseNested()} onChange={setParseNested} label="Parse Nested JSON" />
          </div>
        </div>
        <div class="space-y-4">
          <div class="text-sm font-medium">Key Case</div>
          <Select
            value={targetCase()}
            onChange={setTargetCase}
            options={caseOptions}
            disallowEmptySelection
            classes={{ root: 'w-50' }}
          />
        </div>
        <div class="max-w-120 min-w-80">
          <label class="text-sm font-medium">Indent Size</label>
          <Slider
            value={[indent()]}
            onChange={value => setIndent(value[0])}
            min={2}
            max={8}
            step={2}
          />
        </div>
      </div>

      <div class="gap-6 grid lg:grid-cols-2">
        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium">Input JSON</label>
            <Textarea
              classes={{ input: 'text-sm font-mono h-96 resize-none' }}
              placeholder="Paste your JSON here..."
              value={input()}
              onInput={e => setInput(e.currentTarget.value)}
            />
          </div>
          <ClearButton
            onClear={handleClear}
            disabled={!input() && !output()}
          />
        </div>

        <div class="space-y-4">
          <div class="flex-1 relative">
            <label class="text-sm font-medium">Output</label>
            <Button
              variant="secondary"
              size="icon"
              classes={{ root: ['right-2 top-9 absolute', !output() && 'hidden'] }}
              onClick={() => setIsFullscreen(true)}
            >
              <Icon name="lucide:maximize-2" />
            </Button>
            <Textarea
              classes={{ input: 'text-sm font-mono bg-muted/50 h-96 resize-none' }}
              readOnly
              placeholder="Formatted JSON will appear here..."
              value={output()}
            />
          </div>
          <div class="flex gap-2">
            <CopyButton
              content={output()}
              variant="secondary"
              disabled={!output()}
            />
            <DownloadButton
              content={output()}
              filename="formatted.json"
              mimeType="application/json"
              variant="secondary"
              disabled={!output()}
            />
          </div>
        </div>
      </div>
      <Show when={isFullscreen()}>
        <div class="p-4 bg-background/95 flex flex-col gap-4 inset-0 fixed z-50 overflow-hidden">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">Formatted JSON (Fullscreen)</h2>
            <button class="py-1 rounded size-7 hover:bg-primary/90" onClick={() => setIsFullscreen(false)}>
              <Icon name="lucide:x" />
            </button>
          </div>
          <div class="flex-1">
            <label class="text-sm font-medium">Output</label>
            <Textarea
              classes={{ input: 'text-sm font-mono bg-muted/50 h-full resize-none' }}
              readOnly
              value={output()}
            />
          </div>
        </div>
      </Show>
    </div>
  )
}
