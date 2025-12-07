import { CopyButton } from '#/components/copy-button'
import { DownloadButton } from '#/components/download-button'
import { FileUpload } from '#/components/file-upload'
import { Button } from '#/components/ui/button'
import { Icon } from '#/components/ui/icon'
import { Switch } from '#/components/ui/switch'
import { createMemo, createSignal, Show } from 'solid-js'
import { toast } from 'solid-sonner'

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
      toast.error(`Failed to encode file: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
    <div class="space-y-8">
      <div class="space-y-4">
        <FileUpload
          file={file()}
          setFile={processFile}
          icon="lucide:file"
          info={props.uploadInfo || `Upload any file to encode to ${props.mode}`}
        />
        <Show when={file()}>
          <div class="p-4 border rounded-lg bg-input/50 flex flex-wrap gap-4 w-fit items-center">
            <span>{file()?.name}</span>
            <ClearButton
              onClear={clearFile}
              disabled={!file() && !output()}
            />
          </div>
        </Show>
      </div>

      <Show when={output()}>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg text-foreground font-semibold">
              {props.outputTitle || `${props.mode} Output`}
            </h3>
            <div class="flex gap-4">
              <Show when={props.showDataURLSwitch}>
                <Switch
                  checked={includeDataURL()}
                  onChange={setIncludeDataURL}
                  text="Include Data URL prefix"
                />
              </Show>
              <CopyButton content={targetOutput()} variant="secondary" size="sm" />
              <DownloadButton
                content={targetOutput()}
                filename={outputFilename()}
                variant="secondary"
                size="sm"
              />
            </div>
          </div>
          <div class="text-sm font-mono p-4 border rounded-md bg-muted/50 max-h-96 break-all of-y-auto">
            {targetOutput()}
          </div>
        </div>
      </Show>
    </div>
  )
}
