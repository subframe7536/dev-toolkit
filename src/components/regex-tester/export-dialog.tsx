import { CopyButton } from '#/components/copy-button'
import { DownloadButton } from '#/components/download-button'
import { Dialog, Icon, Input, Select, Switch, Textarea } from 'moraine'
import { useRegexContext } from '#/contexts'
import { generateExportCode } from '#/utils/regex/export-generator'
import { createEffect, createSignal, createUniqueId, Show } from 'solid-js'

type ExportLanguage = 'javascript' | 'python' | 'java'

const languageOptions: Array<{ value: ExportLanguage, label: string }> = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
]

export function ExportDialog() {
  const { store, actions } = useRegexContext()

  const [variableName, setVariableName] = createSignal('regex')
  const [includeComments, setIncludeComments] = createSignal(true)
  const [exportOutput, setExportOutput] = createSignal('')

  const languageLabelId = createUniqueId()
  const outputLabelId = createUniqueId()

  // Generate export code when dialog opens or settings change
  createEffect(() => {
    if (store.showExportDialog && store.pattern) {
      const code = generateExportCode({
        pattern: store.pattern,
        flags: store.flags,
        language: store.selectedExportLanguage,
        variableName: variableName(),
        includeComments: includeComments(),
      })
      setExportOutput(code)
    }
  })

  const getExportFilename = () => {
    const name = variableName().trim() || 'regex'
    switch (store.selectedExportLanguage) {
      case 'javascript':
        return `${name}.js`
      case 'python':
        return `${name}.py`
      case 'java':
        return `${name}.java`
      default:
        return `${name}.txt`
    }
  }

  const handleClose = () => {
    actions.toggleExportDialog(false)
  }

  return (
    <Dialog
      open={store.showExportDialog}
      onOpenChange={handleClose}
      title="Export Regex Pattern"
      description="Export your regex pattern as code for different programming languages"
      body={(
        <div class="space-y-4">
          {/* Language and Variable Name Row */}
          <div class="gap-4 grid grid-cols-1 sm:grid-cols-2">
            <div class="flex flex-col gap-2">
              <label id={languageLabelId} class="text-sm font-medium">Language</label>
              <Select
                value={store.selectedExportLanguage}
                onChange={lang => lang && actions.setExportLanguage(lang as ExportLanguage)}
                options={languageOptions.map(o => ({ value: o.value, label: o.label }))}
              />
            </div>

            <div>
              <label class="text-sm font-medium">Variable Name</label>
              <Input
                value={variableName()}
                onInput={e => setVariableName(e.currentTarget.value)}
                placeholder="regex"
                aria-describedby="variable-name-hint"
                class="mt-1"
              />
              <span id="variable-name-hint" class="sr-only">
                The name of the variable in the exported code
              </span>
            </div>
          </div>

          {/* Options */}
          <div class="flex items-center">
            <Switch
              label="Include comments"
              checked={includeComments()}
              onChange={setIncludeComments}
            />
          </div>

          {/* Code Output */}
          <Show
            when={store.pattern}
            fallback={(
              <div class="text-muted-foreground p-4 text-center border rounded-md bg-muted/50" role="status">
                <Icon name="i-lucide-code" classes={{ icon: 'mx-auto mb-2 opacity-50 size-8' }} aria-hidden="true" />
                <p>No pattern to export</p>
              </div>
            )}
          >
            <div class="space-y-2">
              <div class="flex gap-2 items-center justify-between">
                <label id={outputLabelId} class="text-sm font-medium">Generated Code</label>
                <div class="flex gap-2">
                  <CopyButton
                    content={exportOutput()}
                    size="sm"
                    aria-label="Copy generated code to clipboard"
                  />
                  <DownloadButton
                    content={exportOutput()}
                    filename={getExportFilename()}
                    mimeType="text/plain"
                    size="sm"
                    aria-label={`Download as ${getExportFilename()}`}
                  />
                </div>
              </div>
              <Textarea
                classes={{ input: 'text-sm font-mono resize-none h-48' }}
                readOnly
                value={exportOutput()}
                aria-labelledby={outputLabelId}
                aria-readonly="true"
              />
            </div>
          </Show>
        </div>
      )}
    />
  )
}
