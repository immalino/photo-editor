import type { PhotoItem } from '../types/photo'

export const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

export const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']

/**
 * Checks whether a file is an accepted image format (JPG, PNG, WebP).
 */
export function isSupportedImageFile(file: File): boolean {
  if (file.type && SUPPORTED_MIME_TYPES.includes(file.type.toLowerCase())) {
    return true
  }

  const name = file.name.toLowerCase()
  return SUPPORTED_EXTENSIONS.some((ext) => name.endsWith(ext))
}

/**
 * Reads an image file into an HTMLImageElement to obtain original dimensions.
 */
export function getImageDimensions(
  url: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
      })
    }
    img.onerror = (err) => {
      reject(new Error(`Failed to load image: ${err}`))
    }
    img.src = url
  })
}

/**
 * Creates a PhotoItem from a File object.
 */
export async function createPhotoItemFromFile(file: File): Promise<PhotoItem> {
  const url = URL.createObjectURL(file)
  const id = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  try {
    const { width, height } = await getImageDimensions(url)
    return {
      id,
      file,
      url,
      name: file.name,
      originalWidth: width,
      originalHeight: height,
      size: file.size,
    }
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
}
