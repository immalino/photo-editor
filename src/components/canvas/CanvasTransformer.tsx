import { useEffect, useRef } from 'react'
import { Transformer } from 'react-konva'
import type Konva from 'konva'

export interface CanvasTransformerProps {
  selectedLayerId?: string | null
  updateKey?: unknown
  isEditing?: boolean
}

export function CanvasTransformer({
  selectedLayerId,
  updateKey,
  isEditing = false,
}: CanvasTransformerProps) {
  const trRef = useRef<Konva.Transformer>(null)

  useEffect(() => {
    if (!trRef.current) return
    const stage = trRef.current.getStage()
    if (!stage || !selectedLayerId || isEditing) {
      trRef.current.nodes([])
      trRef.current.getLayer()?.batchDraw()
      return
    }

    const selectedNode = stage.findOne(`#${selectedLayerId}`)
    if (selectedNode) {
      trRef.current.nodes([selectedNode])
      trRef.current.update()
    } else {
      trRef.current.nodes([])
    }
    trRef.current.getLayer()?.batchDraw()
  }, [selectedLayerId, updateKey, isEditing])

  return (
    <Transformer
      ref={trRef}
      boundBoxFunc={(oldBox, newBox) => {
        // Enforce minimum box dimensions so layer can't collapse completely
        if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) {
          return oldBox
        }
        return newBox
      }}
      enabledAnchors={[
        'top-left',
        'top-center',
        'top-right',
        'middle-right',
        'bottom-right',
        'bottom-center',
        'bottom-left',
        'middle-left',
      ]}
      rotateEnabled
      anchorSize={8}
      anchorCornerRadius={2}
      borderStroke="#6366f1"
      borderStrokeWidth={1.5}
      anchorStroke="#6366f1"
      anchorFill="#ffffff"
    />
  )
}
