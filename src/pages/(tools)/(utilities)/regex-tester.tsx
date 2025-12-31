import {
  DebugPanel,
  DetailsPanel,
  ExplanationPanel,
  ExportDialog,
  HelpPanel,
  PatternInput,
  PatternLibrarySheet,
  PerformancePanel,
  ReplacementPanel,
  TestingPanel,
  ValidationPanel,
} from '#/components/regex-tester'
import { Button } from '#/components/ui/button'
import Icon from '#/components/ui/icon'
import { RegexProvider, useRegexContext } from '#/contexts'
import { createRoute } from 'solid-file-router'
import { createSignal, ErrorBoundary, Suspense } from 'solid-js'

// Error fallback component for graceful error handling
function ErrorFallback(props: { error: Error, reset: () => void }) {
  return (
    <div class="p-6 border border-red-200 rounded-lg bg-red-50 dark:border-red-800 dark:bg-red-950/30" role="alert">
      <div class="flex gap-3 items-start">
        <Icon name="lucide:alert-triangle" class="text-red-600 mt-0.5 size-5 dark:text-red-400" />
        <div class="flex-1">
          <h3 class="text-red-800 font-medium dark:text-red-200">Something went wrong</h3>
          <p class="text-sm text-red-600 mt-1 dark:text-red-400">{props.error.message}</p>
          <Button
            variant="outline"
            size="sm"
            class="mt-3"
            onClick={() => props.reset()}
          >
            <Icon name="lucide:refresh-cw" class="mr-2 size-4" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  )
}

// Loading skeleton for panels
function PanelSkeleton() {
  return (
    <div class="p-4 border rounded-lg bg-card animate-pulse">
      <div class="mb-3 rounded bg-muted h-5 w-32" />
      <div class="space-y-2">
        <div class="rounded bg-muted h-4 w-full" />
        <div class="rounded bg-muted h-4 w-3/4" />
        <div class="rounded bg-muted h-4 w-1/2" />
      </div>
    </div>
  )
}

export default createRoute({
  info: {
    title: 'Regex Tester',
    description: 'Test and debug regular expressions with real-time matching, detailed explanations, and code export',
    category: 'Utilities',
    icon: 'lucide:regex',
    tags: ['regex', 'pattern', 'matching', 'testing', 'debugging'],
  },
  component: () => (
    <ErrorBoundary fallback={(err, reset) => <ErrorFallback error={err} reset={reset} />}>
      <RegexProvider>
        <Suspense fallback={<RegexTesterSkeleton />}>
          <RegexTester />
        </Suspense>
      </RegexProvider>
    </ErrorBoundary>
  ),
})

// Loading skeleton for the entire page
function RegexTesterSkeleton() {
  return (
    <div class="gap-6 grid grid-cols-1 xl:grid-cols-2">
      <div class="space-y-4">
        <PanelSkeleton />
      </div>
      <div class="space-y-4">
        <PanelSkeleton />
        <PanelSkeleton />
      </div>
    </div>
  )
}

function RegexTester() {
  const { actions } = useRegexContext()
  const [showDebugPanel, setShowDebugPanel] = createSignal(false)

  return (
    <>
      {/* Main content area - responsive layout */}
      <div class="gap-6 grid grid-cols-1 xl:grid-cols-2">
        {/* Left column - Pattern input and testing */}
        <div class="space-y-4">
          <div class="p-4 border rounded-lg bg-card">
            <div class="space-y-4">
              {/* Regular Expression Pattern with Flags */}
              <ErrorBoundary fallback={(err, reset) => <ErrorFallback error={err} reset={reset} />}>
                <PatternInput />
              </ErrorBoundary>

              {/* Test Text with Match Highlighting */}
              <ErrorBoundary fallback={(err, reset) => <ErrorFallback error={err} reset={reset} />}>
                <TestingPanel />
              </ErrorBoundary>
            </div>
          </div>
        </div>

        {/* Right column - Results and details */}
        <div class="space-y-4">
          {/* Match Details Panel */}
          <ErrorBoundary fallback={(err, reset) => <ErrorFallback error={err} reset={reset} />}>
            <DetailsPanel />
          </ErrorBoundary>

          {/* Validation Panel */}
          <ErrorBoundary fallback={(err, reset) => <ErrorFallback error={err} reset={reset} />}>
            <ValidationPanel />
          </ErrorBoundary>

          {/* Replacement Panel */}
          <ErrorBoundary fallback={(err, reset) => <ErrorFallback error={err} reset={reset} />}>
            <ReplacementPanel />
          </ErrorBoundary>

          {/* Debug Panel - shown when debug mode is active */}
          {showDebugPanel() && (
            <ErrorBoundary fallback={(err, reset) => <ErrorFallback error={err} reset={reset} />}>
              <DebugPanel />
            </ErrorBoundary>
          )}

          {/* Performance Analysis Panel */}
          <ErrorBoundary fallback={(err, reset) => <ErrorFallback error={err} reset={reset} />}>
            <PerformancePanel />
          </ErrorBoundary>

          {/* Pattern Explanation Panel */}
          <ErrorBoundary fallback={(err, reset) => <ErrorFallback error={err} reset={reset} />}>
            <ExplanationPanel />
          </ErrorBoundary>

          {/* Help Panel with Syntax Reference */}
          <ErrorBoundary fallback={(err, reset) => <ErrorFallback error={err} reset={reset} />}>
            <HelpPanel />
          </ErrorBoundary>
        </div>
      </div>

      {/* Action buttons section */}
      <div class="p-4 border border-border rounded-lg bg-muted/20">
        <div class="flex flex-wrap gap-3">
          <Button variant="default" onClick={() => actions.toggleExportDialog(true)}>
            <Icon name="lucide:download" class="mr-2 size-4" />
            Export Code
          </Button>
          <PatternLibrarySheet />
          <Button
            variant="secondary"
            onClick={() => {
              actions.setPattern('')
              actions.setTestText('')
            }}
          >
            <Icon name="lucide:trash-2" class="mr-2 size-4" />
            Clear All
          </Button>
          <Button
            variant={showDebugPanel() ? 'default' : 'secondary'}
            onClick={() => setShowDebugPanel(!showDebugPanel())}
          >
            <Icon name={showDebugPanel() ? 'lucide:bug-off' : 'lucide:bug'} class="mr-2 size-4" />
            {showDebugPanel() ? 'Hide Debug' : 'Debug Mode'}
          </Button>
        </div>
      </div>

      {/* Export Dialog */}
      <ErrorBoundary fallback={(err, reset) => <ErrorFallback error={err} reset={reset} />}>
        <ExportDialog />
      </ErrorBoundary>
    </>
  )
}
