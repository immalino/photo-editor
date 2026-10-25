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

  // Tauri Native Dialog Integration
  if (isTauri()) {
    try {
      const dialog = await import('@tauri-apps/plugin-dialog')
      const fs = await import('@tauri-apps/plugin-fs')

      const selected = await dialog.open({
        multiple,
        filters: [
          {
            name: 'Images',
            extensions: ['jpg', 'jpeg', 'png', 'webp'],
          },
        ],
      })

      if (!selected) return []

      const paths = Array.isArray(selected) ? selected : [selected]
      const files: File[] = []

      for (const filePath of paths) {
        try {
          const contents = await fs.readFile(filePath)
          const { baseName, extension } = parseFileName(filePath)
          const mimeType =
            extension === 'png'
              ? 'image/png'
              : extension === 'webp'
              ? 'image/webp'
              : 'image/jpeg'
          const file = new File([contents], `${baseName}.${extension}`, {
            type: mimeType,
          })
          files.push(file)
        } catch (e) {
          console.error('Failed to read file from Tauri fs:', e)
        }
      }

      return files
    } catch (err) {
      console.warn('Tauri dialog failed, falling back to browser dialog:', err)
    }
  }

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

export interface OpenFolderOptions {
  extensions?: string[]
}

/**
 * Opens a folder picker dialog to select an entire folder of files.
 * In Tauri desktop shell, uses native directory picker and reads files matching extensions.
 * In web browsers, uses an input with webkitdirectory.
 */
export async function openFolderDialog(
  options: OpenFolderOptions = {}
): Promise<File[]> {
  const { extensions = ['ttf', 'otf', 'woff', 'woff2'] } = options
  const cleanExts = extensions.map((ext) => ext.toLowerCase().replace(/^\./, ''))

  if (isTauri()) {
    try {
      const dialog = await import('@tauri-apps/plugin-dialog')
      const fs = await import('@tauri-apps/plugin-fs')

      const selected = await dialog.open({
        directory: true,
        multiple: false,
      })

      if (!selected) return []

      const folderPath = typeof selected === 'string' ? selected : selected[0]
      if (!folderPath) return []

      const entries = await fs.readDir(folderPath)
      const files: File[] = []

      for (const entry of entries) {
        if (!entry.isFile && !entry.name) continue
        const { extension } = parseFileName(entry.name)
        if (cleanExts.length > 0 && !cleanExts.includes(extension)) continue

        try {
          const filePath = `${folderPath}/${entry.name}`
          const contents = await fs.readFile(filePath)
          const file = new File([contents], entry.name, {
            type:
              extension === 'ttf'
                ? 'font/ttf'
                : extension === 'otf'
                  ? 'font/otf'
                  : 'application/octet-stream',
          })
          files.push(file)
        } catch (e) {
          console.warn(`Could not read file ${entry.name}:`, e)
        }
      }

      return files
    } catch (err) {
      console.warn('Tauri open folder dialog failed, falling back to browser dialog:', err)
    }
  }

  if (typeof document === 'undefined') {
    return []
  }

  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.style.display = 'none'
    input.multiple = true
    input.setAttribute('webkitdirectory', '')
    input.setAttribute('directory', '')

    let hasHandled = false

    const cleanup = () => {
      if (document.body.contains(input)) {
        document.body.removeChild(input)
      }
    }

    input.onchange = () => {
      hasHandled = true
      const rawFiles = input.files ? Array.from(input.files) : []
      cleanup()
      const filtered =
        cleanExts.length > 0
          ? rawFiles.filter((f) => {
              const ext = f.name.toLowerCase().split('.').pop()
              return ext ? cleanExts.includes(ext) : false
            })
          : rawFiles
      resolve(filtered)
    }

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
 * Supports Tauri native file save dialog and browser fallback download link.
 */
export async function saveFileBlob(
  blob: Blob,
  defaultFileName: string
): Promise<boolean> {
  // Tauri Native Save Integration
  if (isTauri()) {
    try {
      const dialog = await import('@tauri-apps/plugin-dialog')
      const fs = await import('@tauri-apps/plugin-fs')
      const { extension } = parseFileName(defaultFileName)

      const filePath = await dialog.save({
        defaultPath: defaultFileName,
        filters: extension
          ? [
              {
                name: extension.toUpperCase(),
                extensions: [extension],
              },
            ]
          : undefined,
      })

      if (!filePath) {
        return false // user cancelled
      }

      const buffer = await blob.arrayBuffer()
      await fs.writeFile(filePath, new Uint8Array(buffer))
      return true
    } catch (err) {
      console.warn('Tauri save failed, falling back to browser download:', err)
    }
  }

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
