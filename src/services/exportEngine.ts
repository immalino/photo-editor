import type { ExportConfig, ExportFormat } from '../types/export'
import type { PhotoItem } from '../types/photo'
import type { TextLayer } from '../types/layer'
import { calculateBackgroundBox } from '../utils/layerBounds'
import { resolveDynamicText } from '../utils/dynamicText'
import {
  resolveFontSize,
  resolveStrokeWidth,
  resolveShadow,
  resolveBackground,
} from '../utils/unitMath'

/**
 * Normalizes export quality value (0.01 to 1.0).
 * Supports both percentage input (1 to 100) and decimal (0.01 to 1.0).
 */
export function normalizeExportQuality(quality: number): number {
  if (typeof quality !== 'number' || Number.isNaN(quality)) {
    return 0.92
  }
  const val = quality > 1 ? quality / 100 : quality
  return Math.min(1.0, Math.max(0.01, val))
}

/**
 * Returns corresponding MIME type for an export format.
 */
export function getMimeType(format: ExportFormat): string {
  switch (format) {
    case 'jpg':
      return 'image/jpeg'
    case 'webp':
      return 'image/webp'
    case 'png':
    default:
      return 'image/png'
  }
}

/**
 * Calculates absolute pixel position from relative percentage coordinates.
 */
export function calculateAbsolutePosition(
  relX: number,
  relY: number,
  width: number,
  height: number
): { x: number; y: number } {
  return {
    x: Math.round(relX * width),
    y: Math.round(relY * height),
  }
}

/**
 * Draws a rounded rectangle path on a 2D canvas context.
 */
export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath()
    ctx.roundRect(x, y, width, height, radius)
    return
  }

  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

/**
 * Loads an HTMLImageElement asynchronously from a source URL.
 */
export function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image from URL: ${url}`))
    img.src = url
  })
}

/**
 * Renders a single text layer onto the canvas 2D context at 1:1 original photo scale.
 */
function renderSingleTextLayer(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer,
  photoWidth: number,
  photoHeight: number
): void {
  const pos = calculateAbsolutePosition(layer.relativeX, layer.relativeY, photoWidth, photoHeight)
  const fontStyle =
    layer.style.bold && layer.style.italic
      ? 'italic bold'
      : layer.style.bold
        ? 'bold'
        : layer.style.italic
          ? 'italic'
          : 'normal'
  const fontSize = resolveFontSize(layer, photoWidth, photoHeight)
  const fontFamily = layer.style.fontFamily || 'Arial'
  const lineHeight = fontSize * 1.2
  const lines = (layer.text || '').split('\n')

  ctx.save()
  ctx.translate(pos.x, pos.y)

  if (layer.rotation) {
    ctx.rotate((layer.rotation * Math.PI) / 180)
  }

  ctx.font = `${fontStyle} ${fontSize}px ${fontFamily}`
  ctx.textBaseline = 'top'

  // Measure line widths for alignment and background box
  const lineMetrics = lines.map((line) => {
    if (typeof ctx.measureText === 'function') {
      const metric = ctx.measureText(line)
      return metric?.width ?? line.length * (fontSize * 0.6)
    }
    return line.length * (fontSize * 0.6)
  })

  const maxLineWidth = Math.max(1, ...lineMetrics)
  const totalTextHeight = lines.length * lineHeight

  // Draw background box if enabled
  if (layer.style.background?.enabled) {
    const bg = layer.style.background
    const bgRes = resolveBackground(layer, photoWidth, photoHeight)
    const bgBox = calculateBackgroundBox({
      textWidth: maxLineWidth,
      textHeight: totalTextHeight,
      padding: bgRes.padding,
      borderRadius: bgRes.borderRadius,
      scale: 1,
    })

    ctx.save()
    ctx.globalAlpha = (layer.style.opacity ?? 1) * (bg.opacity ?? 1)
    ctx.fillStyle = bg.color
    drawRoundedRect(ctx, bgBox.x, bgBox.y, bgBox.width, bgBox.height, bgBox.cornerRadius)
    ctx.fill()
    ctx.restore()
  }

  // Draw each text line
  ctx.globalAlpha = layer.style.opacity ?? 1

  const shadowRes = resolveShadow(layer, photoWidth, photoHeight)
  const strokeWidth = resolveStrokeWidth(layer, photoWidth, photoHeight)

  lines.forEach((line, index) => {
    let lineX = 0
    if (layer.style.align === 'center') {
      lineX = (maxLineWidth - lineMetrics[index]) / 2
    } else if (layer.style.align === 'right') {
      lineX = maxLineWidth - lineMetrics[index]
    }
    const lineY = index * lineHeight

    // Configure shadow
    if (layer.style.shadow?.enabled) {
      ctx.shadowColor = layer.style.shadow.color
      ctx.shadowBlur = shadowRes.blur
      ctx.shadowOffsetX = shadowRes.offsetX
      ctx.shadowOffsetY = shadowRes.offsetY
    } else {
      ctx.shadowColor = 'transparent'
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
    }

    // Configure stroke
    if (layer.style.stroke?.enabled && strokeWidth > 0) {
      ctx.strokeStyle = layer.style.stroke.color
      ctx.lineWidth = strokeWidth * 2
      ctx.strokeText(line, lineX, lineY)

      // Avoid double shadow on fill after stroke
      if (layer.style.shadow?.enabled) {
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
      }
    }

    // Fill main text
    ctx.fillStyle = layer.style.fill
    ctx.fillText(line, lineX, lineY)
  })

  ctx.restore()
}

/**
 * High-resolution rendering engine.
 * Renders the photo and all visible text layers at 100% original resolution onto an offscreen canvas,
 * and exports the result as a Blob.
 */
export async function renderPhotoWithLayers(
  photo: PhotoItem,
  layers: TextLayer[],
  config: ExportConfig,
  customCanvas?: HTMLCanvasElement
): Promise<Blob> {
  const width = photo.originalWidth
  const height = photo.originalHeight

  const canvas = customCanvas || document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Canvas 2D context is not supported or failed to initialize')
  }

  // Wait for all active web fonts to load
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready
    } catch {
      // Continue rendering if font ready check fails
    }
  }

  // Load and draw original photo
  const img = await loadImageElement(photo.url)
  ctx.drawImage(img, 0, 0, width, height)

  // Sort visible layers by zIndex
  const visibleLayers = layers
    .filter((l) => l.visible !== false)
    .sort((a, b) => a.zIndex - b.zIndex)

  // Render all text layers (resolving dynamic random numbers per export)
  for (const layer of visibleLayers) {
    const layerToRender: TextLayer = {
      ...layer,
      text: resolveDynamicText(layer.text),
    }
    renderSingleTextLayer(ctx, layerToRender, width, height)
  }

  const mimeType = getMimeType(config.format)
  const quality = normalizeExportQuality(config.quality)

  return new Promise<Blob>((resolve, reject) => {
    if (typeof canvas.toBlob === 'function') {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to generate image blob from canvas'))
          }
        },
        mimeType,
        quality
      )
    } else {
      reject(new Error('canvas.toBlob is not supported in current environment'))
    }
  })
}

