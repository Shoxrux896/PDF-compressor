import imageCompression from "browser-image-compression"
import { PDFDocument, PageSizes, degrees } from "pdf-lib"

export interface PdfOptions {
  pageSize: 'a4' | 'letter' | 'auto'
  orientation: 'portrait' | 'landscape'
  margin: 'none' | 'small' | 'normal'
}

export interface PdfImageItem {
  file: File
  rotation: number
}

const PAGE_SIZES = {
  a4: PageSizes.A4,
  letter: PageSizes.Letter,
}

const MARGINS = {
  none: 0,
  small: 20,
  normal: 50,
}

export async function imgToPdf(
  items: PdfImageItem[],
  quality: number,
  options: PdfOptions,
  onProgress?: (percent: number) => void
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()

  // Phase 1: Compress all images in parallel for maximum speed
  const compressOptions = {
    maxSizeMB: quality / 100,
    useWebWorker: true,
  }
  const compressedFiles = await Promise.all(
    items.map(({ file }) => imageCompression(file, compressOptions))
  )

  // Phase 2: Embed images and build PDF pages sequentially (pdf-lib requires this)
  for (let i = 0; i < items.length; i++) {
    const { rotation } = items[i]
    const compressed = compressedFiles[i]

    const buffer = await compressed.arrayBuffer()
    let image
    if (compressed.type === 'image/png') {
      image = await pdfDoc.embedPng(buffer)
    } else {
      image = await pdfDoc.embedJpg(buffer)
    }

    // Determine page dimensions
    let pageWidth, pageHeight
    const isRotated = rotation % 180 !== 0

    if (options.pageSize === 'auto') {
      // Auto: Page matches image size (considering rotation)
      pageWidth = isRotated ? image.height : image.width
      pageHeight = isRotated ? image.width : image.height
    } else {
      // A4 / Letter
      const size = PAGE_SIZES[options.pageSize]
      if (options.orientation === 'portrait') {
        pageWidth = size[0]
        pageHeight = size[1]
      } else {
        pageWidth = size[1]
        pageHeight = size[0]
      }
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight])

    const margin = options.pageSize === 'auto' ? 0 : MARGINS[options.margin]
    const availableWidth = pageWidth - (margin * 2)
    const availableHeight = pageHeight - (margin * 2)

    // If rotated 90/270, swap width/height for fitting calculations
    const imgW = isRotated ? image.height : image.width
    const imgH = isRotated ? image.width : image.height

    const scale = Math.min(
      availableWidth / imgW,
      availableHeight / imgH,
      1 // Don't upscale
    )

    const dims = image.scale(scale)
    const w = dims.width
    const h = dims.height

    const centerX = pageWidth / 2
    const centerY = pageHeight / 2

    // Adjust x,y so the image is visually centered after rotation.
    // pdf-lib's drawImage 'rotate' rotates CW around the bottom-left corner of the image rect.
    let x = 0, y = 0
    if (rotation === 0) {
      x = centerX - w / 2
      y = centerY - h / 2
    } else if (rotation === 90) {
      x = centerX + h / 2
      y = centerY - w / 2
    } else if (rotation === 180) {
      x = centerX + w / 2
      y = centerY + h / 2
    } else if (rotation === 270) {
      x = centerX - h / 2
      y = centerY + w / 2
    }

    page.drawImage(image, {
      x,
      y,
      width: w,
      height: h,
      rotate: degrees(rotation),
    })

    if (onProgress) {
      onProgress(Math.round(((i + 1) / items.length) * 100))
    }
  }

  return await pdfDoc.save()
}

