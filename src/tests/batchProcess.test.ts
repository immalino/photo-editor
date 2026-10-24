import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLayerStore } from '../stores/useLayerStore'
import { useBatchProcess } from '../hooks/useBatchProcess'
import * as exportEngine from '../services/exportEngine'
import * as platformAdapter from '../services/platformAdapter'
import type { PhotoItem } from '../types/photo'
import type { ExportConfig } from '../types/export'

describe('Batch Processing & Layer Replication', () => {
  beforeEach(() => {
    useLayerStore.getState().clearLayers()
    vi.restoreAllMocks()
  })

  describe('applyLayersToAllPhotos (Layer Store)', () => {
    it('replicates all layers from source photo to multiple target photos', () => {
      const store = useLayerStore.getState()
      const sourcePhotoId = 'photo-1'
      const targetIds = ['photo-1', 'photo-2', 'photo-3']

      // Add two distinct layers to photo-1
      const layer1 = store.addTextLayer(sourcePhotoId, {
        text: 'Watermark Top',
        relativeX: 0.1,
        relativeY: 0.2,
      })
      const layer2 = store.addTextLayer(sourcePhotoId, {
        text: 'Watermark Bottom',
        relativeX: 0.8,
        relativeY: 0.9,
      })

      // Apply to all
      useLayerStore.getState().applyLayersToAllPhotos(sourcePhotoId, targetIds)

      const photo2Layers = useLayerStore.getState().getLayers('photo-2')
      const photo3Layers = useLayerStore.getState().getLayers('photo-3')

      expect(photo2Layers).toHaveLength(2)
      expect(photo3Layers).toHaveLength(2)

      expect(photo2Layers[0].text).toBe('Watermark Top')
      expect(photo2Layers[0].relativeX).toBe(0.1)
      expect(photo2Layers[0].relativeY).toBe(0.2)
      expect(photo2Layers[1].text).toBe('Watermark Bottom')

      // Layer IDs must be unique for each photo to allow independent override
      expect(photo2Layers[0].id).not.toBe(layer1.id)
      expect(photo2Layers[1].id).not.toBe(layer2.id)
      expect(photo3Layers[0].id).not.toBe(photo2Layers[0].id)
    })

    it('allows independent override per photo without altering source photo', () => {
      const store = useLayerStore.getState()
      const sourcePhotoId = 'photo-A'
      const targetPhotoId = 'photo-B'

      store.addTextLayer(sourcePhotoId, {
        text: 'Original Text',
        relativeX: 0.5,
        relativeY: 0.5,
      })

      useLayerStore.getState().applyLayersToAllPhotos(sourcePhotoId, [sourcePhotoId, targetPhotoId])

      const layersB = useLayerStore.getState().getLayers(targetPhotoId)
      expect(layersB).toHaveLength(1)
      const layerBId = layersB[0].id

      // Modify target photo layer (Override)
      useLayerStore.getState().updateLayer(targetPhotoId, layerBId, {
        text: 'Modified on Photo B Only',
        relativeX: 0.9,
      })

      // Verify Photo A layer remains untouched
      const originalLayersA = useLayerStore.getState().getLayers(sourcePhotoId)
      expect(originalLayersA[0].text).toBe('Original Text')
      expect(originalLayersA[0].relativeX).toBe(0.5)

      // Verify Photo B has updated values
      const updatedLayersB = useLayerStore.getState().getLayers(targetPhotoId)
      expect(updatedLayersB[0].text).toBe('Modified on Photo B Only')
      expect(updatedLayersB[0].relativeX).toBe(0.9)
    })

    it('does nothing to other photos if source photo has no layers', () => {
      useLayerStore.getState().applyLayersToAllPhotos('empty-photo', ['empty-photo', 'target-1'])
      expect(useLayerStore.getState().getLayers('target-1')).toEqual([])
    })
  })

  describe('useBatchProcess hook', () => {
    const mockPhotos: PhotoItem[] = [
      {
        id: 'p1',
        name: 'beach.jpg',
        url: 'blob://p1',
        originalWidth: 1920,
        originalHeight: 1080,
      },
      {
        id: 'p2',
        name: 'mountain.png',
        url: 'blob://p2',
        originalWidth: 2000,
        originalHeight: 1500,
      },
      {
        id: 'p3',
        name: 'forest.webp',
        url: 'blob://p3',
        originalWidth: 1200,
        originalHeight: 800,
      },
    ]

    const testConfig: ExportConfig = {
      format: 'jpg',
      quality: 0.85,
      namingPattern: '{name}_watermarked',
    }

    it('processes all photos in queue sequentially and updates progress', async () => {
      const renderSpy = vi
        .spyOn(exportEngine, 'renderPhotoWithLayers')
        .mockResolvedValue(new Blob(['fake-img'], { type: 'image/jpeg' }))
      const saveSpy = vi.spyOn(platformAdapter, 'saveFileBlob').mockResolvedValue(true)

      const { result } = renderHook(() => useBatchProcess({ itemDelay: 0 }))

      expect(result.current.isProcessing).toBe(false)
      expect(result.current.currentProgress).toBe(0)

      let queueResult: any
      await act(async () => {
        queueResult = await result.current.processQueue(mockPhotos, {}, testConfig)
      })

      expect(renderSpy).toHaveBeenCalledTimes(3)
      expect(saveSpy).toHaveBeenCalledTimes(3)
      expect(saveSpy).toHaveBeenNthCalledWith(1, expect.any(Blob), 'beach_watermarked.jpg')
      expect(saveSpy).toHaveBeenNthCalledWith(2, expect.any(Blob), 'mountain_watermarked.jpg')
      expect(saveSpy).toHaveBeenNthCalledWith(3, expect.any(Blob), 'forest_watermarked.jpg')

      expect(queueResult.completedList).toEqual([
        'beach_watermarked.jpg',
        'mountain_watermarked.jpg',
        'forest_watermarked.jpg',
      ])
      expect(queueResult.failedList).toEqual([])
      expect(queueResult.cancelled).toBe(false)
      expect(result.current.isProcessing).toBe(false)
      expect(result.current.currentProgress).toBe(3)
    })

    it('handles failure on corrupt photo without halting subsequent items', async () => {
      vi.spyOn(exportEngine, 'renderPhotoWithLayers').mockImplementation(async (photo) => {
        if (photo.id === 'p2') {
          throw new Error('Corrupt image data')
        }
        return new Blob(['ok'], { type: 'image/jpeg' })
      })
      vi.spyOn(platformAdapter, 'saveFileBlob').mockResolvedValue(true)

      const { result } = renderHook(() => useBatchProcess({ itemDelay: 0 }))

      let queueResult: any
      await act(async () => {
        queueResult = await result.current.processQueue(mockPhotos, {}, testConfig)
      })

      expect(queueResult.completedList).toEqual([
        'beach_watermarked.jpg',
        'forest_watermarked.jpg',
      ])
      expect(queueResult.failedList).toHaveLength(1)
      expect(queueResult.failedList[0]).toEqual({
        fileName: 'mountain.png',
        error: 'Corrupt image data',
      })
      expect(queueResult.cancelled).toBe(false)
    })

    it('records failure if saveFileBlob returns false', async () => {
      vi.spyOn(exportEngine, 'renderPhotoWithLayers').mockResolvedValue(
        new Blob(['ok'], { type: 'image/jpeg' })
      )
      vi.spyOn(platformAdapter, 'saveFileBlob').mockResolvedValue(false)

      const { result } = renderHook(() => useBatchProcess({ itemDelay: 0 }))

      let queueResult: any
      await act(async () => {
        queueResult = await result.current.processQueue([mockPhotos[0]], {}, testConfig)
      })

      expect(queueResult.completedList).toEqual([])
      expect(queueResult.failedList).toHaveLength(1)
      expect(queueResult.failedList[0].fileName).toBe('beach.jpg')
      expect(queueResult.failedList[0].error).toContain('Gagal menyimpan file')
    })

    it('stops processing when cancel is requested', async () => {
      let callCount = 0
      vi.spyOn(exportEngine, 'renderPhotoWithLayers').mockImplementation(async () => {
        callCount++
        return new Blob(['ok'], { type: 'image/jpeg' })
      })
      vi.spyOn(platformAdapter, 'saveFileBlob').mockResolvedValue(true)

      const { result } = renderHook(() => useBatchProcess({ itemDelay: 50 }))

      let processPromise: Promise<any>
      act(() => {
        processPromise = result.current.processQueue(mockPhotos, {}, testConfig)
      })

      // Cancel after first photo
      act(() => {
        result.current.cancel()
      })

      let queueResult: any
      await act(async () => {
        queueResult = await processPromise
      })

      expect(queueResult.cancelled).toBe(true)
      expect(callCount).toBeLessThan(3)
      expect(result.current.isCancelled).toBe(true)
    })

    it('clears state on reset', async () => {
      vi.spyOn(exportEngine, 'renderPhotoWithLayers').mockResolvedValue(new Blob(['ok']))
      vi.spyOn(platformAdapter, 'saveFileBlob').mockResolvedValue(true)

      const { result } = renderHook(() => useBatchProcess({ itemDelay: 0 }))

      await act(async () => {
        await result.current.processQueue([mockPhotos[0]], {}, testConfig)
      })

      expect(result.current.completedList.length).toBe(1)

      act(() => {
        result.current.reset()
      })

      expect(result.current.completedList).toEqual([])
      expect(result.current.failedList).toEqual([])
      expect(result.current.currentProgress).toBe(0)
      expect(result.current.totalPhotos).toBe(0)
      expect(result.current.isCancelled).toBe(false)
    })
  })
})
