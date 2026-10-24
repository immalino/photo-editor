import { useState, useRef, useCallback, type DragEvent } from 'react'
import { openFileDialog } from '../services/platformAdapter'
import { createPhotoItemFromFile, isSupportedImageFile } from '../services/fileReader'
import type { PhotoItem } from '../types/photo'

export interface UsePhotoDropOptions {
  onPhotoAdded: (photo: PhotoItem) => void
  onError?: (msg: string) => void
}

/**
 * Hook to manage drag and drop photo loading and file picker interactions.
 */
export function usePhotoDrop({ onPhotoAdded, onError }: UsePhotoDropOptions) {
  const [isDragging, setIsDragging] = useState(false)
  const dragCounterRef = useRef(0)

  const handleProcessFiles = useCallback(
    async (files: File[]) => {
      const validImageFiles = files.filter(isSupportedImageFile)
      if (validImageFiles.length === 0) {
        if (files.length > 0 && onError) {
          onError('Format file tidak didukung. Harap pilih file JPG, PNG, atau WebP.')
        }
        return
      }

      try {
        for (const file of validImageFiles) {
          const photoItem = await createPhotoItemFromFile(file)
          onPhotoAdded(photoItem)
        }
      } catch (err) {
        console.error('Error loading image file:', err)
        if (onError) {
          onError('Gagal memuat gambar. Pastikan file gambar valid.')
        }
      }
    },
    [onPhotoAdded, onError]
  )

  const handleOpenPhoto = useCallback(async () => {
    try {
      const files = await openFileDialog({
        multiple: true,
        accept: 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
      })
      if (files.length > 0) {
        await handleProcessFiles(files)
      }
    } catch (err) {
      console.error('Failed to open file dialog:', err)
    }
  }, [handleProcessFiles])

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current += 1
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current -= 1
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current = 0
    setIsDragging(false)

    const files = e.dataTransfer?.files ? Array.from(e.dataTransfer.files) : []
    if (files.length > 0) {
      await handleProcessFiles(files)
    }
  }

  return {
    isDragging,
    handleOpenPhoto,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  }
}
