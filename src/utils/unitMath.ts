import type {
  DimensionReference,
  SizeUnit,
  TextLayer,
} from '../types/layer'

/**
 * Returns the relevant photo dimension (width or height) based on reference mode.
 * Defaults to 'width'.
 */
export function resolveDimensionBasis(
  ref: DimensionReference | undefined,
  width: number,
  height: number
): number {
  return ref === 'height' ? Math.max(1, height) : Math.max(1, width)
}

/**
 * Converts a pixel value to a percentage value relative to the basis.
 */
export function pxToPercent(px: number, basis: number): number {
  if (basis <= 0) return 0
  return Number(((px / basis) * 100).toFixed(2))
}

/**
 * Converts a percentage value to a pixel value relative to the basis.
 */
export function percentToPx(pct: number, basis: number): number {
  if (basis <= 0) return 0
  return Math.round((pct / 100) * basis)
}

/**
 * Resolves a generic size (px or %) given current style configuration and photo dimensions.
 */
export function resolveEffectiveSize(
  unit: SizeUnit | undefined,
  pxValue: number,
  percentValue: number | undefined,
  ref: DimensionReference | undefined,
  photoWidth: number,
  photoHeight: number,
  minVal = 0
): number {
  if (unit === '%') {
    const basis = resolveDimensionBasis(ref, photoWidth, photoHeight)
    const pct =
      typeof percentValue === 'number'
        ? percentValue
        : pxToPercent(pxValue, basis)
    const computed = (pct / 100) * basis
    return Math.max(minVal, computed)
  }
  return Math.max(minVal, pxValue)
}

/**
 * Resolves effective font size in pixels for a given photo or rendered dimension.
 */
export function resolveFontSize(
  layer: TextLayer,
  photoWidth: number,
  photoHeight: number
): number {
  const { fontSize, fontSizeUnit, fontSizeRef, fontSizePercent } = layer.style
  const size = resolveEffectiveSize(
    fontSizeUnit,
    fontSize,
    fontSizePercent,
    fontSizeRef,
    photoWidth,
    photoHeight,
    6 // minimum font size
  )
  return Math.max(6, Math.round(size))
}

/**
 * Resolves effective stroke width in pixels.
 */
export function resolveStrokeWidth(
  layer: TextLayer,
  photoWidth: number,
  photoHeight: number
): number {
  const { stroke } = layer.style
  if (!stroke.enabled) return 0

  const width = resolveEffectiveSize(
    stroke.unit,
    stroke.width,
    stroke.widthPercent,
    stroke.ref,
    photoWidth,
    photoHeight,
    0
  )
  return Math.max(1, Math.round(width))
}

/**
 * Resolves effective shadow blur, offsetX, and offsetY in pixels.
 */
export function resolveShadow(
  layer: TextLayer,
  photoWidth: number,
  photoHeight: number
): { blur: number; offsetX: number; offsetY: number } {
  const { shadow } = layer.style
  if (!shadow.enabled) {
    return { blur: 0, offsetX: 0, offsetY: 0 }
  }

  const blur = resolveEffectiveSize(
    shadow.unit,
    shadow.blur,
    shadow.blurPercent,
    shadow.ref,
    photoWidth,
    photoHeight,
    0
  )

  const offsetX = resolveEffectiveSize(
    shadow.unit,
    shadow.offsetX,
    shadow.offsetXPercent,
    shadow.ref,
    photoWidth,
    photoHeight,
    -Infinity
  )

  const offsetY = resolveEffectiveSize(
    shadow.unit,
    shadow.offsetY,
    shadow.offsetYPercent,
    shadow.ref,
    photoWidth,
    photoHeight,
    -Infinity
  )

  return {
    blur: Math.round(blur),
    offsetX: Math.round(offsetX),
    offsetY: Math.round(offsetY),
  }
}

/**
 * Resolves effective background padding and borderRadius in pixels.
 */
export function resolveBackground(
  layer: TextLayer,
  photoWidth: number,
  photoHeight: number
): { padding: number; borderRadius: number } {
  const { background } = layer.style
  if (!background.enabled) {
    return { padding: 0, borderRadius: 0 }
  }

  const padding = resolveEffectiveSize(
    background.unit,
    background.padding,
    background.paddingPercent,
    background.ref,
    photoWidth,
    photoHeight,
    0
  )

  const borderRadius = resolveEffectiveSize(
    background.unit,
    background.borderRadius,
    background.borderRadiusPercent,
    background.ref,
    photoWidth,
    photoHeight,
    0
  )

  return {
    padding: Math.round(padding),
    borderRadius: Math.round(borderRadius),
  }
}

/**
 * Resolves full styling parameters specifically for the scaled preview canvas.
 */
export function resolveCanvasStyle(
  layer: TextLayer,
  fit: { scale: number; renderedWidth: number; renderedHeight: number }
): {
  fontSize: number
  strokeWidth: number
  shadow: { blur: number; offsetX: number; offsetY: number }
  background: { padding: number; borderRadius: number }
} {
  const fontSize =
    layer.style.fontSizeUnit === '%'
      ? resolveFontSize(layer, fit.renderedWidth, fit.renderedHeight)
      : Math.max(8, Math.round(layer.style.fontSize * fit.scale))

  const strokeWidth =
    layer.style.stroke.unit === '%'
      ? resolveStrokeWidth(layer, fit.renderedWidth, fit.renderedHeight)
      : Math.max(1, Math.round(layer.style.stroke.width * fit.scale))

  const shadow =
    layer.style.shadow.unit === '%'
      ? resolveShadow(layer, fit.renderedWidth, fit.renderedHeight)
      : {
          blur: Math.round(layer.style.shadow.blur * fit.scale),
          offsetX: Math.round(layer.style.shadow.offsetX * fit.scale),
          offsetY: Math.round(layer.style.shadow.offsetY * fit.scale),
        }

  const background =
    layer.style.background.unit === '%'
      ? resolveBackground(layer, fit.renderedWidth, fit.renderedHeight)
      : {
          padding: Math.round(layer.style.background.padding * fit.scale),
          borderRadius: Math.round(layer.style.background.borderRadius * fit.scale),
        }

  return { fontSize, strokeWidth, shadow, background }
}
