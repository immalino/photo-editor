export interface CanvasFitResult {
  scale: number
  x: number
  y: number
  renderedWidth: number
  renderedHeight: number
}

/**
 * Calculates scale factor and offset to center an image inside a container
 * without cropping or distorting aspect ratio (letterbox / contain).
 */
export function calculateFitScale(
  containerW: number,
  containerH: number,
  imageW: number,
  imageH: number,
  padding: number = 0
): CanvasFitResult {
  if (containerW <= 0 || containerH <= 0 || imageW <= 0 || imageH <= 0) {
    return {
      scale: 1,
      x: 0,
      y: 0,
      renderedWidth: 0,
      renderedHeight: 0,
    }
  }

  const effectivePadding = Math.max(0, padding)
  const availableW = Math.max(0, containerW - effectivePadding * 2)
  const availableH = Math.max(0, containerH - effectivePadding * 2)

  if (availableW <= 0 || availableH <= 0) {
    return {
      scale: 0,
      x: containerW / 2,
      y: containerH / 2,
      renderedWidth: 0,
      renderedHeight: 0,
    }
  }

  const scale = Math.min(availableW / imageW, availableH / imageH)
  const renderedWidth = imageW * scale
  const renderedHeight = imageH * scale
  const x = (containerW - renderedWidth) / 2
  const y = (containerH - renderedHeight) / 2

  return {
    scale,
    x,
    y,
    renderedWidth,
    renderedHeight,
  }
}

/**
 * Converts relative coordinates (0 to 1 percentage of image) to canvas stage pixel coordinates.
 */
export function relativeToCanvas(
  relX: number,
  relY: number,
  fit: CanvasFitResult
): { x: number; y: number } {
  return {
    x: fit.x + relX * fit.renderedWidth,
    y: fit.y + relY * fit.renderedHeight,
  }
}

/**
 * Converts canvas stage pixel coordinates to relative percentage (0 to 1) of the image.
 */
export function canvasToRelative(
  canvasX: number,
  canvasY: number,
  fit: CanvasFitResult
): { relX: number; relY: number } {
  if (fit.renderedWidth === 0 || fit.renderedHeight === 0) {
    return { relX: 0, relY: 0 }
  }

  return {
    relX: (canvasX - fit.x) / fit.renderedWidth,
    relY: (canvasY - fit.y) / fit.renderedHeight,
  }
}
