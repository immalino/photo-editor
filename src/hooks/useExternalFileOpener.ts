import { useEffect, useCallback } from 'react'
import { isTauri, getInitialFiles, loadFilesFromPaths, onFilesOpened } from '../services/platformAdapter'
import { createPhotoItemFromFile, isSupportedImageFile } from '../services/fileReader'
import type { PhotoItem } from '../types/photo'

export interface UseExternalFileOpenerOptions {
  onPhotoAdded: (photo: PhotoItem) => void
  onError?: (msg: string) => void
}

/**
 * Hook to automatically handle image files opened via OS "Open with",
 * file associations, or command-line arguments on cold-start and warm-start.
 */
export function useExternalFileOpener({ onPhotoAdded, onError }: UseExternalFileOpenerOptions) {
  const processPaths = useCallback(
    async (paths: string[]) => {
      if (!paths || paths.length === 0) return

      try {
        const files = await loadFilesFromPaths(paths)
        const validFiles = files.filter(isSupportedImageFile)

        if (validFiles.length === 0 && files.length > 0) {
          onError?.('Format file tidak didukung. Harap buka file JPG, PNG, atau WebP.')
          return
        }

        for (const file of validFiles) {
          const photoItem = await createPhotoItemFromFile(file)
          onPhotoAdded(photoItem)
        }
      } catch (err) {
        console.error('Error opening external file:', err)
        onError?.('Gagal membuka file gambar dari sistem.')
      }
    },
    [onPhotoAdded, onError]
  )

  useEffect(() => {
    if (!isTauri()) return

    let isMounted = true

    // Check for cold-start CLI files passed when app launched
    getInitialFiles()
      .then((paths) => {
        if (isMounted && paths && paths.length > 0) {
          processPaths(paths)
        }
      })
      .catch((err) => {
        console.error('Failed to get initial files:', err)
      })

    // Listen for files opened while app is already running (single-instance second launch)
    let unlistenFn: (() => void) | null = null
    onFilesOpened((paths) => {
      if (isMounted && paths && paths.length > 0) {
        processPaths(paths)
      }
    }).then((unlisten) => {
      if (unlisten) {
        unlistenFn = unlisten
      }
    }).catch((err) => {
      console.error('Failed to register files-opened listener:', err)
    })

    return () => {
      isMounted = false
      if (unlistenFn) {
        unlistenFn()
      }
    }
  }, [processPaths])
}

