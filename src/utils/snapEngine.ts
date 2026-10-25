import type { TextLayer } from '../types/layer'
import { calculateBackgroundBox } from './layerBounds'
import { resolveFontSize, resolveBackground } from './unitMath'

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export type SnapLineOrientation = 'vertical' | 'horizontal'

export type SnapTargetType =
  | 'photo-center-x'
  | 'photo-center-y'
  | 'photo-edge-left'
  | 'photo-edge-right'
  | 'photo-edge-top'
  | 'photo-edge-bottom'
  | 'layer-center-x'
  | 'layer-center-y'

export interface SnapGuide {
  orientation: SnapLineOrientation
  position: number
  targetType: SnapTargetType
  start: number
  end: number
}

export interface SnapResult {
  snappedX: number
  snappedY: number
  deltaX: number
  deltaY: number
  guides: SnapGuide[]
}

export interface SnapOptions {
  draggedBounds: BoundingBox
  photoBounds: BoundingBox
  threshold: number
  snapToCenter?: boolean
  snapToEdges?: boolean
}

let _measureCanvas: HTMLCanvasElement | null = null
let _measureCtx: CanvasRenderingContext2D | null = null

function getMeasureContext(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null
  if (!_measureCanvas) {
    _measureCanvas = document.createElement('canvas')
    _measureCtx = _measureCanvas.getContext('2d')
  }
  return _measureCtx
}

/**
 * Accurately measures the rendered bounding box dimensions of a TextLayer in pixels and relative units.
 */
export function measureLayerBounds(
  layer: TextLayer,
  photoWidth: number,
  photoHeight: number
): {
  width: number
  height: number
  relWidth: number
  relHeight: number
  offsetX: number
  offsetY: number
} {
  const safeW = Math.max(1, photoWidth)
  const safeH = Math.max(1, photoHeight)

  const fontSize = resolveFontSize(layer, safeW, safeH)
  const fontFamily = layer.style.fontFamily || 'Arial'
  const fontStyle =
    layer.style.bold && layer.style.italic
      ? 'italic bold'
      : layer.style.bold
        ? 'bold'
        : layer.style.italic
          ? 'italic'
          : 'normal'

  const lineHeight = fontSize * 1.2
  const lines = (layer.text || ' ').split('\n')

  const ctx = getMeasureContext()
  const lineMetrics = lines.map((line) => {
    if (ctx) {
      ctx.font = `${fontStyle} ${fontSize}px ${fontFamily}`
      const m = ctx.measureText(line || ' ')
      return m?.width ?? (line.length || 1) * (fontSize * 0.6)
    }
    return (line.length || 1) * (fontSize * 0.6)
  })

  const textWidth = Math.max(1, ...lineMetrics)
  const textHeight = Math.max(1, lines.length * lineHeight)

  let totalWidth = textWidth
  let totalHeight = textHeight
  let offsetX = 0
  let offsetY = 0

  if (layer.style.background?.enabled) {
    const bgRes = resolveBackground(layer, safeW, safeH)
    const bgBox = calculateBackgroundBox({
      textWidth,
      textHeight,
      padding: bgRes.padding,
      borderRadius: bgRes.borderRadius,
      scale: 1,
    })
    totalWidth = bgBox.width
    totalHeight = bgBox.height
    offsetX = bgBox.x
    offsetY = bgBox.y
  }

  return {
    width: totalWidth,
    height: totalHeight,
    relWidth: totalWidth / safeW,
    relHeight: totalHeight / safeH,
    offsetX,
    offsetY,
  }
}

interface SnapCandidate {
  diff: number
  targetCoord: number
  type: SnapTargetType
  priority: number
}

/**
 * Calculates snapping offsets and visual guidelines for a dragged object against a photo bounding box.
 */
export function calculateSnap(options: SnapOptions): SnapResult {
  const {
    draggedBounds,
    photoBounds,
    threshold,
    snapToCenter = true,
    snapToEdges = true,
  } = options

  const guides: SnapGuide[] = []

  // Dragged reference coordinates
  const objLeft = draggedBounds.x
  const objCenterX = draggedBounds.x + draggedBounds.width / 2
  const objRight = draggedBounds.x + draggedBounds.width

  const objTop = draggedBounds.y
  const objCenterY = draggedBounds.y + draggedBounds.height / 2
  const objBottom = draggedBounds.y + draggedBounds.height

  // Photo target stop lines
  const photoLeft = photoBounds.x
  const photoCenterX = photoBounds.x + photoBounds.width / 2
  const photoRight = photoBounds.x + photoBounds.width

  const photoTop = photoBounds.y
  const photoCenterY = photoBounds.y + photoBounds.height / 2
  const photoBottom = photoBounds.y + photoBounds.height

  // 1. Evaluate Vertical Stops (Snaps X)
  const vCandidates: SnapCandidate[] = []

  if (snapToCenter) {
    // Primary: Center to Center
    vCandidates.push({
      diff: photoCenterX - objCenterX,
      targetCoord: photoCenterX,
      type: 'photo-center-x',
      priority: 0,
    })
    // Secondary: Edges to Center
    vCandidates.push({
      diff: photoCenterX - objLeft,
      targetCoord: photoCenterX,
      type: 'photo-center-x',
      priority: 2,
    })
    vCandidates.push({
      diff: photoCenterX - objRight,
      targetCoord: photoCenterX,
      type: 'photo-center-x',
      priority: 2,
    })
  }

  if (snapToEdges) {
    // Left edge to Photo Left
    vCandidates.push({
      diff: photoLeft - objLeft,
      targetCoord: photoLeft,
      type: 'photo-edge-left',
      priority: 0,
    })
    // Right edge to Photo Right
    vCandidates.push({
      diff: photoRight - objRight,
      targetCoord: photoRight,
      type: 'photo-edge-right',
      priority: 0,
    })
    // Center to Photo Left / Right
    vCandidates.push({
      diff: photoLeft - objCenterX,
      targetCoord: photoLeft,
      type: 'photo-edge-left',
      priority: 2,
    })
    vCandidates.push({
      diff: photoRight - objCenterX,
      targetCoord: photoRight,
      type: 'photo-edge-right',
      priority: 2,
    })
  }

  // Filter within threshold and sort
  const eligibleV = vCandidates
    .filter((c) => Math.abs(c.diff) <= threshold)
    .sort((a, b) => {
      const distA = Math.abs(a.diff)
      const distB = Math.abs(b.diff)
      if (Math.abs(distA - distB) < 0.0001) {
        return a.priority - b.priority
      }
      return distA - distB
    })

  let deltaX = 0
  if (eligibleV.length > 0) {
    const best = eligibleV[0]
    deltaX = best.diff
    guides.push({
      orientation: 'vertical',
      position: best.targetCoord,
      targetType: best.type,
      start: photoBounds.y,
      end: photoBounds.y + photoBounds.height,
    })
  }

  // 2. Evaluate Horizontal Stops (Snaps Y)
  const hCandidates: SnapCandidate[] = []

  if (snapToCenter) {
    // Primary: Center to Center
    hCandidates.push({
      diff: photoCenterY - objCenterY,
      targetCoord: photoCenterY,
      type: 'photo-center-y',
      priority: 0,
    })
    // Secondary: Edges to Center
    hCandidates.push({
      diff: photoCenterY - objTop,
      targetCoord: photoCenterY,
      type: 'photo-center-y',
      priority: 2,
    })
    hCandidates.push({
      diff: photoCenterY - objBottom,
      targetCoord: photoCenterY,
      type: 'photo-center-y',
      priority: 2,
    })
  }

  if (snapToEdges) {
    // Top edge to Photo Top
    hCandidates.push({
      diff: photoTop - objTop,
      targetCoord: photoTop,
      type: 'photo-edge-top',
      priority: 0,
    })
    // Bottom edge to Photo Bottom
    hCandidates.push({
      diff: photoBottom - objBottom,
      targetCoord: photoBottom,
      type: 'photo-edge-bottom',
      priority: 0,
    })
    // Center to Photo Top / Bottom
    hCandidates.push({
      diff: photoTop - objCenterY,
      targetCoord: photoTop,
      type: 'photo-edge-top',
      priority: 2,
    })
    hCandidates.push({
      diff: photoBottom - objCenterY,
      targetCoord: photoBottom,
      type: 'photo-edge-bottom',
      priority: 2,
    })
  }

  const eligibleH = hCandidates
    .filter((c) => Math.abs(c.diff) <= threshold)
    .sort((a, b) => {
      const distA = Math.abs(a.diff)
      const distB = Math.abs(b.diff)
      if (Math.abs(distA - distB) < 0.0001) {
        return a.priority - b.priority
      }
      return distA - distB
    })

  let deltaY = 0
  if (eligibleH.length > 0) {
    const best = eligibleH[0]
    deltaY = best.diff
    guides.push({
      orientation: 'horizontal',
      position: best.targetCoord,
      targetType: best.type,
      start: photoBounds.x,
      end: photoBounds.x + photoBounds.width,
    })
  }

  return {
    snappedX: draggedBounds.x + deltaX,
    snappedY: draggedBounds.y + deltaY,
    deltaX,
    deltaY,
    guides,
  }
}

export type AlignmentPreset =
  | 'center'
  | 'center-h'
  | 'center-v'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

/**
 * Calculates true alignment coordinates (relativeX and relativeY) for a layer
 * taking into account its measured dimensions and background offset.
 */
export function getPresetAlignmentPosition(
  layer: TextLayer,
  photoWidth: number,
  photoHeight: number,
  preset: AlignmentPreset,
  safeMarginRatio: number = 0.05
): { relativeX: number; relativeY: number } {
  const { width, height, offsetX, offsetY } = measureLayerBounds(layer, photoWidth, photoHeight)

  const marginX = photoWidth * safeMarginRatio
  const marginY = photoHeight * safeMarginRatio

  // Origin to center distance
  const centerOffsetX = width / 2 + offsetX
  const centerOffsetY = height / 2 + offsetY

  const centerX = 0.5 - centerOffsetX / photoWidth
  const centerY = 0.5 - centerOffsetY / photoHeight

  const leftEdge = (marginX - offsetX) / photoWidth
  const rightEdge = (photoWidth - marginX - width - offsetX) / photoWidth
  const topEdge = (marginY - offsetY) / photoHeight
  const bottomEdge = (photoHeight - marginY - height - offsetY) / photoHeight

  let newX = layer.relativeX
  let newY = layer.relativeY

  switch (preset) {
    case 'center':
      newX = centerX
      newY = centerY
      break
    case 'center-h':
      newX = centerX
      break
    case 'center-v':
      newY = centerY
      break
    case 'left':
    case 'middle-left':
      newX = leftEdge
      if (preset === 'middle-left') newY = centerY
      break
    case 'right':
    case 'middle-right':
      newX = rightEdge
      if (preset === 'middle-right') newY = centerY
      break
    case 'top':
    case 'top-center':
      newY = topEdge
      if (preset === 'top-center') newX = centerX
      break
    case 'bottom':
    case 'bottom-center':
      newY = bottomEdge
      if (preset === 'bottom-center') newX = centerX
      break
    case 'top-left':
      newX = leftEdge
      newY = topEdge
      break
    case 'top-right':
      newX = rightEdge
      newY = topEdge
      break
    case 'bottom-left':
      newX = leftEdge
      newY = bottomEdge
      break
    case 'bottom-right':
      newX = rightEdge
      newY = bottomEdge
      break
  }

  return {
    relativeX: Number(Math.max(-0.5, Math.min(1.5, newX)).toFixed(5)),
    relativeY: Number(Math.max(-0.5, Math.min(1.5, newY)).toFixed(5)),
  }
}

