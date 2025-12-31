import { Button } from '#/components/ui/button'
import { useRegexContext } from '#/contexts/regex-context'
import { createMemo, createUniqueId, Show } from 'solid-js'

/**
 * ReplacementPanel - Provides search and replace functionality
 * Supports capture group references ($1, $2, $<name>) and special replacements
 */
export function ReplacementPanel() {
  const { store, actions } = useRegexContext()

  const hasInput = createMemo(() => store.pattern && store.testText && store.isValid)
  const replacementResult = createMemo(() => store.replacementResult)
  const hasMatches = createMemo(() => store.matches.length > 0)

  const replacementInputId = createUniqueId()
  const previewToggleId = createUniqueId()

  const handleCopyResult = async () => {
    const result = replacementResult()
    if (result) {
      await navigator.clipboard.writeText(result.result)
    }
  }

  const handleApplyToTestText = () => {
    const result = actions.applyReplacement()
    actions.setTestText(result)
  }

  return (
    <div class="p-4 border rounded-lg bg-card" role="region" aria-labelledby="replacement-heading">
      <div class="mb-3 flex items-center justify-between">
        <h3 id="replacement-heading" class="text-sm font-medium flex gap-2 items-center">
          <span class="i-lucide-replace size-4" aria-hidden="true" />
          Replace
        </h3>
        <Show when={store.showReplacementPreview}>
          <span class="text-xs text-muted-foreground" aria-live="polite">Preview enabled</span>
        </Show>
      </div>

      {/* Replacement Pattern Input */}
      <div class="mb-4 space-y-2">
        <label for={replacementInputId} class="text-xs text-muted-foreground">Replacement Pattern</label>
        <input
          id={replacementInputId}
          type="text"
          placeholder="Enter replacement (e.g., $1-$2 or $<name>)"
          class="text-sm font-mono px-3 py-2 border border-input rounded-md bg-background w-full focus:(outline-none ring-2 ring-ring)"
          value={store.replacementPattern}
          onInput={e => actions.setReplacementPattern(e.currentTarget.value)}
          aria-describedby="replacement-syntax-help"
        />
      </div>

      {/* Replacement Syntax Help */}
      <div id="replacement-syntax-help" class="text-xs text-muted-foreground mb-4 space-y-1">
        <div class="font-medium mb-1">Replacement syntax:</div>
        <div class="gap-x-4 gap-y-1 grid grid-cols-2">
          <span><code class="px-1 rounded bg-muted">$1, $2</code> - Capture groups</span>
          <span><code class="px-1 rounded bg-muted">$&amp;</code> - Full match</span>
          <span><code class="px-1 rounded bg-muted">$&lt;name&gt;</code> - Named group</span>
          <span><code class="px-1 rounded bg-muted">$$</code> - Literal $</span>
        </div>
      </div>

      {/* Preview Toggle */}
      <div class="mb-4 flex gap-2 items-center">
        <button
          id={previewToggleId}
          type="button"
          class={`rounded-full inline-flex h-5 w-9 transition-colors items-center relative focus:(outline-none ring-2 ring-ring ring-offset-2) ${
            store.showReplacementPreview ? 'bg-primary' : 'bg-input'
          }`}
          onClick={() => actions.toggleReplacementPreview(!store.showReplacementPreview)}
          role="switch"
          aria-checked={store.showReplacementPreview}
          aria-label="Show replacement preview"
        >
          <span
            class={`rounded-full bg-background h-4 w-4 inline-block shadow transform transition-transform ${
              store.showReplacementPreview ? 'translate-x-4.5' : 'translate-x-0.5'
            }`}
            aria-hidden="true"
          />
        </button>
        <label for={previewToggleId} class="text-sm cursor-pointer">Show preview</label>
      </div>

      {/* Replacement Result Preview */}
      <Show when={store.showReplacementPreview && hasInput()}>
        <Show
          when={hasMatches()}
          fallback={(
            <div
              class="text-sm text-amber-600 p-3 border border-amber-200 rounded-md bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950/30"
              role="status"
            >
              <span class="i-lucide-info mr-2 size-4 inline-block" aria-hidden="true" />
              No matches to replace
            </div>
          )}
        >
          <div class="space-y-3">
            {/* Stats */}
            <Show when={replacementResult()}>
              {result => (
                <div class="text-xs text-muted-foreground flex gap-2 items-center" aria-live="polite">
                  <span class="i-lucide-repeat size-3" aria-hidden="true" />
                  {result().replacementCount}
                  {' '}
                  replacement
                  {result().replacementCount !== 1 ? 's' : ''}
                  {store.flags.global ? ' (global)' : ' (first match only)'}
                </div>
              )}
            </Show>

            {/* Preview Output */}
            <div class="space-y-2">
              <label id="preview-label" class="text-xs text-muted-foreground">Result Preview</label>
              <div class="relative">
                <pre
                  class="text-sm font-mono p-3 border border-input rounded-md bg-muted/50 max-h-48 whitespace-pre-wrap break-words overflow-auto"
                  aria-labelledby="preview-label"
                  tabIndex={0}
                >
                  {replacementResult()?.result || store.testText}
                </pre>
              </div>
            </div>

            {/* Action Buttons */}
            <div class="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopyResult}
                disabled={!replacementResult()}
                aria-label="Copy replacement result to clipboard"
              >
                <span class="i-lucide-copy mr-1 size-4" aria-hidden="true" />
                Copy Result
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleApplyToTestText}
                disabled={!replacementResult() || replacementResult()?.replacementCount === 0}
                aria-label="Apply replacement to test text"
              >
                <span class="i-lucide-check mr-1 size-4" aria-hidden="true" />
                Apply to Test Text
              </Button>
            </div>
          </div>
        </Show>
      </Show>

      {/* No input message */}
      <Show when={!hasInput() && !store.showReplacementPreview}>
        <div class="text-sm text-muted-foreground py-4 text-center">
          Enter a pattern and test text, then enable preview to see replacements
        </div>
      </Show>
    </div>
  )
}
