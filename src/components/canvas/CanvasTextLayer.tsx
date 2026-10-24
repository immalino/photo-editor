import { useRef, useLayoutEffect, useState } from 'react'
import { Group, Text, Rect } from 'react-konva'
import type Konva from 'konva'
import type { TextLayer } from '../../types/layer'
import { relativeToCanvas, canvasToRelative, type CanvasFitResult } from '../../utils/scaleMath'
import { calculateBackgroundBox } from '../../utils/layerBounds'

export interface CanvasTextLayerProps {
  layer: TextLayer
  fit: CanvasFitResult
  isSelected: boolean
  onSelect: (layerId: string) => void
  onChange: (updates: Partial<TextLayer>) => void
}

export function CanvasTextLayer({
  layer,
  fit,
  isSelected: _isSelected = false,
  onSelect,
  onChange,
}: CanvasTextLayerProps) {
  const groupRef = useRef<Konva.Group>(null)
  const textRef = useRef<Konva.Text>(null)
  const [textSize, setTextSize] = useState({ width: 0, height: 0 })

  const pos = relativeToCanvas(layer.relativeX, layer.relativeY, fit)
  const scaledFontSize = Math.max(8, Math.round(layer.style.fontSize * fit.scale))

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
    scaledFontSize,
    layer.style.fontFamily,
    layer.style.bold,
    layer.style.italic,
    fit.scale,
  ])

  if (!layer.visible) {
    return null
  }

  const bg = layer.style.background
  const bgBox = calculateBackgroundBox({
    textWidth: textSize.width,
    textHeight: textSize.height,
    padding: bg.padding,
    borderRadius: bg.borderRadius,
    scale: fit.scale,
  })

  return (
    <Group
      ref={groupRef}
      id={layer.id}
      x={pos.x}
      y={pos.y}
      rotation={layer.rotation}
      draggable
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
        const newText = window.prompt('Ubah isi teks:', layer.text)
        if (newText !== null && newText.trim() !== '') {
          onChange({ text: newText })
        }
      }}
      onDragStart={(e) => {
        e.cancelBubble = true
        onSelect(layer.id)
      }}
      onDragEnd={(e) => {
        e.cancelBubble = true
        const node = groupRef.current || e.target
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
        const newFontSize = Math.max(8, Math.round(layer.style.fontSize * scaleX))

        node.scaleX(1)
        node.scaleY(1)

        onChange({
          relativeX: newPos.relX,
          relativeY: newPos.relY,
          rotation: newRotation,
          style: {
            ...layer.style,
            fontSize: newFontSize,
          },
        })
      }}
      onMouseEnter={(e) => {
        const stage = e.target.getStage()
        if (stage) stage.container().style.cursor = 'move'
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
        fontSize={scaledFontSize}
        fontFamily={layer.style.fontFamily}
        fontStyle={fontStyle}
        fill={layer.style.fill}
        opacity={layer.style.opacity}
        align={layer.style.align}
        stroke={layer.style.stroke.enabled ? layer.style.stroke.color : undefined}
        strokeWidth={
          layer.style.stroke.enabled ? Math.max(1, layer.style.stroke.width * fit.scale) : 0
        }
        fillAfterStrokeEnabled
        shadowColor={layer.style.shadow.enabled ? layer.style.shadow.color : undefined}
        shadowBlur={layer.style.shadow.enabled ? layer.style.shadow.blur * fit.scale : 0}
        shadowOffset={
          layer.style.shadow.enabled
            ? {
                x: layer.style.shadow.offsetX * fit.scale,
                y: layer.style.shadow.offsetY * fit.scale,
              }
            : undefined
        }
        shadowOpacity={layer.style.shadow.enabled ? 1 : 0}
      />
    </Group>
  )
}
