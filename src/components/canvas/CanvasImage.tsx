import { useEffect, useState } from 'react'
import { Image as KonvaImage } from 'react-konva'
import type { CanvasFitResult } from '../../utils/scaleMath'

export interface CanvasImageProps {
  url: string
  fit: CanvasFitResult
}

export function CanvasImage({ url, fit }: CanvasImageProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!url) return

    let isCancelled = false
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.src = url

    const handleLoad = () => {
      if (!isCancelled) {
        setImage(img)
      }
    }

    if (img.complete) {
      queueMicrotask(handleLoad)
    } else {
      img.addEventListener('load', handleLoad)
    }

    return () => {
      isCancelled = true
      img.removeEventListener('load', handleLoad)
    }
  }, [url])

  const currentImage = url ? image : null

  if (!currentImage || fit.renderedWidth <= 0 || fit.renderedHeight <= 0) {
    return null
  }

  return (
    <KonvaImage
      image={currentImage}
      x={fit.x}
      y={fit.y}
      width={fit.renderedWidth}
      height={fit.renderedHeight}
      listening={false}
    />
  )
}
