import { Field, Dialog, Icon, Input, Select, Switch, Textarea } from 'moraine'
import { createEffect, createSignal, Show } from 'solid-js'

import { CopyButton } from '#/components/copy-button'
import { DownloadButton } from '#/components/download-button'
import { ToolOptions } from '#/components/tool-options'
import { useRegexContext } from '#/contexts'
import { generateExportCode } from '#/utils/regex/export-generator'

type ExportLanguage = 'javascript' | 'python' | 'java'

const languageOptions: Array<{ value: ExportLanguage; label: string }> = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
]

export function ExportDialog() {
  const { store, actions } = useRegexContext()

  const [variableName, setVariableName] = createSignal('regex')
  const [includeComments, setIncludeComments] = createSignal(true)
  const [exportOutput, setExportOutput] = createSignal('')

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
    <Dialog open={store.showExportDialog} onOpenChange={handleClose}>
      <Dialog.Content
        title="Export Regex Pattern"
        description="Export your regex pattern as code for different programming languages"
      >
        <Dialog.Body>
          <div class="space-y-4">
            {/* Language and Variable Name Row */}
            <ToolOptions>
              <div class="gap-4 grid grid-cols-1 sm:grid-cols-2">
                <Field
                  label="Language"
                  classes={{ root: 'min-w-0', label: 'text-muted-foreground font-medium text-xs' }}
                >
                  <Select
                    value={store.selectedExportLanguage}
                    onValueChange={(lang) =>
                      lang && actions.setExportLanguage(lang as ExportLanguage)
                    }
                    items={languageOptions.map((o) => ({ value: o.value, label: o.label }))}
                  />
                </Field>

                <Field
                  label="Variable Name"
                  help="The name of the variable in the exported code"
                  classes={{
                    root: 'min-w-0',
                    label: 'text-muted-foreground font-medium text-xs',
                    help: 'sr-only',
                  }}
                >
                  <Input
                    value={variableName()}
                    onValueChange={setVariableName}
                    placeholder="regex"
                  />
                </Field>
              </div>
              <div class="flex items-center">
                <Field
                  label="Include comments"
                  classes={{
                    root: 'flex flex-row-reverse gap-2 w-fit min-w-0 items-center',
                    label: 'font-normal',
                    container: 'mt-0! shrink-0',
                  }}
                >
                  <Switch checked={includeComments()} onCheckedChange={setIncludeComments} />
                </Field>
              </div>
            </ToolOptions>

            {/* Code Output */}
            <Show
              when={store.pattern}
              fallback={
                <div
                  class="text-muted-foreground p-4 text-center border bg-muted/50 rounded-md"
                  role="status"
                >
                  <Icon
                    name="i-lucide-code"
                    class="mx-auto mb-2 opacity-50 size-8"
                    aria-hidden="true"
                  />
                  <p>No pattern to export</p>
                </div>
              }
            >
              <Field
                label="Generated Code"
                classes={{
                  root: 'min-w-0',
                  label: 'text-muted-foreground font-medium text-xs',
                  labelWrapper: 'tool-panel-heading',
                }}
                hint={
                  <span class="tool-actions">
                    <CopyButton
                      text="Copy Output"
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
                  </span>
                }
              >
                <Textarea
                  classes={{ root: 'text-sm font-mono resize-none h-48' }}
                  readOnly
                  value={exportOutput()}
                />
              </Field>
            </Show>
          </div>
        </Dialog.Body>
      </Dialog.Content>
    </Dialog>
  )
}
