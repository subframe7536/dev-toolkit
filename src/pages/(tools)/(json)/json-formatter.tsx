import { Field, Button, Dialog, Select, Slider, Switch, Textarea } from 'moraine'
import { createRoute } from 'solid-file-router'
import { createEffect, createSignal, on } from 'solid-js'
import { toast } from 'solid-toaster'

import { ClearButton } from '#/components/clear-button'
import { CopyButton } from '#/components/copy-button'
import { DownloadButton } from '#/components/download-button'
import { ToolOptions } from '#/components/tool-options'
import type { JSONError } from '#/utils/json/formatter'
import { formatJSON, formatJSONWithNested, repairJSON, sortKeys } from '#/utils/json/formatter'
import type { CaseStyle } from '#/utils/json/key-converter'
import { convertKeys } from '#/utils/json/key-converter'

export default createRoute({
  info: {
    title: 'JSON Formatter',
    description: 'Format, minify, sort, and convert JSON keys with automatic repair',
    category: 'JSON',
    icon: 'i-lucide-braces',
    tags: [
      'json',
      'formatter',
      'minify',
      'beautify',
      'camelCase',
      'snake_case',
      'kebab-case',
      'naming',
    ],
  },
  component: JSONFormatter,
})

const caseOptions: Array<{ value: CaseStyle; label: string }> = [
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
            ? formatJSONWithNested(result.output, {
                sortKeys: shouldSortKeys(),
                indent: indentSize,
              })
            : shouldSortKeys()
              ? sortKeys(result.output, indentSize)
              : formatJSON(result.output, { indent: indentSize })
          setOutput(formatted)
          return
        }
      }

      // Apply nested parsing if enabled
      if (parseNested()) {
        const formatted = formatJSONWithNested(repairedInput, {
          sortKeys: shouldSortKeys(),
          indent: indentSize,
        })
        setOutput(formatted)
        return
      }

      // Apply sort keys if enabled
      const formatted = shouldSortKeys()
        ? sortKeys(repairedInput, indentSize)
        : formatJSON(repairedInput, { indent: indentSize })
      setOutput(formatted)
    } catch (err) {
      const error = err as JSONError
      const message =
        error.line && error.column
          ? `${error.message} (Line ${error.line}, Column ${error.column})`
          : error.message
      toast.error('Invalid JSON', { description: message })
      setOutput('')
    }
  }

  // Auto-format on input change
  createEffect(
    on([input, shouldSortKeys, parseNested, targetCase, autoRepair, indent], () => {
      processJSON()
    }),
  )

  const handleClear = () => {
    setInput('')
    setOutput('')
  }

  return (
    <div class="space-y-4">
      <div class="tool-editor-grid">
        <Field
          label="Input JSON"
          classes={{ root: 'min-w-0', label: 'text-muted-foreground font-medium text-xs' }}
        >
          <Textarea
            classes={{ root: 'tool-editor' }}
            placeholder="Paste your JSON here..."
            value={input()}
            onValueChange={setInput}
          />
        </Field>
        <Field
          label="Output"
          classes={{ root: 'min-w-0', label: 'text-muted-foreground font-medium text-xs' }}
        >
          <Textarea
            classes={{ root: 'tool-editor bg-muted/30' }}
            readOnly
            placeholder="Formatted JSON will appear here..."
            value={output()}
          />
        </Field>
      </div>
      <div class="tool-toolbar">
        <CopyButton
          text="Copy Output"
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
        <Button
          variant="ghost"
          disabled={!output()}
          leading="i-lucide-maximize-2"
          onClick={() => setIsFullscreen(true)}
        >
          Expand
        </Button>
        <ClearButton onClear={handleClear} disabled={!input() && !output()} />
      </div>
      <ToolOptions>
        <div class="tool-toolbar items-start">
          <div class="w-full">
            <div class="flex flex-wrap gap-3">
              <Field
                label="Auto repair JSON string"
                classes={{
                  root: 'flex flex-row-reverse gap-2 w-fit min-w-0 items-center',
                  label: 'font-normal',
                  container: 'mt-0! shrink-0',
                }}
              >
                <Switch checked={autoRepair()} onCheckedChange={setAutoRepair} />
              </Field>
              <Field
                label="Sort Keys"
                classes={{
                  root: 'flex flex-row-reverse gap-2 w-fit min-w-0 items-center',
                  label: 'font-normal',
                  container: 'mt-0! shrink-0',
                }}
              >
                <Switch checked={shouldSortKeys()} onCheckedChange={setShouldSortKeys} />
              </Field>
              <Field
                label="Parse Nested JSON"
                classes={{
                  root: 'flex flex-row-reverse gap-2 w-fit min-w-0 items-center',
                  label: 'font-normal',
                  container: 'mt-0! shrink-0',
                }}
              >
                <Switch checked={parseNested()} onCheckedChange={setParseNested} />
              </Field>
            </div>
          </div>
          <Field
            label="Key Case"
            classes={{ root: 'min-w-0 w-44', label: 'text-muted-foreground font-medium text-xs' }}
          >
            <Select
              value={targetCase()}
              onValueChange={(value) => {
                if (value !== null) {
                  setTargetCase(value)
                }
              }}
              items={caseOptions}
              classes={{ control: 'w-full' }}
            />
          </Field>
          <Field
            label="Indent Size"
            classes={{ root: 'min-w-0 w-44', label: 'text-muted-foreground font-medium text-xs' }}
          >
            <Slider
              value={[indent()]}
              onValueChange={(value) => setIndent(value[0])}
              min={2}
              max={8}
              step={2}
            />
          </Field>
        </div>
      </ToolOptions>
      <Dialog
        open={isFullscreen()}
        onOpenChange={setIsFullscreen}
        classes={{
          content: 'flex flex-col max-w-none w-[calc(100vw-2rem)] h-[calc(100dvh-2rem)] max-h-none',
          body: 'min-h-0 flex-1 flex flex-col',
        }}
      >
        <Dialog.Content title="Formatted JSON (Fullscreen)">
          <Dialog.Body>
            <Field
              label="Expanded JSON output"
              classes={{
                root: 'min-h-0 flex-1 flex flex-col',
                label: 'sr-only',
                container: 'mt-0! min-h-0 flex-1',
              }}
            >
              <Textarea
                classes={{
                  root: 'text-sm leading-relaxed font-mono bg-muted/30 min-h-0 flex-1 resize-none',
                }}
                readOnly
                value={output()}
              />
            </Field>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog>
    </div>
  )
}
