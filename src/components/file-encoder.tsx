import { Switch } from 'moraine'
import { createMemo, createSignal, Show } from 'solid-js'
import { toast } from 'solid-toaster'

import { CopyButton } from '#/components/copy-button'
import { DownloadButton } from '#/components/download-button'
import { FileUpload } from '#/components/file-upload'
import { ToolOptions } from '#/components/tool-options'

import { ClearButton } from './clear-button'

interface FileEncoderProps {
  mode: string
  onEncode: (data: File) => string | Promise<string>
  uploadInfo?: string
  outputTitle?: string
  fileExtension?: string
  showDataURLSwitch?: boolean
}

export function FileEncoder(props: FileEncoderProps) {
  const [file, setFile] = createSignal<File | undefined>()
  const [output, setOutput] = createSignal('')
  const [includeDataURL, setIncludeDataURL] = createSignal(false)

  const targetOutput = createMemo(() => {
    if (!props.showDataURLSwitch || !includeDataURL()) {
      return output().split(',')[1] || output()
    }
    return output()
  })

  const processFile = async (file: File) => {
    try {
      setFile(file)
      const result = await props.onEncode(file)
      setOutput(result)
    } catch (error) {
      toast.error(
        `Failed to encode file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
      setOutput('')
    }
  }

  const clearFile = () => {
    setFile(undefined)
    setOutput('')
  }

  const outputFilename = () => {
    const name = file()?.name || 'output'
    const ext = props.fileExtension || props.mode.toLowerCase()
    return `${name}.${ext}.txt`
  }

  return (
    <div class="space-y-4">
      <div class="space-y-4">
        <FileUpload
          file={file()}
          setFile={processFile}
          icon="i-lucide-file"
          info={props.uploadInfo || `Upload any file to encode to ${props.mode}`}
        />
        <Show when={file()}>
          <div class="text-sm text-muted-foreground flex flex-wrap gap-3 items-center">
            <span class="min-w-0 break-all">{file()?.name}</span>
            <ClearButton onClear={clearFile} disabled={!file() && !output()} />
          </div>
        </Show>
      </div>

      <Show when={output()}>
        <div class="space-y-4">
          <div class="tool-panel-heading">
            <h3 class="text-sm text-foreground font-medium">
              {props.outputTitle || `${props.mode} Output`}
            </h3>
          </div>
          <div class="text-sm font-mono p-3 border rounded-md bg-muted/50 max-h-96 break-all of-y-auto">
            {targetOutput()}
          </div>
          <div class="tool-toolbar">
            <CopyButton text="Copy Output" content={targetOutput()} variant="secondary" size="sm" />
            <DownloadButton
              content={targetOutput()}
              filename={outputFilename()}
              variant="secondary"
              size="sm"
            />
          </div>
          <Show when={props.showDataURLSwitch}>
            <ToolOptions>
              <Switch
                label="Include Data URL prefix"
                checked={includeDataURL()}
                onCheckedChange={setIncludeDataURL}
              />
            </ToolOptions>
          </Show>
        </div>
      </Show>
    </div>
  )
}
