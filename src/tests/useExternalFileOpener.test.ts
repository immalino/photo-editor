import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useExternalFileOpener } from '../hooks/useExternalFileOpener'
import * as platformAdapter from '../services/platformAdapter'
import * as fileReader from '../services/fileReader'

describe('useExternalFileOpener', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(platformAdapter, 'onFilesOpened').mockResolvedValue(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does nothing when isTauri() is false', async () => {
    vi.spyOn(platformAdapter, 'isTauri').mockReturnValue(false)
    const getInitialFilesSpy = vi.spyOn(platformAdapter, 'getInitialFiles')
    const onPhotoAdded = vi.fn()

    renderHook(() => useExternalFileOpener({ onPhotoAdded }))

    expect(getInitialFilesSpy).not.toHaveBeenCalled()
    expect(onPhotoAdded).not.toHaveBeenCalled()
  })

  it('loads cold-start files when in Tauri and calls onPhotoAdded', async () => {
    vi.spyOn(platformAdapter, 'isTauri').mockReturnValue(true)
    vi.spyOn(platformAdapter, 'getInitialFiles').mockResolvedValue(['C:\\Images\\photo.png'])

    const mockFile = new File([new Uint8Array([1, 2, 3])], 'photo.png', { type: 'image/png' })
    vi.spyOn(platformAdapter, 'loadFilesFromPaths').mockResolvedValue([mockFile])
    vi.spyOn(fileReader, 'isSupportedImageFile').mockReturnValue(true)
    vi.spyOn(fileReader, 'createPhotoItemFromFile').mockResolvedValue({
      id: 'photo_123',
      name: 'photo.png',
      file: mockFile,
      url: 'blob:test',
      originalWidth: 800,
      originalHeight: 600,
      size: 3,
    })

    const onPhotoAdded = vi.fn()
    renderHook(() => useExternalFileOpener({ onPhotoAdded }))

    await waitFor(() => {
      expect(onPhotoAdded).toHaveBeenCalledTimes(1)
      expect(onPhotoAdded).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'photo_123',
          name: 'photo.png',
        })
      )
    })
  })

  it('reports error when format is unsupported', async () => {
    vi.spyOn(platformAdapter, 'isTauri').mockReturnValue(true)
    vi.spyOn(platformAdapter, 'getInitialFiles').mockResolvedValue(['C:\\Images\\document.pdf'])

    const mockFile = new File([new Uint8Array([1, 2, 3])], 'document.pdf', { type: 'application/pdf' })
    vi.spyOn(platformAdapter, 'loadFilesFromPaths').mockResolvedValue([mockFile])
    vi.spyOn(fileReader, 'isSupportedImageFile').mockReturnValue(false)

    const onPhotoAdded = vi.fn()
    const onError = vi.fn()
    renderHook(() => useExternalFileOpener({ onPhotoAdded, onError }))

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        expect.stringContaining('Format file tidak didukung')
      )
    })
    expect(onPhotoAdded).not.toHaveBeenCalled()
  })

  it('handles live files-opened event from second instance', async () => {
    vi.spyOn(platformAdapter, 'isTauri').mockReturnValue(true)
    vi.spyOn(platformAdapter, 'getInitialFiles').mockResolvedValue([])

    let eventCallback: ((paths: string[]) => void) | null = null
    vi.spyOn(platformAdapter, 'onFilesOpened').mockImplementation(async (cb) => {
      eventCallback = cb
      return () => {}
    })

    const mockFile = new File([new Uint8Array([4, 5, 6])], 'photo2.webp', { type: 'image/webp' })
    vi.spyOn(platformAdapter, 'loadFilesFromPaths').mockResolvedValue([mockFile])
    vi.spyOn(fileReader, 'isSupportedImageFile').mockReturnValue(true)
    vi.spyOn(fileReader, 'createPhotoItemFromFile').mockResolvedValue({
      id: 'photo_456',
      name: 'photo2.webp',
      file: mockFile,
      url: 'blob:test2',
      originalWidth: 1200,
      originalHeight: 900,
      size: 6,
    })

    const onPhotoAdded = vi.fn()
    renderHook(() => useExternalFileOpener({ onPhotoAdded }))

    await waitFor(() => {
      expect(eventCallback).not.toBeNull()
    })

    // Simulate second instance firing event
    eventCallback!(['C:\\Images\\photo2.webp'])

    await waitFor(() => {
      expect(onPhotoAdded).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'photo_456',
          name: 'photo2.webp',
        })
      )
    })
  })
})

