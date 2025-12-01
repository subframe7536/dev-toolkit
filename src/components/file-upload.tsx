import type { FileFieldTriggerProps } from '@kobalte/core/file-field'

import { FileField } from '@kobalte/core/file-field'
import { createMemo, Show } from 'solid-js'

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
  const info = createMemo(() => props.info ?? props.accept ? `Supported file type: ${props.accept!.join(', ')}` : undefined)

  const handleFileAccept = (files: File[]) => {
    if (props.multiple) {
      props.setFiles(files)
    } else {
      props.setFile(files[0])
    }
  }

  return (
    <FileField
      class="flex flex-col gap-2 relative"
      accept={props.accept}
      multiple={props.multiple}
      maxFiles={200}
      onFileAccept={handleFileAccept}
    >
      <FileField.Dropzone
        class="text-center b-(2 border dashed) rounded-md flex flex-col gap-4 h-60 transition-all items-center justify-center data-[dragging=true]:(bg-muted)"
      >
        <Show when={props.icon}>
          <Icon name={props.icon!} class="size-12" />
        </Show>
        <Show when={info()}>
          <div class="xs:text-sm text-(xs muted-foreground center) px-4">
            {info()}
          </div>
        </Show>
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
