import { Group, Line } from 'react-konva'
import { useSnapStore } from '../../stores/useSnapStore'
import type { CanvasFitResult } from '../../utils/scaleMath'

export interface CanvasSnapGuidesProps {
  fit: CanvasFitResult
  zoom: number
}

export function CanvasSnapGuides({ fit, zoom }: CanvasSnapGuidesProps) {
  const activeGuides = useSnapStore((state) => state.activeGuides)

  if (activeGuides.length === 0 || fit.renderedWidth <= 0 || fit.renderedHeight <= 0) {
    return null
  }

  const effectiveZoom = Math.max(0.1, zoom)
  const extension = 12 / effectiveZoom
  const lineWidth = 1.5 / effectiveZoom
  const edgeDash = [4 / effectiveZoom, 3 / effectiveZoom]

  return (
    <Group listening={false}>
      {activeGuides.map((guide, idx) => {
        const isCenter = guide.targetType.includes('center')
        const strokeColor = isCenter ? '#ec4899' : '#06b6d4'

        let points: number[] = []
        if (guide.orientation === 'vertical') {
          points = [
            guide.position,
            fit.y - extension,
            guide.position,
            fit.y + fit.renderedHeight + extension,
          ]
        } else {
          points = [
            fit.x - extension,
            guide.position,
            fit.x + fit.renderedWidth + extension,
            guide.position,
          ]
        }

        return (
          <Line
            key={`${guide.orientation}-${guide.position}-${idx}`}
            points={points}
            stroke={strokeColor}
            strokeWidth={lineWidth}
            dash={isCenter ? undefined : edgeDash}
            listening={false}
            perfectDrawEnabled={false}
          />
        )
      })}
    </Group>
  )
}

