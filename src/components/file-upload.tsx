import type { FileFieldTriggerProps, FileRejection } from '@kobalte/core/file-field'

import { FileField } from '@kobalte/core/file-field'
import { createMemo, Show } from 'solid-js'
import { toast } from 'solid-sonner'

import { Button } from './ui/button'
import Icon from './ui/icon'

interface SingleFileProps {
  file: File | undefined
  setFile: (file: File | undefined) => void
  info?: string
  accept?: string[]
  multiple?: false
  icon?: `lucide:${string}`
}

interface MultipleFileProps {
  files: File[]
  setFiles: (files: File[]) => void
  info?: string
  accept?: string[]
  multiple: true
  icon?: `lucide:${string}`
}

type Props = SingleFileProps | MultipleFileProps

export function FileUpload(props: Props) {
  const info = createMemo(() => props.info ?? `Supported file type: ${props.accept?.join(', ') ?? 'All'}`)

  const handleFileAccept = (files: File[]) => {
    if (props.multiple) {
      props.setFiles(files)
    } else {
      props.setFile(files[0])
    }
  }

  const handleFileReject = (info: FileRejection[]) => {
    for (const i of info) {
      toast.error(`Failed to upload ${i.file.name}`, {
        description: i.errors.join(', '),
      })
    }
  }

  return (
    <FileField
      class="flex flex-col gap-2 relative"
      accept={props.accept}
      multiple={props.multiple}
      maxFiles={200}
      onFileAccept={handleFileAccept}
      onFileReject={handleFileReject}
    >
      <FileField.Dropzone
        class="text-center b-(2 border dashed) rounded-lg bg-input flex flex-col gap-4 h-120 transition-all items-center justify-center data-[dragging=true]:bg-muted"
        onDrop={e => (e.target as HTMLDivElement).dataset.dragging = 'false'}
      >
        <Show when={props.icon}>
          <Icon name={props.icon!} class="size-12" />
        </Show>
        <div class="xs:text-sm text-(xs muted-foreground center) px-4">
          {info()}
        </div>
        <FileField.Trigger
          as={(triggerProps: FileFieldTriggerProps) => (
            <Button {...triggerProps} variant="secondary" class="text-sm flex gap-2 w-80% items-center sm:w-unset">
              <Icon name="lucide:upload" />
              <span>Drag or Click to upload</span>
            </Button>
          )}
        />
      </FileField.Dropzone>
      <FileField.HiddenInput />
    </FileField>
  )
}
