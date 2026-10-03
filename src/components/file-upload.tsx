import type { FileUploadProps, FileUploadT } from 'moraine'
import { Field, FileUpload as MoraineFileUpload } from 'moraine'
import { createMemo } from 'solid-js'
import { toast } from 'solid-toaster'

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
type FileRejections = Parameters<NonNullable<FileUploadProps['onFileReject']>>[0]

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

  const handleFileReject = (info: FileRejections) => {
    for (const i of info) {
      toast.error(`Failed to upload ${i.file.name}`, {
        description: i.errors.join(', '),
      })
    }
  }

  return (
    <Field label="Upload files" classes={{ root: 'min-w-0', label: 'sr-only', container: 'mt-0!' }}>
      <MoraineFileUpload
        accept={accept()}
        description={info()}
        dropzone
        icon={icon()}
        label="Drag or Click to upload"
        maxFiles={200}
        multiple={props.multiple}
        onFileReject={handleFileReject}
        onValueChange={handleValueChange}
        preview={false}
        classes={{
          control: 'min-h-56! sm:min-h-72!',
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
