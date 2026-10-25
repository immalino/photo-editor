import { useRef, useLayoutEffect, useState, useEffect } from 'react'
import { Group, Text, Rect } from 'react-konva'
import type Konva from 'konva'
import type { TextLayer } from '../../types/layer'
import { relativeToCanvas, canvasToRelative, type CanvasFitResult } from '../../utils/scaleMath'
import { calculateBackgroundBox } from '../../utils/layerBounds'
import { resolveCanvasStyle, pxToPercent } from '../../utils/unitMath'
import { calculateSnap } from '../../utils/snapEngine'
import { useSnapStore } from '../../stores/useSnapStore'

export interface CanvasTextLayerProps {
  layer: TextLayer
  fit: CanvasFitResult
  isSelected: boolean
  isEditing?: boolean
  zoom?: number
  onSelect: (layerId: string) => void
  onChange: (updates: Partial<TextLayer>) => void
  onStartEditing?: (layerId: string) => void
}

export function CanvasTextLayer({
  layer,
  fit,
  isSelected: _isSelected = false,
  isEditing = false,
  zoom = 1,
  onSelect,
  onChange,
  onStartEditing,
}: CanvasTextLayerProps) {
  const groupRef = useRef<Konva.Group>(null)
  const textRef = useRef<Konva.Text>(null)
  const [textSize, setTextSize] = useState({ width: 0, height: 0 })

  const { snapEnabled, snapToCenter, snapToEdges, snapTolerance, setActiveGuides, clearActiveGuides } =
    useSnapStore()

  // Clean up any remaining guidelines on unmount
  useEffect(() => {
    return () => {
      clearActiveGuides()
    }
  }, [clearActiveGuides])

  const pos = relativeToCanvas(layer.relativeX, layer.relativeY, fit)
  const resolved = resolveCanvasStyle(layer, fit)

  // Determine fontStyle string for Konva
  const fontStyle =
    layer.style.bold && layer.style.italic
      ? 'italic bold'
      : layer.style.bold
        ? 'bold'
        : layer.style.italic
          ? 'italic'
          : 'normal'

  // Update text dimensions for background rect calculation
  useLayoutEffect(() => {
    if (textRef.current) {
      setTextSize({
        width: textRef.current.width(),
        height: textRef.current.height(),
      })
    }
  }, [
    layer.text,
    resolved.fontSize,
    layer.style.fontFamily,
    layer.style.bold,
    layer.style.italic,
    fit.scale,
    fit.renderedWidth,
    fit.renderedHeight,
  ])

  if (!layer.visible) {
    return null
  }

  const bg = layer.style.background
  const bgBox = calculateBackgroundBox({
    textWidth: textSize.width,
    textHeight: textSize.height,
    padding: resolved.background.padding,
    borderRadius: resolved.background.borderRadius,
    scale: 1, // Already resolved to canvas scale
  })

  return (
    <Group
      ref={groupRef}
      id={layer.id}
      x={pos.x}
      y={pos.y}
      rotation={layer.rotation}
      draggable={!isEditing}
      opacity={isEditing ? 0.2 : 1}
      onClick={(e) => {
        e.cancelBubble = true
        onSelect(layer.id)
      }}
      onTap={(e) => {
        e.cancelBubble = true
        onSelect(layer.id)
      }}
      onDblClick={(e) => {
        e.cancelBubble = true
        onSelect(layer.id)
        onStartEditing?.(layer.id)
      }}
      onDragStart={(e) => {
        e.cancelBubble = true
        onSelect(layer.id)
        clearActiveGuides()
      }}
      onDragMove={(e) => {
        e.cancelBubble = true
        const node = groupRef.current || (e.target as unknown as Konva.Group)
        if (!node) return

        // Bypass snapping if Alt is held or snap is turned off
        const nativeEvt = e.evt as MouseEvent | TouchEvent | undefined
        const isAltPressed = nativeEvt && 'altKey' in nativeEvt ? nativeEvt.altKey : false

        if (!snapEnabled || isAltPressed) {
          clearActiveGuides()
          return
        }

        const parentNode = node.getParent()
        const objBox = node.getClientRect({ relativeTo: parentNode || undefined, skipShadow: true })

        const photoBox = {
          x: fit.x,
          y: fit.y,
          width: fit.renderedWidth,
          height: fit.renderedHeight,
        }

        const effectiveZoom = zoom && zoom > 0 ? zoom : 1
        const threshold = snapTolerance / effectiveZoom

        const snapResult = calculateSnap({
          draggedBounds: objBox,
          photoBounds: photoBox,
          threshold,
          snapToCenter,
          snapToEdges,
        })

        if (snapResult.deltaX !== 0) {
          node.x(node.x() + snapResult.deltaX)
        }
        if (snapResult.deltaY !== 0) {
          node.y(node.y() + snapResult.deltaY)
        }

        if (snapResult.guides.length > 0) {
          setActiveGuides(snapResult.guides)
        } else {
          clearActiveGuides()
        }
      }}
      onDragEnd={(e) => {
        e.cancelBubble = true
        clearActiveGuides()
        const node = groupRef.current || (e.target as unknown as Konva.Group)
        const newPos = canvasToRelative(node.x(), node.y(), fit)
        onChange({
          relativeX: newPos.relX,
          relativeY: newPos.relY,
        })
      }}
      onTransformEnd={(e) => {
        e.cancelBubble = true
        const node = groupRef.current || e.target
        const scaleX = node.scaleX()
        const newPos = canvasToRelative(node.x(), node.y(), fit)
        const newRotation = Math.round(node.rotation())

        node.scaleX(1)
        node.scaleY(1)

        if (layer.style.fontSizeUnit === '%') {
          const basis =
            layer.style.fontSizeRef === 'height'
              ? fit.renderedHeight
              : fit.renderedWidth
          const currentPx = resolved.fontSize * scaleX
          const newPct = pxToPercent(currentPx, basis)
          onChange({
            relativeX: newPos.relX,
            relativeY: newPos.relY,
            rotation: newRotation,
            style: {
              ...layer.style,
              fontSizePercent: newPct,
            },
          })
        } else {
          const newFontSize = Math.max(8, Math.round(layer.style.fontSize * scaleX))
          onChange({
            relativeX: newPos.relX,
            relativeY: newPos.relY,
            rotation: newRotation,
            style: {
              ...layer.style,
              fontSize: newFontSize,
            },
          })
        }
      }}
      onMouseEnter={(e) => {
        if (!isEditing) {
          const stage = e.target.getStage()
          if (stage) stage.container().style.cursor = 'move'
        }
      }}
      onMouseLeave={(e) => {
        const stage = e.target.getStage()
        if (stage) stage.container().style.cursor = 'default'
      }}
    >
      {/* Background layer if enabled */}
      {bg.enabled && (
        <Rect
          x={bgBox.x}
          y={bgBox.y}
          width={bgBox.width}
          height={bgBox.height}
          fill={bg.color}
          opacity={bg.opacity}
          cornerRadius={bgBox.cornerRadius}
        />
      )}

      {/* Main Text layer */}
      <Text
        ref={textRef}
        text={layer.text}
        fontSize={resolved.fontSize}
        fontFamily={layer.style.fontFamily}
        fontStyle={fontStyle}
        fill={layer.style.fill}
        opacity={layer.style.opacity}
        align={layer.style.align}
        stroke={layer.style.stroke.enabled ? layer.style.stroke.color : undefined}
        strokeWidth={resolved.strokeWidth}
        fillAfterStrokeEnabled
        shadowColor={layer.style.shadow.enabled ? layer.style.shadow.color : undefined}
        shadowBlur={resolved.shadow.blur}
        shadowOffset={
          layer.style.shadow.enabled
            ? {
                x: resolved.shadow.offsetX,
                y: resolved.shadow.offsetY,
              }
            : undefined
        }
        shadowOpacity={layer.style.shadow.enabled ? 1 : 0}
      />
    </Group>
  )
}
