export interface SpacingSides {
  top: number
  right: number
  bottom: number
  left: number
}

export interface BackgroundBoxParams {
  textWidth: number
  textHeight: number
  padding: number | SpacingSides
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

  const isUniform = typeof padding === 'number'
  const padTop = (isUniform ? Math.max(0, padding) : Math.max(0, padding.top)) * safeScale
  const padRight = (isUniform ? Math.max(0, padding) : Math.max(0, padding.right)) * safeScale
  const padBottom = (isUniform ? Math.max(0, padding) : Math.max(0, padding.bottom)) * safeScale
  const padLeft = (isUniform ? Math.max(0, padding) : Math.max(0, padding.left)) * safeScale

  const scaledRadius = Math.max(0, borderRadius) * safeScale

  const width = safeTextWidth + padLeft + padRight
  const height = safeTextHeight + padTop + padBottom
  // Max border radius shouldn't exceed half the min dimension
  const maxRadius = Math.min(width, height) / 2
  const cornerRadius = Math.min(scaledRadius, maxRadius)

  return {
    x: padLeft === 0 ? 0 : -padLeft,
    y: padTop === 0 ? 0 : -padTop,
    width,
    height,
    cornerRadius,
  }
}
