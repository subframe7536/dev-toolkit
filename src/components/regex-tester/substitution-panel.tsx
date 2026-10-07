import { Icon } from 'moraine'
import { createMemo, createSignal, Show } from 'solid-js'
import { toast } from 'solid-toaster'

import { useRegexContext } from '#/contexts/regex-context'

export function SubstitutionPanel() {
  const { store, actions } = useRegexContext()
  const [cursorPos, setCursorPos] = createSignal({ line: 1, column: 1 })

  const replacementCount = createMemo(() => store.replacementResult?.replacementCount ?? 0)
  const resultText = createMemo(() => store.replacementResult?.result ?? store.testText)

  const handleCopyResult = async () => {
    if (resultText()) {
      await navigator.clipboard.writeText(resultText())
      toast.success('Substitution result copied to clipboard')
    }
  }

  const handleApplyToText = () => {
    const res = actions.applyReplacement()
    actions.setTestText(res)
    toast.success('Applied substitution to test string')
  }

  const updateCursorFromText = () => {
    const text = resultText()
    const lines = text.split('\n')
    setCursorPos({
      line: lines.length,
      column: (lines[lines.length - 1]?.length ?? 0) + 1,
    })
  }

  return (
    <div class="flex flex-col gap-1.5" role="region" aria-label="Substitution">
      {/* Header outside card */}
      <div class="flex items-center justify-between">
        <span class="text-sm text-foreground font-medium">Substitution</span>
        <div class="flex gap-1.5 items-center">
          <Show when={store.testText}>
            <span class="text-xs text-muted-foreground font-mono px-2 py-0.5 rounded bg-muted/70">
              {replacementCount()} {replacementCount() === 1 ? 'replacement' : 'replacements'}
            </span>
          </Show>
          <Show when={store.executionTime > 0}>
            <span class="text-xs text-muted-foreground font-mono px-2 py-0.5 rounded bg-muted/70">
              {store.executionTime < 1
                ? `${(store.executionTime * 1000).toFixed(0)} μs`
                : `${store.executionTime.toFixed(2)} ms`}
            </span>
          </Show>
        </div>
      </div>

      {/* Enclosed Box */}
      <div class="border border-border rounded-lg bg-card/60 flex flex-col overflow-hidden focus-within:(border-primary ring-1 ring-primary)">
        {/* Top input row */}
        <div class="p-2.5 border-b border-border/60 bg-muted/20 flex gap-2 items-center justify-between">
          <input
            type="text"
            class="text-sm text-foreground font-mono px-1 outline-none bg-transparent flex-1 placeholder:text-muted-foreground/60"
            placeholder="Substitution pattern (e.g. $1 or \1)..."
            value={store.replacementPattern}
            onInput={(e) => {
              actions.setReplacementPattern(e.currentTarget.value)
              updateCursorFromText()
            }}
          />
          <div class="flex shrink-0 gap-1 items-center">
            <button
              type="button"
              class="text-muted-foreground p-1 rounded cursor-pointer transition-colors hover:text-foreground disabled:opacity-40"
              title="Apply substitution to test string"
              onClick={handleApplyToText}
              disabled={!store.testText || replacementCount() === 0}
            >
              <Icon name="i-lucide-arrow-down-to-dot" class="size-4" />
            </button>
            <button
              type="button"
              class="text-muted-foreground p-1 rounded cursor-pointer transition-colors hover:text-foreground disabled:opacity-40"
              title="Copy substitution result"
              onClick={handleCopyResult}
              disabled={!resultText()}
            >
              <Icon name="i-lucide-copy" class="size-4" />
            </button>
          </div>
        </div>

        {/* Bottom preview area */}
        <div class="text-sm text-foreground/90 leading-relaxed font-mono p-3.5 max-h-72 min-h-[140px] select-text whitespace-pre-wrap break-all overflow-y-auto">
          <Show
            when={resultText()}
            fallback={
              <span class="text-muted-foreground/50 italic">
                Substitution result will appear here...
              </span>
            }
          >
            {resultText()}
          </Show>
        </div>

        {/* Status bar */}
        <div class="text-xs text-muted-foreground font-mono px-3.5 py-1 text-right border-t border-border/40 bg-muted/10 select-none">
          Line {cursorPos().line}, column {cursorPos().column}
        </div>
      </div>
    </div>
  )
}
