import type { ImageFileData } from '#/components/image-card'
import type { ImageFormat } from '#/utils/image'

import { Card } from '#/components/card'
import { FileUpload } from '#/components/file-upload'
import { ImageCard } from '#/components/image-card'
import { Button } from '#/components/ui/button'
import { Icon } from '#/components/ui/icon'
import { Label } from '#/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { Slider } from '#/components/ui/slider'
import { Switch } from '#/components/ui/switch'
import { TextField, TextFieldInput } from '#/components/ui/text-field'
import { downloadFile } from '#/utils/download'
import { convertImage, getFileExtension, getMimeType } from '#/utils/image'
import { createRoute } from 'solid-file-router'
import { createSignal, For, onCleanup, Show } from 'solid-js'
import { createStore } from 'solid-js/store'
import { toast } from 'solid-sonner'

export default createRoute({
  info: {
    title: 'Image Converter',
    description: 'Convert images between SVG, PNG, JPG, and WebP formats with quality control',
    category: 'Utilities',
    icon: 'lucide:image',
    tags: ['image', 'convert', 'svg', 'png', 'jpg', 'webp', 'format'],
  },
  component: ImageConverter,
})

const FORMAT_OPTIONS: { value: ImageFormat, label: string }[] = [
  { value: 'png', label: 'PNG' },
  { value: 'jpg', label: 'JPEG' },
  { value: 'webp', label: 'WebP' },
]

function ImageConverter() {
  const [files, setFiles] = createSignal<File[]>([])
  const [images, setImages] = createStore<ImageFileData[]>([])
  const [targetFormat, setTargetFormat] = createSignal<ImageFormat>('jpg')
  const [quality, setQuality] = createSignal(80)
  const [svgBackgroundColor, setSvgBackgroundColor] = createSignal('#ffffff')
  const [svgColor, setSvgColor] = createSignal('')
  const [converting, setConverting] = createSignal(false)
  const [ratio, setRatio] = createSignal(true)
  const [globalWidth, setGlobalWidth] = createSignal<number>()
  const [globalHeight, setGlobalHeight] = createSignal<number>()

  const addFiles = (newFiles: File[]) => {
    const imageFiles = newFiles.filter(f => f.type.startsWith('image/'))

    if (imageFiles.length === 0) {
      toast.error('Please select image files')
      return
    }

    const newImages: ImageFileData[] = imageFiles.map((file) => {
      const url = URL.createObjectURL(file)
      const id = Math.random().toString(36).substring(7)

      // Load image to get dimensions
      const htmlImg = new Image()
      htmlImg.onload = () => {
        setImages(
          prev => prev.id === id,
          { origin: { width: htmlImg.naturalWidth, height: htmlImg.naturalHeight } },
        )
      }
      htmlImg.src = url

      return { id, file, previewUrl: url, maintainAspectRatio: true }
    })

    setImages(prev => [...prev, ...newImages])
  }

  const removeImage = (id: string) => {
    const img = images.find(i => i.id === id)
    if (img) {
      URL.revokeObjectURL(img.previewUrl)
      setImages(prev => prev.filter(i => i.id !== id))
      setFiles(prev => prev.filter(f => f !== img.file))
    }
  }

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles)
    addFiles(newFiles)
  }

  // Cleanup preview URLs on unmount
  onCleanup(() => {
    images.forEach(img => URL.revokeObjectURL(img.previewUrl))
  })

  const handleConvertAll = async () => {
    if (images.length === 0) {
      toast.error('Please select images first')
      return
    }

    setConverting(true)

    try {
      for (const img of images) {
        const isSvg = img.file.type.includes('svg')
        // Use per-image dimensions if set, otherwise use global dimensions
        const width = img.targetWidth ?? globalWidth()
        const height = img.targetHeight ?? globalHeight()

        const result = await convertImage(img.file, targetFormat(), {
          quality: quality() / 100,
          width,
          height,
          maintainAspectRatio: ratio(),
          svgBackgroundColor: isSvg ? svgBackgroundColor() : undefined,
          svgColor: isSvg && svgColor() ? svgColor() : undefined,
        })

        const filename = img.file.name.replace(/\.[^.]+$/, `.${getFileExtension(targetFormat())}`)
        downloadFile({ content: result.blob, filename, mimeType: getMimeType(targetFormat()) })
      }

      toast.success(`Converted ${images.length} image${images.length > 1 ? 's' : ''}`)
    } catch (error) {
      toast.error('Conversion failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setConverting(false)
    }
  }

  const showQualitySlider = () => {
    const format = targetFormat()
    return format === 'jpg' || format === 'webp'
  }

  const hasSvgFiles = () => images.some(img => img.file.type.includes('svg'))

  const updateImage = (id: string, updates: Partial<ImageFileData>) => {
    setImages(prev => prev.id === id, updates)
  }

  const handleRemoveImage = (id: string) => {
    removeImage(id)
  }

  return (
    <div class="gap-6 grid grid-cols-1 xl:grid-cols-[1fr_400px]">
      {/* Left side - Images */}
      <Card
        title="Upload Images"
        content={(
          <>
            <FileUpload
              files={files()}
              setFiles={handleFilesChange}
              accept={['image/*']}
              multiple
              info="Supports JPEG, PNG, WebP, GIF, AVIF, TIFF, SVG"
              icon="lucide:image"
            />
            <Show when={images.length > 0}>
              <div class="mt-6 flex flex-wrap gap-4 justify-evenly">
                <For each={images}>
                  {img => (
                    <ImageCard
                      image={img}
                      aspectRatio={ratio()}
                      onUpdate={updateImage}
                      onRemove={handleRemoveImage}
                    />
                  )}
                </For>
              </div>
            </Show>
          </>
        )}
      />

      {/* Right side - Settings */}
      <div class="space-y-6">
        <Card
          title="Output Settings"
          content={(
            <div class="flex flex-col gap-6">
              <div>
                <Label>Output Format</Label>
                <Select
                  value={targetFormat()}
                  onChange={setTargetFormat}
                  options={FORMAT_OPTIONS.map(o => o.value)}
                  placeholder="Select format"
                  itemComponent={props => (
                    <SelectItem item={props.item}>
                      {FORMAT_OPTIONS.find(o => o.value === props.item.rawValue)?.label}
                    </SelectItem>
                  )}
                >
                  <SelectTrigger class="w-full">
                    <SelectValue<ImageFormat>>
                      {state => FORMAT_OPTIONS.find(o => o.value === state.selectedOption())?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent />
                </Select>
              </div>

              <Show when={showQualitySlider()}>
                <Slider
                  value={[quality()]}
                  onChange={value => setQuality(value[0])}
                  minValue={1}
                  maxValue={100}
                  step={1}
                  label={`${targetFormat().toUpperCase()} Quality: ${quality()}`}
                />
              </Show>
              <Switch
                checked={ratio()}
                onChange={setRatio}
                text="Keep aspect ratio"
              />

              <div>
                <Label class="mb-2 block">Global Dimensions</Label>
                <p class="text-xs text-muted-foreground mb-3">
                  Apply to all images without individual settings
                </p>
                <div class="flex gap-2">
                  <TextField
                    class="flex-1"
                    value={globalWidth() ? `${globalWidth()}` : ''}
                    onChange={(val) => {
                      setGlobalWidth(val ? Number.parseInt(val) : undefined)
                    }}
                  >
                    <TextFieldInput
                      type="number"
                      placeholder="Width"
                    />
                  </TextField>
                  <TextField
                    class="flex-1"
                    value={globalHeight() ? `${globalHeight()}` : ''}
                    onChange={(val) => {
                      setGlobalHeight(val ? Number.parseInt(val) : undefined)
                    }}
                  >
                    <TextFieldInput
                      type="number"
                      placeholder="Height"
                    />
                  </TextField>
                </div>
              </div>
            </div>
          )}
        />

        <Show when={hasSvgFiles()}>
          <Card
            title="SVG Options"
            content={(
              <div class="space-y-4">
                <div>
                  <Label>Background Color</Label>
                  <div class="flex gap-2">
                    <input
                      type="color"
                      value={svgBackgroundColor()}
                      onInput={e => setSvgBackgroundColor(e.currentTarget.value)}
                      class="border rounded h-10 w-14 cursor-pointer"
                    />
                    <TextField
                      value={svgBackgroundColor()}
                      onChange={setSvgBackgroundColor}
                    >
                      <TextFieldInput
                        type="text"
                        placeholder="#ffffff"
                      />
                    </TextField>
                  </div>
                </div>

                <div>
                  <Label>SVG Fill Color (optional)</Label>
                  <div class="flex gap-2">
                    <input
                      type="color"
                      value={svgColor() || '#000000'}
                      onInput={e => setSvgColor(e.currentTarget.value)}
                      class="border rounded h-10 w-14 cursor-pointer"
                    />
                    <TextField
                      value={svgColor()}
                      onChange={setSvgColor}
                    >
                      <TextFieldInput
                        type="text"
                        placeholder="Leave empty for original"
                      />
                    </TextField>
                  </div>
                </div>
              </div>
            )}
          />
        </Show>

        <Button
          onClick={handleConvertAll}
          disabled={converting() || images.length === 0}
          size="lg"
          class="w-full"
        >
          <Show when={converting()} fallback={<Icon name="lucide:download" class="mr-2" />}>
            <Icon name="lucide:loader-2" class="mr-2 animate-spin" />
          </Show>
          {converting() ? 'Converting...' : `Convert & Download ${images.length > 0 ? `(${images.length})` : ''}`}
        </Button>
      </div>
    </div>
  )
}
