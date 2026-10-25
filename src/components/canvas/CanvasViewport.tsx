import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { Stage, Layer, Group } from 'react-konva'
import { ImagePlus, Upload, ZoomIn, ZoomOut, Maximize2, Hand, Magnet } from 'lucide-react'
import { CanvasImage } from './CanvasImage'
import { CanvasSnapGuides } from './CanvasSnapGuides'
import { useSnapStore } from '../../stores/useSnapStore'
import { calculateFitScale, relativeToCanvas, type CanvasFitResult } from '../../utils/scaleMath'
import { resolveCanvasStyle } from '../../utils/unitMath'
import type { PhotoItem } from '../../types/photo'
import type { TextLayer } from '../../types/layer'

export interface CanvasViewportProps {
  photo?: PhotoItem
  onOpenFile?: () => void
  isDragging?: boolean
  children?: (fit: CanvasFitResult, zoom: number) => ReactNode
  onDeselect?: () => void
  editingLayer?: TextLayer | null
  onFinishEditing?: (text: string) => void
  onCancelEditing?: () => void
}

export function CanvasViewport({
  photo,
  onOpenFile,
  isDragging = false,
  children,
  onDeselect,
  editingLayer,
  onFinishEditing,
  onCancelEditing,
}: CanvasViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // Zoom & Pan state
  const [zoom, setZoom] = useState<number>(1.0)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [isPanModeActive, setIsPanModeActive] = useState(false)
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Inline editing local text
  const [editText, setEditText] = useState('')

  // Snap store state
  const { snapEnabled, toggleSnap } = useSnapStore()

  // Sync edit text when editingLayer changes
  useEffect(() => {
    if (editingLayer) {
      setEditText(editingLayer.text)
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.select()
        }
      }, 50)
    }
  }, [editingLayer])

  // Reset zoom & pan when photo changes
  useEffect(() => {
    setZoom(1.0)
    setPan({ x: 0, y: 0 })
  }, [photo?.id])

  // ResizeObserver for viewport dimensions
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

  // Listen for Spacebar key to toggle pan mode temporarily
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase()
      if (activeTag === 'input' || activeTag === 'textarea') return

      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true)
      } else if (e.code === 'KeyS' && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        toggleSnap()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false)
        setIsPanning(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [toggleSnap])

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

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(5.0, Number((z + 0.25).toFixed(2))))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(0.25, Number((z - 0.25).toFixed(2))))
  }, [])

  const handleResetZoom = useCallback(() => {
    setZoom(1.0)
    setPan({ x: 0, y: 0 })
  }, [])

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (editingLayer) return
    e.preventDefault()
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9
    setZoom((prev) => {
      const next = prev * zoomFactor
      return Math.min(5.0, Math.max(0.2, Number(next.toFixed(2))))
    })
  }, [editingLayer])

  // Mouse down for panning
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const shouldPan = isSpacePressed || isPanModeActive || e.button === 1
      if (shouldPan) {
        e.preventDefault()
        setIsPanning(true)
        dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
      }
    },
    [isSpacePressed, isPanModeActive, pan]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isPanning) {
        e.preventDefault()
        setPan({
          x: e.clientX - dragStartRef.current.x,
          y: e.clientY - dragStartRef.current.y,
        })
      }
    },
    [isPanning]
  )

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  // Calculate stage center for Konva transform
  const centerX = dimensions.width / 2
  const centerY = dimensions.height / 2

  // Inline editing overlay position calculation
  let inlineEditorStyle: React.CSSProperties | null = null
  if (editingLayer && photo && dimensions.width > 0 && dimensions.height > 0) {
    const rawPos = relativeToCanvas(editingLayer.relativeX, editingLayer.relativeY, fit)
    const screenX = centerX + pan.x + (rawPos.x - centerX) * zoom
    const screenY = centerY + pan.y + (rawPos.y - centerY) * zoom
    const resolved = resolveCanvasStyle(editingLayer, fit)
    const effectiveFontSize = Math.max(10, Math.round(resolved.fontSize * zoom))

    const align = editingLayer.style.align || 'left'
    let transformX = '0%'
    let transformOrigin = 'top left'
    if (align === 'center') {
      transformX = '-50%'
      transformOrigin = 'top center'
    } else if (align === 'right') {
      transformX = '-100%'
      transformOrigin = 'top right'
    }

    inlineEditorStyle = {
      position: 'absolute',
      left: `${screenX}px`,
      top: `${screenY}px`,
      transform: `translateX(${transformX}) rotate(${editingLayer.rotation || 0}deg)`,
      transformOrigin,
      fontSize: `${effectiveFontSize}px`,
      fontFamily: editingLayer.style.fontFamily || 'Arial',
      fontWeight: editingLayer.style.bold ? 'bold' : 'normal',
      fontStyle: editingLayer.style.italic ? 'italic' : 'normal',
      color: editingLayer.style.fill || '#ffffff',
      textAlign: align,
      lineHeight: `${editingLayer.style.lineHeight ?? 1.2}`,
      letterSpacing: `${resolved.letterSpacing * zoom}px`,
      whiteSpace: 'pre',
      minWidth: `${Math.max(140, effectiveFontSize * 4)}px`,
      minHeight: `${effectiveFontSize * 1.5}px`,
      zIndex: 50,
    }
  }

  const handleTextareaKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onFinishEditing?.(editText)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancelEditing?.()
    }
  }

  const canPanNow = isSpacePressed || isPanModeActive

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-slate-950 select-none ${
        canPanNow ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : ''
      } ${isDragging ? 'ring-2 ring-indigo-500 ring-inset bg-slate-900/50' : ''}`}
    >
      {photo ? (
        dimensions.width > 0 &&
        dimensions.height > 0 && (
          <>
            <Stage
              width={dimensions.width}
              height={dimensions.height}
              className="absolute inset-0"
              onMouseDown={(e) => {
                if (canPanNow) return
                if (e.target === e.target.getStage()) {
                  if (editingLayer) {
                    onFinishEditing?.(editText)
                  } else {
                    onDeselect?.()
                  }
                }
              }}
              onTouchStart={(e) => {
                if (e.target === e.target.getStage()) {
                  onDeselect?.()
                }
              }}
            >
              <Layer>
                <Group
                  x={centerX + pan.x}
                  y={centerY + pan.y}
                  offsetX={centerX}
                  offsetY={centerY}
                  scaleX={zoom}
                  scaleY={zoom}
                >
                  <CanvasImage url={photo.url} fit={fit} />
                  {children && children(fit, zoom)}
                  <CanvasSnapGuides fit={fit} zoom={zoom} />
                </Group>
              </Layer>
            </Stage>

            {/* In-Canvas Direct Inline Text Editor */}
            {editingLayer && inlineEditorStyle && (
              <textarea
                ref={textareaRef}
                wrap="off"
                style={inlineEditorStyle}
                value={editText}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditText(e.target.value)}
                onKeyDown={handleTextareaKeyDown}
                onBlur={() => onFinishEditing?.(editText)}
                className="resize-both rounded border-2 border-indigo-400 bg-slate-900/90 p-1.5 shadow-2xl backdrop-blur-sm outline-none ring-2 ring-indigo-500/50 animate-fade-in"
                placeholder="Ketik teks..."
              />
            )}

            {/* Floating Zoom & Pan Controls */}
            <div className="absolute bottom-4 left-4 z-40 flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/80 p-1 shadow-lg backdrop-blur-md">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 0.25}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                title="Zoom Out (-)"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2 py-0.5 font-mono text-xs font-semibold text-slate-200 transition hover:text-indigo-400"
                title="Klik untuk Reset Zoom (100%)"
              >
                {Math.round(zoom * 100)}%
              </button>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 5.0}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                title="Zoom In (+)"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>

              <div className="mx-0.5 h-4 w-px bg-slate-800" />

              <button
                type="button"
                onClick={handleResetZoom}
                className="flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                title="Kembalikan ukuran pas layar (Fit)"
              >
                <Maximize2 className="h-3 w-3" />
                <span>Fit</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPanModeActive(!isPanModeActive)}
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
                  isPanModeActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
                title={isPanModeActive ? 'Matikan Mode Geser (Pan)' : 'Aktifkan Mode Geser (Pan) [Space]'}
              >
                <Hand className="h-3.5 w-3.5" />
              </button>

              <div className="mx-0.5 h-4 w-px bg-slate-800" />

              <button
                type="button"
                onClick={toggleSnap}
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
                  snapEnabled
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
                title={
                  snapEnabled
                    ? 'Snap ke Foto Aktif [S] (Tahan Alt saat geser untuk mematikan sementara)'
                    : 'Snap ke Foto Nonaktif [S] (Klik untuk menyalakan)'
                }
              >
                <Magnet className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
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
