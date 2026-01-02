import { CopyButton } from '#/components/copy-button'
import { DownloadButton } from '#/components/download-button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '#/components/ui/dialog'
import Icon from '#/components/ui/icon'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { Switch } from '#/components/ui/switch'
import { TextField, TextFieldInput, TextFieldLabel, TextFieldTextArea } from '#/components/ui/text-field'
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
    <Dialog open={store.showExportDialog} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Regex Pattern</DialogTitle>
          <DialogDescription>
            Export your regex pattern as code for different programming languages
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          {/* Language and Variable Name Row */}
          <div class="gap-4 grid grid-cols-1 sm:grid-cols-2">
            <div class="flex flex-col gap-2">
              <label id={languageLabelId} class="text-sm font-medium">Language</label>
              <Select
                value={store.selectedExportLanguage}
                onChange={lang => lang && actions.setExportLanguage(lang)}
                options={languageOptions.map(o => o.value)}
                disallowEmptySelection
                itemComponent={p => (
                  <SelectItem item={p.item}>
                    {languageOptions.find(o => o.value === p.item.rawValue)?.label}
                  </SelectItem>
                )}
              >
                <SelectTrigger aria-labelledby={languageLabelId}>
                  <SelectValue<ExportLanguage>>
                    {state => languageOptions.find(o => o.value === state.selectedOption())?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent />
              </Select>
            </div>

            <TextField>
              <TextFieldLabel>Variable Name</TextFieldLabel>
              <TextFieldInput
                value={variableName()}
                onInput={e => setVariableName(e.currentTarget.value)}
                placeholder="regex"
                aria-describedby="variable-name-hint"
              />
              <span id="variable-name-hint" class="sr-only">
                The name of the variable in the exported code
              </span>
            </TextField>
          </div>

          {/* Options */}
          <div class="flex items-center">
            <Switch
              text="Include comments"
              checked={includeComments()}
              onChange={setIncludeComments}
              aria-describedby="comments-hint"
            />
            <span id="comments-hint" class="sr-only">
              Add explanatory comments to the exported code
            </span>
          </div>

          {/* Code Output */}
          <Show
            when={store.pattern}
            fallback={(
              <div class="text-muted-foreground p-4 text-center border rounded-md bg-muted/50" role="status">
                <Icon name="lucide:code" class="mx-auto mb-2 opacity-50 size-8" aria-hidden="true" />
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
              <TextField>
                <TextFieldTextArea
                  class="text-sm font-mono bg-muted/50 h-48 resize-none"
                  readOnly
                  value={exportOutput()}
                  aria-labelledby={outputLabelId}
                  aria-readonly="true"
                />
              </TextField>
            </div>
          </Show>
        </div>
      </DialogContent>
    </Dialog>
  )
}
