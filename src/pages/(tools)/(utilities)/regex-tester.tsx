import { Button, Dialog, Icon } from 'moraine'
import { createRoute } from 'solid-file-router'
import { ErrorBoundary, Show, Suspense } from 'solid-js'

import { DebugPanel } from '#/components/regex-tester/debug-panel'
import { DetailsPanel } from '#/components/regex-tester/details-panel'
import { ExplanationPanel } from '#/components/regex-tester/explanation-panel'
import { ExportDialog } from '#/components/regex-tester/export-dialog'
import { HelpPanel } from '#/components/regex-tester/help-panel'
import { PatternLibraryDialog } from '#/components/regex-tester/pattern-library'
import { RegexInputPanel } from '#/components/regex-tester/regex-input-panel'
import { SubstitutionPanel } from '#/components/regex-tester/substitution-panel'
import { TestingPanel } from '#/components/regex-tester/testing-panel'
import { RegexProvider, useRegexContext } from '#/contexts'

// Error fallback component for graceful error handling
function ErrorFallback(props: { error: Error; reset: () => void }) {
  return (
    <div
      class="p-6 border border-red-200 rounded-lg bg-red-50 dark:border-red-800 dark:bg-red-950/30"
      role="alert"
    >
      <div class="flex gap-3 items-start">
        <Icon name="i-lucide-alert-triangle" class="text-red-600 mt-0.5 size-5 dark:text-red-400" />
        <div class="flex-1">
          <h3 class="text-red-800 font-medium dark:text-red-200">Something went wrong</h3>
          <p class="text-sm text-red-600 mt-1 dark:text-red-400">{props.error.message}</p>
          <Button
            variant="outline"
            size="sm"
            classes={{ root: 'mt-3' }}
            onClick={() => props.reset()}
            leading="i-lucide-refresh-cw"
          >
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
    description:
      'Test and debug regular expressions with real-time matching, substitution, detailed explanations, and code export',
    category: 'Utilities',
    icon: 'i-lucide-regex',
    tags: ['regex', 'pattern', 'matching', 'testing', 'substitution', 'debugging'],
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
    <div class="space-y-4">
      <PanelSkeleton />
      <PanelSkeleton />
      <PanelSkeleton />
    </div>
  )
}

function RegexTester() {
  const { store, actions } = useRegexContext()
  return (
    <div class="space-y-4">
      {/* 1. Regular Expression */}
      <RegexInputPanel />

      {/* 2. Test String and Match Information (horizontally aligned when enabled) */}
      <div class={store.showMatchInfo ? 'grid grid-cols-1 lg:grid-cols-2 gap-4 items-start' : ''}>
        <TestingPanel />
        <Show when={store.showMatchInfo}>
          <DetailsPanel />
        </Show>
      </div>

      {/* 3. Substitution */}
      <SubstitutionPanel />

      {/* 4. Pattern Explanation (Collapsible) */}
      <ExplanationPanel />

      {/* 6. Action buttons toolbar */}
      <div class="tool-toolbar">
        <Button
          variant="default"
          onClick={() => actions.toggleExportDialog(true)}
          leading="i-lucide-download"
        >
          Export Code
        </Button>
        <PatternLibraryDialog />
        <Button
          variant="secondary"
          onClick={() => {
            actions.setPattern('')
            actions.setTestText('')
            actions.setReplacementPattern('')
          }}
          leading="i-lucide-trash-2"
        >
          Clear All
        </Button>
        {/* Debug Modal Dialog */}
        <Dialog classes={{ content: 'max-h-[85vh] max-w-4xl overflow-y-auto' }}>
          <Dialog.Trigger as={Button} variant="outline" leading="i-lucide-circle-play">
            Debug Regex
          </Dialog.Trigger>
          <Dialog.Content
            title="Regex Match Debugger"
            description="Interactive step-by-step regex engine execution and matching breakdown."
          >
            <Dialog.Body>
              <DebugPanel />
            </Dialog.Body>
          </Dialog.Content>
        </Dialog>
        {/* Reference Dialog */}
        <Dialog classes={{ content: 'max-h-[60vh] max-w-4xl overflow-y-auto' }}>
          <Dialog.Trigger as={Button} variant="outline" leading="i-lucide-book-open">
            Reference
          </Dialog.Trigger>
          <Dialog.Content title="Regex Syntax Reference">
            <Dialog.Body>
              <HelpPanel />
            </Dialog.Body>
          </Dialog.Content>
        </Dialog>
      </div>

      {/* Export Dialog */}
      <ExportDialog />
    </div>
  )
}
