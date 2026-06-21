import type { FileUploadProps, FileUploadT } from 'moraine'
import { FileUpload as MoraineFileUpload } from 'moraine'
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
        root: 'flex flex-col gap-2 relative',
        control:
          'text-center b-(2 border dashed) rounded-lg bg-input flex flex-col gap-4 h-100 transition-all items-center justify-center data-[dragging]:bg-muted md:h-120',
        icon: 'size-12',
        label: 'text-sm',
        description: 'xs:text-sm text-(xs muted-foreground center) px-4',
      }}
    />
  )
}

function normalizeIconName(icon: string | undefined) {
  return icon?.startsWith('lucide:')
    ? icon.replace('lucide:', 'i-lucide-')
    : (icon ?? 'i-lucide-upload')
}
