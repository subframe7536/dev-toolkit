import { DebugPanel } from '#/components/regex-tester/debug-panel'
import { DetailsPanel } from '#/components/regex-tester/details-panel'
import { ExplanationPanel } from '#/components/regex-tester/explanation-panel'
import { ExportDialog } from '#/components/regex-tester/export-dialog'
import { HelpPanel } from '#/components/regex-tester/help-panel'
import { PatternLibrarySheet } from '#/components/regex-tester/pattern-library'
import { RegexInputPanel } from '#/components/regex-tester/regex-input-panel'
import { Button } from '#/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '#/components/ui/dialog'
import Icon from '#/components/ui/icon'
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { RegexProvider, useRegexContext } from '#/contexts'
import { createRoute } from 'solid-file-router'
import { ErrorBoundary, Suspense } from 'solid-js'

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
  return (
    <div class="space-y-6">
      {/* Main content area - responsive layout */}
      <div class="gap-6 grid grid-cols-1 xl:grid-cols-2">
        {/* Left column - Input with integrated replacement */}
        <div class="space-y-6">
          {/* Regex Input Panel with integrated Find & Replace */}
          <div class="text-card-foreground p-6 border rounded-lg bg-card shadow-sm">
            <RegexInputPanel />

            {/* Action buttons section */}
            <div class="mt-6 flex flex-wrap gap-3">
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
              {/* Reference Dialog */}
              <Dialog>
                <DialogTrigger as={Button} variant="outline">
                  <Icon name="lucide:book-open" class="mr-2 size-4" />
                  Reference
                </DialogTrigger>
                <DialogContent class="max-h-[60vh] max-w-4xl overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Regex Syntax Reference</DialogTitle>
                  </DialogHeader>
                  <HelpPanel />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Right column - Analysis and results */}
        <div class="space-y-6">
          {/* Explanation and Debug Panels */}
          <div class="text-card-foreground border rounded-lg bg-card shadow-sm">
            <Tabs defaultValue="matches">
              <TabsList class="m-4 mb-0 p-1">
                <TabsTrigger value="matches">Matches</TabsTrigger>
                <TabsTrigger value="explanation">Explain</TabsTrigger>
                <TabsTrigger value="debug">Debug</TabsTrigger>
                <TabsIndicator />
              </TabsList>

              <TabsContent value="matches">
                <DetailsPanel />
              </TabsContent>

              <TabsContent value="explanation">
                <ExplanationPanel />
              </TabsContent>

              <TabsContent value="debug">
                <DebugPanel />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Export Dialog */}
      <ExportDialog />
    </div>
  )
}
