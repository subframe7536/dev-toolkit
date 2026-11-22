import type { FileUploadT } from 'moraine'
import { Field, FileUpload as MoraineFileUpload, Toast } from 'moraine'
import { createMemo } from 'solid-js'

interface SingleFileProps {
  file: File | undefined
  setFile: (file: File) => void | Promise<void>
  info?: string
  accept?: string[]
  multiple?: false
  icon?: string
}

interface MultipleFileProps {
  files: File[]
  setFiles: (files: File[]) => void | Promise<void>
  info?: string
  accept?: string[]
  multiple: true
  icon?: string
}

type Props = SingleFileProps | MultipleFileProps

export function FileUpload(props: Props) {
  const info = createMemo(
    () => props.info ?? `Supported file type: ${props.accept?.join(', ') ?? 'All'}`,
  )
  const accept = createMemo(() => props.accept?.join(',') ?? '*')
  const icon = createMemo(() => normalizeIconName(props.icon))

  const handleValueChange = (value: FileUploadT.Value) => {
    if (props.multiple) {
      void props.setFiles(Array.isArray(value) ? value : value ? [value] : [])
    } else {
      const file = Array.isArray(value) ? value[0] : value
      if (file) {
        void props.setFile(file)
      }
    }
  }

  const handleFileReject = ({ rejections }: FileUploadT.ValueInvalidDetails) => {
    for (const i of rejections) {
      Toast.error({
        title: `Failed to upload ${i.file.name}`,
        description: i.reasons.join(', '),
      })
    }
  }

  return (
    <Field hiddenLabel="Upload files" classes={{ root: 'min-w-0' }}>
      <MoraineFileUpload
        accept={accept()}
        description={info()}
        dropzone
        icon={icon()}
        label="Drag or Click to upload"
        maxFiles={200}
        multiple={props.multiple}
        onValueInvalid={handleFileReject}
        onValueChange={handleValueChange}
        fileList={false}
        classes={{
          control: 'h-81',
        }}
      />
    </Field>
  )
}

function normalizeIconName(icon: string | undefined) {
  return icon?.startsWith('i-lucide-')
    ? icon.replace('i-lucide-', 'i-lucide-')
    : (icon ?? 'i-lucide-upload')
}
