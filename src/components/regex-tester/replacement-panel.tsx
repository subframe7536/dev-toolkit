import { Field, Button, Icon, Input } from 'moraine'
import { createMemo, Show } from 'solid-js'

import { useRegexContext } from '#/contexts/regex-context'

export function ReplacementPanel() {
  const { store, actions } = useRegexContext()

  const hasInput = createMemo(() => store.pattern && store.testText)
  const hasMatches = createMemo(() => store.matches.length > 0)
  const replacementResult = createMemo(() => store.replacementResult)

  const handleApplyReplace = () => {
    const result = actions.applyReplacement()
    actions.setTestText(result)
  }

  const handleCopyResult = async () => {
    const result = replacementResult()
    if (result) {
      await navigator.clipboard.writeText(result.result)
    }
  }

  return (
    <div class="p-4 space-y-4">
      {/* Replacement Pattern Input */}
      <Field
        label="Replacement Pattern"
        classes={{ root: 'min-w-0', label: 'font-medium text-sm' }}
      >
        <Input
          placeholder="Enter replacement (e.g., $1-$2 or $<name>)"
          classes={{ root: 'font-mono' }}
          value={store.replacementPattern}
          onValueChange={(v) => actions.setReplacementPattern(v)}
        />
      </Field>

      {/* Syntax Help */}
      <div class="text-muted-foreground space-y-1 text-xs">
        <div class="font-medium mb-1">Replacement syntax:</div>
        <div class="gap-x-4 gap-y-1 grid grid-cols-2">
          <span>
            <code class="px-1 rounded bg-muted">$1, $2</code> - Capture groups
          </span>
          <span>
            <code class="px-1 rounded bg-muted">$&amp;</code> - Full match
          </span>
          <span>
            <code class="px-1 rounded bg-muted">$&lt;name&gt;</code> - Named group
          </span>
          <span>
            <code class="px-1 rounded bg-muted">$$</code> - Literal $
          </span>
        </div>
      </div>

      {/* Result Preview */}
      <Show
        when={hasInput() && store.isValid}
        fallback={
          <div class="text-muted-foreground py-8 text-center text-sm">
            Enter a pattern and test text to see replacements
          </div>
        }
      >
        <Show
          when={hasMatches()}
          fallback={
            <div
              class="text-amber-600 p-3 border border-amber-200 bg-amber-50 text-sm rounded-md dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950/30"
              role="status"
            >
              <Icon name="i-lucide-info" class="mr-2 size-4 inline-block" aria-hidden="true" />
              No matches to replace
            </div>
          }
        >
          <div class="space-y-3">
            {/* Stats */}
            <Show when={replacementResult()}>
              {(result) => (
                <div
                  class="text-muted-foreground flex gap-2 items-center text-xs"
                  aria-live="polite"
                >
                  <Icon name="i-lucide-repeat" class="size-3" aria-hidden="true" />
                  {result().replacementCount} replacement
                  {result().replacementCount !== 1 ? 's' : ''}
                  {store.flags.global ? ' (global)' : ' (first match only)'}
                </div>
              )}
            </Show>

            {/* Preview Output */}
            <div class="space-y-2">
              <h3 class="text-muted-foreground text-xs">Result Preview</h3>
              <div class="border bg-muted/50 max-h-64 overflow-auto rounded-md">
                <pre class="font-mono p-3 whitespace-pre-wrap break-words text-sm" tabIndex={0}>
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
                leading="i-lucide-copy"
              >
                Copy Result
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleApplyReplace}
                disabled={!replacementResult() || replacementResult()?.replacementCount === 0}
                aria-label="Apply replacement to test text"
                leading="i-lucide-check"
              >
                Apply to Test Text
              </Button>
            </div>
          </div>
        </Show>
      </Show>
    </div>
  )
}
