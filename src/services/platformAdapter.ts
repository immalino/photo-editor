export interface OpenFileOptions {
  multiple?: boolean
  accept?: string
}

export interface ParsedFileName {
  baseName: string
  extension: string
}

/**
 * Check whether the current runtime environment is inside Tauri desktop shell.
 */
export function isTauri(): boolean {
  if (typeof window === 'undefined') return false
  const tauriWindow = window as unknown as { __TAURI_INTERNALS__?: unknown }
  return Boolean(tauriWindow.__TAURI_INTERNALS__)
}

/**
 * Parses a file path or file name into its base name and extension.
 * Supports Windows backslashes and Unix slashes.
 */
export function parseFileName(filePathOrName: string): ParsedFileName {
  if (!filePathOrName) {
    return { baseName: '', extension: '' }
  }

  // Remove directory paths (both / and \)
  const cleanName = filePathOrName.replace(/^.*[\\/]/, '')
  const lastDotIndex = cleanName.lastIndexOf('.')

  if (lastDotIndex <= 0) {
    return {
      baseName: cleanName,
      extension: '',
    }
  }

  return {
    baseName: cleanName.substring(0, lastDotIndex),
    extension: cleanName.substring(lastDotIndex + 1).toLowerCase(),
  }
}

/**
 * Generates an export file name based on template pattern and desired extension.
 * Pattern supports placeholder '{name}'.
 */
export function formatExportFileName(
  originalName: string,
  pattern: string = '{name}_edited',
  extension: string = 'png'
): string {
  const { baseName } = parseFileName(originalName)
  const cleanExt = extension.replace(/^\./, '').toLowerCase()

  const renderedName = pattern.includes('{name}')
    ? pattern.replace(/{name}/g, baseName || 'photo')
    : `${pattern}`

  return `${renderedName}.${cleanExt}`
}

/**
 * Opens a native or browser file picker dialog.
 * Resolves with array of selected File objects.
 */
export async function openFileDialog(
  options: OpenFileOptions = {}
): Promise<File[]> {
  const {
    multiple = false,
    accept = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
  } = options

  if (typeof document === 'undefined') {
    return []
  }

  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.style.display = 'none'
    input.multiple = multiple
    input.accept = accept

    let hasHandled = false

    const cleanup = () => {
      if (document.body.contains(input)) {
        document.body.removeChild(input)
      }
    }

    input.onchange = () => {
      hasHandled = true
      const files = input.files ? Array.from(input.files) : []
      cleanup()
      resolve(files)
    }

    // Cancel detection fallback when window regains focus
    const onWindowFocus = () => {
      setTimeout(() => {
        if (!hasHandled) {
          window.removeEventListener('focus', onWindowFocus)
          cleanup()
          resolve([])
        }
      }, 500)
    }

    window.addEventListener('focus', onWindowFocus, { once: true })

    document.body.appendChild(input)
    input.click()
  })
}

/**
 * Triggers saving a Blob to the user's computer.
 * Uses browser download link mechanism with automatic cleanup.
 */
export async function saveFileBlob(
  blob: Blob,
  defaultFileName: string
): Promise<boolean> {
  if (typeof document === 'undefined' || typeof URL === 'undefined') {
    return false
  }

  try {
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.style.display = 'none'
    anchor.href = url
    anchor.download = defaultFileName

    document.body.appendChild(anchor)
    anchor.click()

    setTimeout(() => {
      if (document.body.contains(anchor)) {
        document.body.removeChild(anchor)
      }
      URL.revokeObjectURL(url)
    }, 100)

    return true
  } catch (error) {
    console.error('Failed to save file blob:', error)
    return false
  }
}
