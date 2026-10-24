import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Stage, Layer } from 'react-konva'
import { ImagePlus, Upload } from 'lucide-react'
import { CanvasImage } from './CanvasImage'
import { calculateFitScale, type CanvasFitResult } from '../../utils/scaleMath'
import type { PhotoItem } from '../../types/photo'

export interface CanvasViewportProps {
  photo?: PhotoItem
  onOpenFile?: () => void
  isDragging?: boolean
  children?: (fit: CanvasFitResult) => ReactNode
}

export function CanvasViewport({
  photo,
  onOpenFile,
  isDragging = false,
  children,
}: CanvasViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setDimensions({
          width: Math.floor(width),
          height: Math.floor(height),
        })
      }
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const padding = 32
  const fit: CanvasFitResult = photo
    ? calculateFitScale(
        dimensions.width,
        dimensions.height,
        photo.originalWidth,
        photo.originalHeight,
        padding
      )
    : { scale: 1, x: 0, y: 0, renderedWidth: 0, renderedHeight: 0 }

  return (
    <div
      ref={containerRef}
      className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-slate-950 select-none ${
        isDragging ? 'ring-2 ring-indigo-500 ring-inset bg-slate-900/50' : ''
      }`}
    >
      {photo ? (
        dimensions.width > 0 &&
        dimensions.height > 0 && (
          <Stage
            width={dimensions.width}
            height={dimensions.height}
            className="absolute inset-0"
          >
            <Layer>
              <CanvasImage url={photo.url} fit={fit} />
              {children && children(fit)}
            </Layer>
          </Stage>
        )
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-indigo-400 shadow-inner">
            <ImagePlus className="h-8 w-8" />
          </div>
          <h3 className="mb-1 text-lg font-medium text-slate-200">
            Belum ada foto yang dibuka
          </h3>
          <p className="mb-6 max-w-sm text-sm text-slate-400">
            Tarik dan lepas file foto (JPG, PNG, WebP) ke sini, atau gunakan tombol di bawah.
          </p>
          {onOpenFile && (
            <button
              type="button"
              onClick={onOpenFile}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 active:scale-95"
            >
              <Upload className="h-4 w-4" />
              Buka Foto
            </button>
          )}
        </div>
      )}

      {/* Drag overlay indicator */}
      {isDragging && (
        <div className="pointer-events-none absolute inset-4 flex items-center justify-center rounded-xl border-2 border-dashed border-indigo-400 bg-indigo-950/40 backdrop-blur-xs">
          <div className="flex flex-col items-center gap-2 text-indigo-200">
            <Upload className="h-10 w-10 animate-bounce" />
            <p className="font-semibold text-lg">Lepaskan foto untuk membuka</p>
          </div>
        </div>
      )}
    </div>
  )
}
