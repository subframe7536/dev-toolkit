export interface ConversionOptions {
  quality?: number // 0-1 for lossy formats
  width?: number
  height?: number
  maintainAspectRatio?: boolean
  svgBackgroundColor?: string // Background color for SVG conversion
  svgColor?: string // Fill color for SVG elements
}

export type ImageFormat = 'png' | 'jpg' | 'webp' | 'svg'

export interface ConversionResult {
  blob: Blob
  dataUrl: string
  width: number
  height: number
}

/**
 * Convert image from one format to another
 */
export async function convertImage(
  file: File,
  targetFormat: ImageFormat,
  options: ConversionOptions = {},
): Promise<ConversionResult> {
  const sourceFormat = getImageFormat(file.type)

  if (sourceFormat === 'svg' && targetFormat !== 'svg') {
    return convertFromSVG(file, targetFormat, options)
  }

  if (targetFormat === 'svg') {
    throw new Error('Converting to SVG is not supported')
  }

  return convertRasterImage(file, targetFormat, options)
}

/**
 * Convert SVG to raster format
 */
async function convertFromSVG(
  file: File,
  targetFormat: ImageFormat,
  options: ConversionOptions,
): Promise<ConversionResult> {
  let svgText = await file.text()

  // Apply color modifications if specified
  if (options.svgColor) {
    svgText = applySVGColor(svgText, options.svgColor)
  }

  const img = await loadSVGImage(svgText)

  const { width, height } = calculateDimensions(
    img.width,
    img.height,
    options.width,
    options.height,
    options.maintainAspectRatio ?? true,
  )

  return renderToCanvas(img, width, height, targetFormat, options.quality ?? 0.92, options.svgBackgroundColor)
}

/**
 * Convert between raster formats
 */
async function convertRasterImage(
  file: File,
  targetFormat: ImageFormat,
  options: ConversionOptions,
): Promise<ConversionResult> {
  const img = await loadImage(file)

  const { width, height } = calculateDimensions(
    img.naturalWidth,
    img.naturalHeight,
    options.width,
    options.height,
    options.maintainAspectRatio ?? true,
  )

  return renderToCanvas(img, width, height, targetFormat, options.quality ?? 0.92)
}

/**
 * Load SVG as image
 */
function loadSVGImage(svgText: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const blob = new Blob([svgText], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load SVG'))
    }
    img.src = url
  })
}

/**
 * Load raster image
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

/**
 * Calculate output dimensions
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  targetWidth?: number,
  targetHeight?: number,
  maintainAspectRatio = true,
): { width: number, height: number } {
  if (!targetWidth && !targetHeight) {
    return { width: originalWidth, height: originalHeight }
  }

  if (!maintainAspectRatio) {
    return {
      width: targetWidth ?? originalWidth,
      height: targetHeight ?? originalHeight,
    }
  }

  const aspectRatio = originalWidth / originalHeight

  if (targetWidth && targetHeight) {
    // Both specified - use the one that results in smaller output
    const widthBasedHeight = targetWidth / aspectRatio
    if (widthBasedHeight <= targetHeight) {
      return { width: targetWidth, height: widthBasedHeight }
    }
    return { width: targetHeight * aspectRatio, height: targetHeight }
  }

  if (targetWidth) {
    return { width: targetWidth, height: targetWidth / aspectRatio }
  }

  return { width: targetHeight! * aspectRatio, height: targetHeight! }
}

/**
 * Render image to canvas and export
 */
function renderToCanvas(
  img: HTMLImageElement,
  width: number,
  height: number,
  format: ImageFormat,
  quality: number,
  backgroundColor?: string,
): Promise<ConversionResult> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('Failed to get canvas context'))
      return
    }

    // Fill background if specified
    if (backgroundColor) {
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, width, height)
    }

    ctx.drawImage(img, 0, 0, width, height)

    const mimeType = getMimeType(format)
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to convert image'))
          return
        }

        const dataUrl = canvas.toDataURL(mimeType, quality)
        resolve({ blob, dataUrl, width, height })
      },
      mimeType,
      quality,
    )
  })
}

/**
 * Get image format from MIME type
 */
function getImageFormat(mimeType: string): ImageFormat {
  if (mimeType.includes('svg')) {
    return 'svg'
  }
  if (mimeType.includes('png')) {
    return 'png'
  }
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
    return 'jpg'
  }
  if (mimeType.includes('webp')) {
    return 'webp'
  }
  throw new Error(`Unsupported image format: ${mimeType}`)
}

/**
 * Get MIME type for format
 */
export function getMimeType(format: ImageFormat): string {
  switch (format) {
    case 'png': return 'image/png'
    case 'jpg': return 'image/jpeg'
    case 'webp': return 'image/webp'
    case 'svg': return 'image/svg+xml'
  }
}

/**
 * Get file extension for format
 */
export function getFileExtension(format: ImageFormat): string {
  return format === 'jpg' ? 'jpg' : format
}

/**
 * Apply color to SVG elements
 */
function applySVGColor(svgText: string, color: string): string {
  // Parse SVG and add fill attribute to paths and shapes
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgText, 'image/svg+xml')
  const svg = doc.documentElement

  // Apply color to all fillable elements
  const fillableElements = svg.querySelectorAll('path, circle, rect, ellipse, polygon, polyline')
  fillableElements.forEach((el) => {
    if (!el.getAttribute('fill') || el.getAttribute('fill') === 'currentColor') {
      el.setAttribute('fill', color)
    }
  })

  return new XMLSerializer().serializeToString(svg)
}
