export interface BackgroundBoxParams {
  textWidth: number
  textHeight: number
  padding: number
  borderRadius?: number
  scale?: number
}

export interface BackgroundBoxResult {
  x: number
  y: number
  width: number
  height: number
  cornerRadius: number
}

/**
 * Calculates Konva.Rect bounding box coordinates and dimensions for text background.
 * Matches Konva coordinate space where text origin is at (0, 0).
 */
export function calculateBackgroundBox({
  textWidth,
  textHeight,
  padding,
  borderRadius = 0,
  scale = 1,
}: BackgroundBoxParams): BackgroundBoxResult {
  const safeTextWidth = Math.max(0, textWidth)
  const safeTextHeight = Math.max(0, textHeight)
  const safeScale = Math.max(0, scale)
  const scaledPadding = Math.max(0, padding) * safeScale
  const scaledRadius = Math.max(0, borderRadius) * safeScale

  const width = safeTextWidth + scaledPadding * 2
  const height = safeTextHeight + scaledPadding * 2
  // Max border radius shouldn't exceed half the min dimension
  const maxRadius = Math.min(width, height) / 2
  const cornerRadius = Math.min(scaledRadius, maxRadius)

  const offset = scaledPadding === 0 ? 0 : -scaledPadding

  return {
    x: offset,
    y: offset,
    width,
    height,
    cornerRadius,
  }
}
