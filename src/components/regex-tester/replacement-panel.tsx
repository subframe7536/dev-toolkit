import { Button } from '#/components/ui/button'
import Icon from '#/components/ui/icon'
import { TextField, TextFieldInput, TextFieldLabel } from '#/components/ui/text-field'
import { useRegexContext } from '#/contexts/regex-context'
import { createMemo, Show } from 'solid-js'

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
      <TextField value={store.replacementPattern} onChange={v => actions.setReplacementPattern(v)}>
        <TextFieldLabel>Replacement Pattern</TextFieldLabel>
        <TextFieldInput
          placeholder="Enter replacement (e.g., $1-$2 or $<name>)"
          class="font-mono"
        />
      </TextField>

      {/* Syntax Help */}
      <div class="text-xs text-muted-foreground space-y-1">
        <div class="font-medium mb-1">Replacement syntax:</div>
        <div class="gap-x-4 gap-y-1 grid grid-cols-2">
          <span><code class="px-1 rounded bg-muted">$1, $2</code> - Capture groups</span>
          <span><code class="px-1 rounded bg-muted">$&amp;</code> - Full match</span>
          <span><code class="px-1 rounded bg-muted">$&lt;name&gt;</code> - Named group</span>
          <span><code class="px-1 rounded bg-muted">$$</code> - Literal $</span>
        </div>
      </div>

      {/* Result Preview */}
      <Show
        when={hasInput() && store.isValid}
        fallback={(
          <div class="text-sm text-muted-foreground py-8 text-center">
            Enter a pattern and test text to see replacements
          </div>
        )}
      >
        <Show
          when={hasMatches()}
          fallback={(
            <div
              class="text-sm text-amber-600 p-3 border border-amber-200 rounded-md bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950/30"
              role="status"
            >
              <Icon name="lucide:info" class="mr-2 size-4 inline-block" aria-hidden="true" />
              No matches to replace
            </div>
          )}
        >
          <div class="space-y-3">
            {/* Stats */}
            <Show when={replacementResult()}>
              {result => (
                <div class="text-xs text-muted-foreground flex gap-2 items-center" aria-live="polite">
                  <Icon name="lucide:repeat" class="size-3" aria-hidden="true" />
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
              <label class="text-xs text-muted-foreground">Result Preview</label>
              <div class="border rounded-md bg-muted/50 max-h-64 overflow-auto">
                <pre
                  class="text-sm font-mono p-3 whitespace-pre-wrap break-words"
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
                <Icon name="lucide:copy" class="mr-1 size-4" aria-hidden="true" />
                Copy Result
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleApplyReplace}
                disabled={!replacementResult() || replacementResult()?.replacementCount === 0}
                aria-label="Apply replacement to test text"
              >
                <Icon name="lucide:check" class="mr-1 size-4" aria-hidden="true" />
                Apply to Test Text
              </Button>
            </div>
          </div>
        </Show>
      </Show>
    </div>
  )
}
