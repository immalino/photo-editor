import type { CustomFontRecord, FontFormat, FontOption } from '../types/font'

const DB_NAME = 'photo_editor_fonts_db'
const DB_VERSION = 1
const STORE_NAME = 'custom_fonts'

/**
 * Opens or initializes the IndexedDB database for custom fonts.
 */
function openFontDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported in this environment.'))
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Determines font format from file extension.
 */
export function detectFontFormat(fileName: string): FontFormat | null {
  const ext = fileName.toLowerCase().split('.').pop()
  switch (ext) {
    case 'ttf':
      return 'truetype'
    case 'otf':
      return 'opentype'
    case 'woff':
      return 'woff'
    case 'woff2':
      return 'woff2'
    default:
      return null
  }
}

/**
 * Sanitizes font name to be safe for CSS font-family.
 */
export function sanitizeFontName(name: string): string {
  return name.replace(/[^\w\s-]/g, '').trim() || 'CustomFont'
}

/**
 * Converts a File to Base64 data URL.
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Gagal membaca file font.'))
    reader.readAsDataURL(file)
  })
}

/**
 * Loads and registers a FontFace in the browser document.
 */
export async function registerFontFace(name: string, dataUrl: string): Promise<FontFace | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !('FontFace' in window)) {
    return null
  }

  try {
    const font = new FontFace(name, `url("${dataUrl}")`)
    const loaded = await font.load()
    document.fonts.add(loaded)
    return loaded
  } catch (err) {
    console.error(`Failed to register font "${name}":`, err)
    throw err
  }
}

/**
 * Fetches all custom font records from IndexedDB.
 */
export async function getAllCustomFonts(): Promise<CustomFontRecord[]> {
  try {
    const db = await openFontDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.getAll()
      req.onsuccess = () => resolve(req.result || [])
      req.onerror = () => reject(req.error)
    })
  } catch (e) {
    console.warn('Could not read custom fonts from IndexedDB:', e)
    return []
  }
}

/**
 * Saves a custom font record into IndexedDB and registers it with document.fonts.
 */
export async function saveCustomFont(
  file: File,
  customName?: string
): Promise<CustomFontRecord> {
  const format = detectFontFormat(file.name)
  if (!format) {
    throw new Error(
      'Format font tidak didukung. Harap pilih file font dengan ekstensi .ttf, .otf, .woff, atau .woff2'
    )
  }

  const baseName = file.name.replace(/\.[^/.]+$/, '')
  const fontName = sanitizeFontName(customName || baseName)
  const dataUrl = await readFileAsDataUrl(file)

  // Register font in runtime
  await registerFontFace(fontName, dataUrl)

  const record: CustomFontRecord = {
    id: `font-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: fontName,
    fileName: file.name,
    format,
    dataUrl,
    createdAt: new Date().toISOString(),
  }

  try {
    const db = await openFontDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.put(record)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch (err) {
    console.warn('Could not persist font to IndexedDB:', err)
  }

  return record
}

/**
 * Saves multiple custom font files in batch, reporting successfully added records and failures.
 */
export async function saveCustomFonts(
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<{
  added: CustomFontRecord[]
  failed: Array<{ fileName: string; reason: string }>
}> {
  const added: CustomFontRecord[] = []
  const failed: Array<{ fileName: string; reason: string }> = []
  let processed = 0

  for (const file of files) {
    try {
      const format = detectFontFormat(file.name)
      if (!format) {
        failed.push({
          fileName: file.name,
          reason: 'Format font tidak didukung (.ttf, .otf, .woff, .woff2)',
        })
        continue
      }
      const record = await saveCustomFont(file)
      added.push(record)
    } catch (err) {
      failed.push({
        fileName: file.name,
        reason: err instanceof Error ? err.message : 'Gagal memproses file font',
      })
    } finally {
      processed++
      onProgress?.(processed, files.length)
    }
  }

  return { added, failed }
}

/**
 * Deletes a custom font by ID from IndexedDB.
 */
export async function deleteCustomFont(id: string): Promise<boolean> {
  try {
    const db = await openFontDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.delete(id)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
    return true
  } catch (err) {
    console.error('Failed to delete font from IndexedDB:', err)
    return false
  }
}

/**
 * Converts a CustomFontRecord into a FontOption for UI selectors.
 */
export function toFontOption(record: CustomFontRecord): FontOption {
  return {
    name: record.name,
    value: record.name,
    category: 'custom',
    isCustom: true,
    format: record.format,
    dataUrl: record.dataUrl,
    fileName: record.fileName,
  }
}

