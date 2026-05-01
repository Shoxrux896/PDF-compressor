/**
 * Automatically crops white/empty edges from an image canvas.
 * Simulates a scanner's auto-crop feature.
 * 
 * @param canvas - The source canvas
 * @param threshold - Brightness threshold (0-255) to consider as "white". Default 240.
 * @param padding - Optional padding to keep around the content. Default 2px.
 * @returns A new cropped canvas, or the original if no content found.
 */
export function autoCropCanvas(
  canvas: HTMLCanvasElement,
  threshold: number = 240,
  padding: number = 2
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const width = canvas.width;
  const height = canvas.height;
  
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;
  let hasContent = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];

      if (r < threshold || g < threshold || b < threshold) {
        hasContent = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!hasContent) {
    return canvas;
  }

  const paddedMinX = Math.max(0, minX - padding);
  const paddedMinY = Math.max(0, minY - padding);
  const paddedMaxX = Math.min(width, maxX + padding);
  const paddedMaxY = Math.min(height, maxY + padding);

  const cropWidth = paddedMaxX - paddedMinX;
  const cropHeight = paddedMaxY - paddedMinY;

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = cropWidth;
  croppedCanvas.height = cropHeight;
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) return canvas;

  croppedCtx.drawImage(
    canvas,
    paddedMinX, paddedMinY, cropWidth, cropHeight,
    0, 0, cropWidth, cropHeight
  );

  return croppedCanvas;
}