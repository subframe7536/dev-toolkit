import type { ImageFileData } from '#/components/image-converter/image-card'
import type { ImageFormat } from '#/utils/image'

import { Card } from '#/components/card'
import { FileUpload } from '#/components/file-upload'
import { ImageCard } from '#/components/image-converter/image-card'
import { OutputSettings } from '#/components/image-converter/output-settings'
import { SvgOptions } from '#/components/image-converter/svg-options'
import { Button } from '#/components/ui/button'
import { Icon } from '#/components/ui/icon'
import { downloadFile } from '#/utils/download'
import { convertImage, getFileExtension } from '#/utils/image'
import { createRoute } from 'solid-file-router'
import { createEffect, createSignal, For, onCleanup, Show } from 'solid-js'
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

function ImageConverter() {
  const [files, setFiles] = createSignal<File[]>([])
  const [images, setImages] = createStore<ImageFileData[]>([])
  const [targetFormat, setTargetFormat] = createSignal<ImageFormat>('jpg')
  const [quality, setQuality] = createSignal(80)
  const [svgBackgroundColor, setSvgBackgroundColor] = createSignal('')
  const [svgColor, setSvgColor] = createSignal('')
  const [svgStrokeColor, setSvgStrokeColor] = createSignal('')
  const [converting, setConverting] = createSignal(false)
  const [svgPreviewUrl, setSvgPreviewUrl] = createSignal<string>()
  const [ratio, setRatio] = createSignal(true)
  const [globalWidth, setGlobalWidth] = createSignal<number>()
  const [globalHeight, setGlobalHeight] = createSignal<number>()

  const addFiles = (newFiles: File[]) => {
    const imageFiles = newFiles.filter(f => f.type.startsWith('image/'))

    if (imageFiles.length === 0) {
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

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles)
    addFiles(newFiles)
  }

  // Generate SVG preview when SVG options change
  createEffect(() => {
    const svgImage = images.find(img => img.file.type.includes('svg'))
    if (!svgImage) {
      setSvgPreviewUrl(undefined)
      return
    }

    const generatePreview = async () => {
      try {
        const result = await convertImage(svgImage.file, targetFormat(), {
          quality: quality() / 100,
          width: 200,
          height: 200,
          maintainAspectRatio: true,
          svgBackgroundColor: svgBackgroundColor() || undefined,
          svgColor: svgColor() || undefined,
          svgStrokeColor: svgStrokeColor() || undefined,
        })

        const oldUrl = svgPreviewUrl()
        if (oldUrl) {
          URL.revokeObjectURL(oldUrl)
        }

        setSvgPreviewUrl(result.dataUrl)
      } catch (error) {
        console.error('Failed to generate SVG preview:', error)
      }
    }

    generatePreview()
  })

  // Cleanup preview URLs on unmount
  onCleanup(() => {
    images.forEach(img => URL.revokeObjectURL(img.previewUrl))
    const previewUrl = svgPreviewUrl()
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
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
          svgBackgroundColor: isSvg && svgBackgroundColor() ? svgBackgroundColor() : undefined,
          svgColor: isSvg && svgColor() ? svgColor() : undefined,
          svgStrokeColor: isSvg && svgStrokeColor() ? svgStrokeColor() : undefined,
        })

        const filename = img.file.name.replace(/\.[^.]+$/, `.${getFileExtension(targetFormat())}`)
        downloadFile(result.blob, filename)
      }

      toast.success(`Downloaded ${images.length} image${images.length > 1 ? 's' : ''}`)
    } catch (error) {
      toast.error('Conversion failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setConverting(false)
    }
  }

  const hasSvgFiles = () => images.some(img => img.file.type.includes('svg'))

  const updateImage = (id: string, updates: Partial<ImageFileData>) => {
    setImages(prev => prev.id === id, updates)
  }

  const handleRemoveImage = (id: string) => {
    const img = images.find(i => i.id === id)
    if (img) {
      URL.revokeObjectURL(img.previewUrl)
      setImages(prev => prev.filter(i => i.id !== id))
      setFiles(prev => prev.filter(f => f !== img.file))
    }
  }

  const handleGlobalWidthChange = (width?: number) => {
    setGlobalWidth(width)

    if (!width) {
      setGlobalHeight(undefined)
      images.forEach((img) => {
        updateImage(img.id, { targetWidth: undefined, targetHeight: undefined })
      })
      return
    }

    // Calculate average aspect ratio from all images with origin data
    if (ratio() && images.length > 0) {
      const imagesWithOrigin = images.filter(img => img.origin)
      if (imagesWithOrigin.length > 0) {
        const avgAspectRatio = imagesWithOrigin.reduce((sum, img) => {
          return sum + (img.origin!.width / img.origin!.height)
        }, 0) / imagesWithOrigin.length
        setGlobalHeight(Math.round(width / avgAspectRatio))
      }
    }

    // Update all images
    images.forEach((img) => {
      if (img.origin) {
        const updates: Partial<ImageFileData> = { targetWidth: width }

        if (ratio()) {
          const aspectRatio = img.origin.width / img.origin.height
          updates.targetHeight = Math.round(width / aspectRatio)
        }

        updateImage(img.id, updates)
      }
    })
  }

  const handleGlobalHeightChange = (height?: number) => {
    setGlobalHeight(height)

    if (!height) {
      setGlobalWidth(undefined)
      images.forEach((img) => {
        updateImage(img.id, { targetWidth: undefined, targetHeight: undefined })
      })
      return
    }

    // Calculate average aspect ratio from all images with origin data
    if (ratio() && images.length > 0) {
      const imagesWithOrigin = images.filter(img => img.origin)
      if (imagesWithOrigin.length > 0) {
        const avgAspectRatio = imagesWithOrigin.reduce((sum, img) => {
          return sum + (img.origin!.width / img.origin!.height)
        }, 0) / imagesWithOrigin.length
        setGlobalWidth(Math.round(height * avgAspectRatio))
      }
    }

    // Update all images
    images.forEach((img) => {
      if (img.origin) {
        const updates: Partial<ImageFileData> = { targetHeight: height }

        if (ratio()) {
          const aspectRatio = img.origin.width / img.origin.height
          updates.targetWidth = Math.round(height * aspectRatio)
        }

        updateImage(img.id, updates)
      }
    })
  }

  return (
    <div class="gap-6 grid grid-cols-1 xl:grid-cols-[1fr_450px]">
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
            <OutputSettings
              targetFormat={targetFormat()}
              onFormatChange={setTargetFormat}
              quality={quality()}
              onQualityChange={setQuality}
              ratio={ratio()}
              onRatioChange={setRatio}
              globalWidth={globalWidth()}
              onGlobalWidthChange={handleGlobalWidthChange}
              globalHeight={globalHeight()}
              onGlobalHeightChange={handleGlobalHeightChange}
            />
          )}
        />

        <Show when={hasSvgFiles()}>
          <Card
            title="SVG Options"
            content={(
              <SvgOptions
                previewUrl={svgPreviewUrl()}
                backgroundColor={svgBackgroundColor()}
                onBackgroundColorChange={setSvgBackgroundColor}
                fillColor={svgColor()}
                onFillColorChange={setSvgColor}
                strokeColor={svgStrokeColor()}
                onStrokeColorChange={setSvgStrokeColor}
                onReset={() => {
                  setSvgBackgroundColor('')
                  setSvgColor('')
                  setSvgStrokeColor('')
                }}
              />
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
