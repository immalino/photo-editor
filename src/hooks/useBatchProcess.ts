import { useState, useRef, useCallback } from 'react'
import type { PhotoItem } from '../types/photo'
import type { TextLayer } from '../types/layer'
import type { ExportConfig } from '../types/export'
import { renderPhotoWithLayers } from '../services/exportEngine'
import { generateExportFileName } from '../utils/fileNaming'
import { saveFileBlob } from '../services/platformAdapter'

export interface BatchFailedItem {
  fileName: string
  error: string
}

export interface BatchProcessResult {
  completedList: string[]
  failedList: BatchFailedItem[]
  cancelled: boolean
  total: number
}

export interface UseBatchProcessOptions {
  /** Optional delay in ms between processing items to avoid UI freeze. Default 30ms. */
  itemDelay?: number
}

export function useBatchProcess(options: UseBatchProcessOptions = {}) {
  const { itemDelay = 30 } = options

  const [isProcessing, setIsProcessing] = useState(false)
  const [currentProgress, setCurrentProgress] = useState(0)
  const [totalPhotos, setTotalPhotos] = useState(0)
  const [currentFileName, setCurrentFileName] = useState<string | undefined>(undefined)
  const [completedList, setCompletedList] = useState<string[]>([])
  const [failedList, setFailedList] = useState<BatchFailedItem[]>([])
  const [isCancelled, setIsCancelled] = useState(false)

  const cancelRequestedRef = useRef(false)

  const cancel = useCallback(() => {
    cancelRequestedRef.current = true
    setIsCancelled(true)
  }, [])

  const reset = useCallback(() => {
    setIsProcessing(false)
    setCurrentProgress(0)
    setTotalPhotos(0)
    setCurrentFileName(undefined)
    setCompletedList([])
    setFailedList([])
    setIsCancelled(false)
    cancelRequestedRef.current = false
  }, [])

  const processQueue = useCallback(
    async (
      photos: PhotoItem[],
      layersMap: Record<string, TextLayer[]>,
      config: ExportConfig
    ): Promise<BatchProcessResult> => {
      cancelRequestedRef.current = false
      setIsCancelled(false)
      setIsProcessing(true)
      setCurrentProgress(0)
      setTotalPhotos(photos.length)
      setCompletedList([])
      setFailedList([])

      const completed: string[] = []
      const failed: BatchFailedItem[] = []

      for (let i = 0; i < photos.length; i++) {
        if (cancelRequestedRef.current) {
          break
        }

        const photo = photos[i]
        setCurrentFileName(photo.name)
        setCurrentProgress(i)

        try {
          const photoLayers = layersMap[photo.id] ?? []
          const blob = await renderPhotoWithLayers(photo, photoLayers, config)
          const outputName = generateExportFileName(
            photo.name,
            config.namingPattern,
            config.format
          )

          const saved = await saveFileBlob(blob, outputName)
          if (!saved) {
            throw new Error('Gagal menyimpan file ke sistem file')
          }

          completed.push(outputName)
          setCompletedList([...completed])
        } catch (err) {
          const errorMsg =
            err instanceof Error ? err.message : 'Terjadi kegagalan saat merender foto'
          failed.push({
            fileName: photo.name,
            error: errorMsg,
          })
          setFailedList([...failed])
        }

        setCurrentProgress(i + 1)

        // Give UI time to update progress bar and handle user interactions
        if (itemDelay > 0 && i < photos.length - 1 && !cancelRequestedRef.current) {
          await new Promise((resolve) => setTimeout(resolve, itemDelay))
        }
      }

      const wasCancelled = cancelRequestedRef.current
      setIsProcessing(false)
      setCurrentFileName(undefined)

      return {
        completedList: completed,
        failedList: failed,
        cancelled: wasCancelled,
        total: photos.length,
      }
    },
    [itemDelay]
  )

  return {
    isProcessing,
    currentProgress,
    totalPhotos,
    currentFileName,
    completedList,
    failedList,
    isCancelled,
    processQueue,
    cancel,
    reset,
  }
}
