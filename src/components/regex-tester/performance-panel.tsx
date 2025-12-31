import type { PerformanceResult, PerformanceWarning } from '#/utils/regex/types'

import { useRegexContext } from '#/contexts/regex-context'
import { getOptimizationSuggestions } from '#/utils/regex/performance-analyzer'
import { createMemo, For, Show } from 'solid-js'

const WARNING_TYPE_ICONS: Record<PerformanceWarning['type'], string> = {
  backtracking: 'i-lucide-alert-triangle',
  timeout: 'i-lucide-clock',
  complexity: 'i-lucide-gauge',
}

const WARNING_TYPE_COLORS: Record<PerformanceWarning['type'], string> = {
  backtracking: 'text-red-600 dark:text-red-400',
  timeout: 'text-orange-600 dark:text-orange-400',
  complexity: 'text-yellow-600 dark:text-yellow-400',
}

function formatExecutionTime(ms: number): string {
  if (ms < 1) {
    return `${(ms * 1000).toFixed(0)}μs`
  }
  if (ms < 1000) {
    return `${ms.toFixed(2)}ms`
  }
  return `${(ms / 1000).toFixed(2)}s`
}

function getPerformanceRating(ms: number): { label: string, color: string } {
  if (ms < 1) {
    return { label: 'Excellent', color: 'text-green-600 dark:text-green-400' }
  }
  if (ms < 10) {
    return { label: 'Good', color: 'text-green-600 dark:text-green-400' }
  }
  if (ms < 100) {
    return { label: 'Acceptable', color: 'text-yellow-600 dark:text-yellow-400' }
  }
  if (ms < 1000) {
    return { label: 'Slow', color: 'text-orange-600 dark:text-orange-400' }
  }
  return { label: 'Very Slow', color: 'text-red-600 dark:text-red-400' }
}

function WarningItem(props: { warning: PerformanceWarning }) {
  return (
    <div class="p-2 border rounded-md bg-muted/30">
      <div class="flex gap-2 items-start">
        <span
          class={`${WARNING_TYPE_ICONS[props.warning.type]} mt-0.5 size-4 ${WARNING_TYPE_COLORS[props.warning.type]}`}
        />
        <div class="flex-1 min-w-0">
          <p class={`text-sm font-medium ${WARNING_TYPE_COLORS[props.warning.type]}`}>
            {props.warning.message}
          </p>
          <Show when={props.warning.suggestion}>
            <p class="text-xs text-muted-foreground mt-1">
              {props.warning.suggestion}
            </p>
          </Show>
        </div>
      </div>
    </div>
  )
}

function PerformanceMetrics(props: { result: PerformanceResult }) {
  const rating = createMemo(() => getPerformanceRating(props.result.executionTime))

  return (
    <div class="gap-3 grid grid-cols-2">
      {/* Execution Time */}
      <div class="p-3 border rounded-md bg-muted/20">
        <div class="mb-1 flex gap-2 items-center">
          <span class="i-lucide-timer text-muted-foreground size-4" />
          <span class="text-xs text-muted-foreground">Execution Time</span>
        </div>
        <div class="flex gap-2 items-baseline">
          <span class="text-lg font-semibold">
            {formatExecutionTime(props.result.executionTime)}
          </span>
          <span class={`text-xs font-medium ${rating().color}`}>
            {rating().label}
          </span>
        </div>
      </div>

      {/* Match Steps */}
      <div class="p-3 border rounded-md bg-muted/20">
        <div class="mb-1 flex gap-2 items-center">
          <span class="i-lucide-footprints text-muted-foreground size-4" />
          <span class="text-xs text-muted-foreground">Match Operations</span>
        </div>
        <span class="text-lg font-semibold">
          {props.result.steps}
        </span>
      </div>

      {/* Backtracking Status */}
      <div class="p-3 border rounded-md bg-muted/20 col-span-2">
        <div class="flex gap-2 items-center">
          <Show
            when={props.result.backtrackingDetected}
            fallback={(
              <>
                <span class="i-lucide-check-circle text-green-600 size-4 dark:text-green-400" />
                <span class="text-sm text-green-600 dark:text-green-400">
                  No excessive backtracking detected
                </span>
              </>
            )}
          >
            <span class="i-lucide-alert-triangle text-orange-600 size-4 dark:text-orange-400" />
            <span class="text-sm text-orange-600 dark:text-orange-400">
              Potential backtracking detected
            </span>
          </Show>
        </div>
      </div>
    </div>
  )
}

export function PerformancePanel() {
  const { store, actions } = useRegexContext()

  const hasPerformanceData = createMemo(() =>
    store.performanceEnabled && store.performanceResult !== undefined,
  )

  const optimizationSuggestions = createMemo(() => {
    if (!store.pattern) {
      return []
    }
    return getOptimizationSuggestions(store.pattern)
  })

  return (
    <div class="p-4">
      <div class="mb-3 flex items-center justify-between">
        <div class="flex gap-2 items-center">
          <span class="i-lucide-gauge size-5" />
          <h3 class="font-medium">Performance Analysis</h3>
        </div>
        <button
          type="button"
          class={` text-sm px-3 py-1 rounded-md transition-colors ${store.performanceEnabled
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted hover:bg-muted/80'}  `}
          onClick={() => actions.togglePerformanceMode(!store.performanceEnabled)}
        >
          {store.performanceEnabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      <Show
        when={store.performanceEnabled}
        fallback={(
          <p class="text-sm text-muted-foreground">
            Enable performance mode to measure regex execution time and detect potential issues.
          </p>
        )}
      >
        <div class="space-y-4">
          {/* Performance Metrics */}
          <Show
            when={hasPerformanceData()}
            fallback={(
              <p class="text-sm text-muted-foreground">
                Enter a pattern and test text to see performance metrics.
              </p>
            )}
          >
            <PerformanceMetrics result={store.performanceResult!} />
          </Show>

          {/* Warnings */}
          <Show when={store.performanceResult?.warnings.length}>
            <div class="space-y-2">
              <h4 class="text-sm font-medium flex gap-2 items-center">
                <span class="i-lucide-alert-circle size-4" />
                Warnings
              </h4>
              <div class="space-y-2">
                <For each={store.performanceResult?.warnings}>
                  {warning => <WarningItem warning={warning} />}
                </For>
              </div>
            </div>
          </Show>

          {/* Optimization Suggestions */}
          <Show when={optimizationSuggestions().length > 0}>
            <div class="space-y-2">
              <h4 class="text-sm font-medium flex gap-2 items-center">
                <span class="i-lucide-lightbulb size-4" />
                Optimization Tips
              </h4>
              <ul class="text-sm text-muted-foreground space-y-1">
                <For each={optimizationSuggestions()}>
                  {suggestion => (
                    <li class="flex gap-2 items-start">
                      <span class="i-lucide-chevron-right mt-1 shrink-0 size-3" />
                      <span>{suggestion}</span>
                    </li>
                  )}
                </For>
              </ul>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  )
}
