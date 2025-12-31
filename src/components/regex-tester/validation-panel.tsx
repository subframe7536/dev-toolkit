import type { ValidationMode } from '#/utils/regex/types'

import { useRegexContext } from '#/contexts/regex-context'
import { createMemo, Show } from 'solid-js'

/**
 * ValidationPanel - Provides validation modes for testing regex patterns
 * Supports "contains match" vs "full string match" validation
 */
export function ValidationPanel() {
  const { store, actions } = useRegexContext()

  const hasInput = createMemo(() => store.pattern && store.testText && store.isValid)
  const validationResult = createMemo(() => store.validationResult)

  const handleModeChange = (mode: ValidationMode) => {
    actions.setValidationMode(mode)
  }

  // Handle keyboard navigation for mode buttons
  const handleKeyDown = (e: KeyboardEvent, mode: ValidationMode) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleModeChange(mode)
    }
  }

  return (
    <div class="p-4" role="region" aria-labelledby="validation-heading">
      <div class="mb-3 flex items-center justify-between">
        <h3 id="validation-heading" class="text-sm font-medium flex gap-2 items-center">
          <span class="i-lucide-check-circle size-4" aria-hidden="true" />
          Validation
        </h3>
      </div>

      {/* Validation Mode Toggle */}
      <div class="mb-4 flex gap-2" role="radiogroup" aria-label="Validation mode">
        <button
          type="button"
          role="radio"
          aria-checked={store.validationMode === 'contains'}
          class={`text-sm px-3 py-2 border rounded-md flex-1 transition-colors focus:(outline-none ring-2 ring-ring ring-offset-1) ${
            store.validationMode === 'contains'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background border-input hover:bg-muted'
          }`}
          onClick={() => handleModeChange('contains')}
          onKeyDown={e => handleKeyDown(e, 'contains')}
        >
          Contains Match
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={store.validationMode === 'fullMatch'}
          class={`text-sm px-3 py-2 border rounded-md flex-1 transition-colors focus:(outline-none ring-2 ring-ring ring-offset-1) ${
            store.validationMode === 'fullMatch'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background border-input hover:bg-muted'
          }`}
          onClick={() => handleModeChange('fullMatch')}
          onKeyDown={e => handleKeyDown(e, 'fullMatch')}
        >
          Full String Match
        </button>
      </div>

      {/* Mode Description */}
      <div class="text-xs text-muted-foreground mb-4" id="validation-mode-description">
        <Show
          when={store.validationMode === 'contains'}
          fallback={(
            <span>
              <span class="i-lucide-info mr-1 size-3 inline-block" aria-hidden="true" />
              Pattern must match the entire text (equivalent to ^pattern$)
            </span>
          )}
        >
          <span>
            <span class="i-lucide-info mr-1 size-3 inline-block" aria-hidden="true" />
            Pattern must match somewhere in the text
          </span>
        </Show>
      </div>

      {/* Validation Result */}
      <Show when={hasInput() && validationResult()}>
        {result => (
          <div
            class={`p-3 border rounded-md flex gap-3 items-start ${
              result().passed
                ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
                : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800'
            }`}
            role="status"
            aria-live="polite"
          >
            <span
              class={`flex-shrink-0 size-5 ${
                result().passed
                  ? 'i-lucide-check-circle text-green-600 dark:text-green-400'
                  : 'i-lucide-x-circle text-red-600 dark:text-red-400'
              }`}
              aria-hidden="true"
            />
            <div class="flex-1 min-w-0">
              <div
                class={`text-sm font-medium ${
                  result().passed
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-red-700 dark:text-red-300'
                }`}
              >
                {result().passed ? 'Validation Passed' : 'Validation Failed'}
              </div>
              <div
                class={`text-xs mt-1 ${
                  result().passed
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {result().message}
              </div>

              {/* Show fail position indicator */}
              <Show when={!result().passed && result().failPosition !== undefined}>
                <div class="text-xs text-muted-foreground mt-2">
                  <span class="i-lucide-map-pin mr-1 size-3 inline-block" aria-hidden="true" />
                  Failure at position
                  {' '}
                  {result().failPosition}
                </div>
              </Show>
            </div>
          </div>
        )}
      </Show>

      {/* No input message */}
      <Show when={!hasInput()}>
        <div class="text-sm text-muted-foreground py-4 text-center">
          Enter a pattern and test text to validate
        </div>
      </Show>
    </div>
  )
}
