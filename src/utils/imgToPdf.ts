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

  for (let i = 0; i < items.length; i++) {
    const { file, rotation } = items[i]

    // Compress image
    const compressed = await imageCompression(file, {
      maxSizeMB: quality / 100,
      useWebWorker: true,
      // We don't rotate during compression to keep original data if possible, 
      // but browser-image-compression might obey EXIF. 
      // We'll handle explicit rotation in PDF.
    })

    const buffer = await compressed.arrayBuffer()
    let image
    if (compressed.type === 'image/png') {
      image = await pdfDoc.embedPng(buffer)
    } else {
      image = await pdfDoc.embedJpg(buffer)
    }

    // Determine page dimensions
    let pageWidth, pageHeight

    if (options.pageSize === 'auto') {
      // Auto: Page matches image size (considering rotation)
      const isRotated = rotation % 180 !== 0
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

    // Calculate image dimensions and scale to fit
    // If rotated 90/270, we swap width/height for fitting checks
    const isRotated = rotation % 180 !== 0
    const imgW = isRotated ? image.height : image.width
    const imgH = isRotated ? image.width : image.height

    const scale = Math.min(
      availableWidth / imgW,
      availableHeight / imgH,
      1 // Don't upscale if it fits
    )

    // Drawing logic
    // We need to center the image

    // Center position
    const centerX = pageWidth / 2
    const centerY = pageHeight / 2

    // pdf-lib rotation rotates around the origin (bottom-left of image rect usually), 
    // so it's easiest to rotate and translate.
    // However, drawImage 'rotate' option rotates around the center of the image *if* we specify it?
    // Actually pdf-lib `drawImage` rotation is around the anchor point (default bottom-left).

    // Let's rely on standard calculations.
    // If standard 0 deg:
    // x = (pageWidth - drawWidth) / 2
    // y = (pageHeight - drawHeight) / 2

    // If we use degrees(rotation), we need to adjust x,y because the image pivots around its bottom-left corner.

    const dims = image.scale(scale)

    page.drawImage(image, {
      x: centerX - (dims.width / 2), // This centers it if rotation is 0. 
      y: centerY - (dims.height / 2),
      width: dims.width,
      height: dims.height,
      rotate: degrees(0), // We will handle rotation by transforming dimensions or using the rotation prop properly?
      // Wait, if I rotate using `rotate: degrees(90)`, the image rotates around its bottom-left corner (x,y).
      // So if I want it centered, I need to calculate where that corner should be.
    })

    // Actually, let's just use the `rotation` prop of drawImage, but we need to correct X/Y.
    // Easier approach: Use `page.pushOperators` with transformation matrix? No, too complex.

    // Let's redo the rotation logic simply.
    // We want the final visual to be centered.



    // Dimensions of the bounding box of the rotated image
    // (Since we rotate by 90 increments, exact swap)
    // But we already calculated scale based on swapped dimensions if needed.

    // We want the center of the image to be at (centerX, centerY).
    // The drawImage takes x, y which is bottom-left corner *before* rotation.

    // If rotation is 0:
    // x = centerX - w/2, y = centerY - h/2
    // If rotation is 90:
    // The image is drawn from (x,y) extending +x=width, +y=height. 
    // Rotation 90 moves +x axis to +y axis.
    // So visual bottom-left becomes (x,y). Visual top-left is (x-h, y). etc.
    // Actually simpler:
    // 0: x = cx - w/2, y = cy - h/2
    // 90: x = cx + h/2, y = cy - w/2  (moves 'start' to bottom-right of visual box)
    // 180: x = cx + w/2, y = cy + h/2
    // 270: x = cx - h/2, y = cy + w/2

    const w = dims.width
    const h = dims.height

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

