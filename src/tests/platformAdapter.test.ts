import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  isTauri,
  parseFileName,
  formatExportFileName,
  openFileDialog,
  openFolderDialog,
  saveFileBlob,
  getInitialFiles,
  loadFileFromPath,
  loadFilesFromPaths,
} from '../services/platformAdapter'

describe('platformAdapter', () => {
  describe('isTauri()', () => {
    const originalWindow = globalThis.window

    afterEach(() => {
      globalThis.window = originalWindow
    })

    it('returns false when window.__TAURI_INTERNALS__ is undefined', () => {
      expect(isTauri()).toBe(false)
    })

    it('returns true when window.__TAURI_INTERNALS__ exists', () => {
      const win = window as unknown as { __TAURI_INTERNALS__?: Record<string, unknown> }
      win.__TAURI_INTERNALS__ = {}
      expect(isTauri()).toBe(true)
      delete win.__TAURI_INTERNALS__
    })
  })

  describe('parseFileName()', () => {
    it('parses standard filename and lowercase extension', () => {
      const result = parseFileName('vacation_beach.JPG')
      expect(result).toEqual({
        baseName: 'vacation_beach',
        extension: 'jpg',
      })
    })

    it('handles Windows backslash file path', () => {
      const result = parseFileName('C:\\Users\\Photos\\landscape.png')
      expect(result).toEqual({
        baseName: 'landscape',
        extension: 'png',
      })
    })

    it('handles Unix slash file path', () => {
      const result = parseFileName('/home/user/images/portrait.webp')
      expect(result).toEqual({
        baseName: 'portrait',
        extension: 'webp',
      })
    })

    it('handles filenames with multiple dots', () => {
      const result = parseFileName('photo.v2.backup.final.jpg')
      expect(result).toEqual({
        baseName: 'photo.v2.backup.final',
        extension: 'jpg',
      })
    })

    it('handles filenames without extensions', () => {
      const result = parseFileName('untitled_image')
      expect(result).toEqual({
        baseName: 'untitled_image',
        extension: '',
      })
    })

    it('handles empty input gracefully', () => {
      const result = parseFileName('')
      expect(result).toEqual({
        baseName: '',
        extension: '',
      })
    })
  })

  describe('formatExportFileName()', () => {
    it('replaces {name} placeholder with base name and appends extension', () => {
      const output = formatExportFileName('sample_photo.jpg', '{name}_watermark', 'png')
      expect(output).toBe('sample_photo_watermark.png')
    })

    it('handles default pattern and extension', () => {
      const output = formatExportFileName('cat.jpeg')
      expect(output).toBe('cat_edited.png')
    })

    it('supports static pattern without {name}', () => {
      const output = formatExportFileName('cat.jpeg', 'output_image', 'jpg')
      expect(output).toBe('output_image.jpg')
    })

    it('strips leading dot from provided extension', () => {
      const output = formatExportFileName('dog.png', '{name}_hd', '.webp')
      expect(output).toBe('dog_hd.webp')
    })
  })

  describe('openFileDialog()', () => {
    it('creates an input element and resolves files on change', async () => {
      const mockFile = new File(['dummy content'], 'test.png', { type: 'image/png' })

      const promise = openFileDialog({ multiple: false })

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      expect(input).not.toBeNull()
      expect(input.multiple).toBe(false)
      expect(input.accept).toContain('image/')

      // Simulate file selection
      Object.defineProperty(input, 'files', {
        value: [mockFile],
        configurable: true,
      })

      input.dispatchEvent(new Event('change'))

      const files = await promise
      expect(files).toHaveLength(1)
      expect(files[0].name).toBe('test.png')
      expect(document.querySelector('input[type="file"]')).toBeNull()
    })
  })

  describe('openFolderDialog()', () => {
    it('creates an input element with webkitdirectory and filters by extension', async () => {
      const fontFile = new File(['font'], 'Roboto.ttf', { type: 'font/ttf' })
      const textFile = new File(['doc'], 'notes.txt', { type: 'text/plain' })

      const promise = openFolderDialog({ extensions: ['ttf', 'otf'] })

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      expect(input).not.toBeNull()
      expect(input.hasAttribute('webkitdirectory')).toBe(true)

      Object.defineProperty(input, 'files', {
        value: [fontFile, textFile],
        configurable: true,
      })

      input.dispatchEvent(new Event('change'))

      const files = await promise
      expect(files).toHaveLength(1)
      expect(files[0].name).toBe('Roboto.ttf')
      expect(document.querySelector('input[type="file"]')).toBeNull()
    })
  })

  describe('saveFileBlob()', () => {
    beforeEach(() => {
      if (!globalThis.URL.createObjectURL) {
        globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
      } else {
        vi.spyOn(globalThis.URL, 'createObjectURL').mockReturnValue('blob:mock-url')
      }

      if (!globalThis.URL.revokeObjectURL) {
        globalThis.URL.revokeObjectURL = vi.fn()
      } else {
        vi.spyOn(globalThis.URL, 'revokeObjectURL').mockImplementation(() => {})
      }
    })

    it('triggers link download and returns true', async () => {
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
      const blob = new Blob(['test content'], { type: 'image/png' })

      const success = await saveFileBlob(blob, 'export.png')

      expect(success).toBe(true)
      expect(clickSpy).toHaveBeenCalled()
      clickSpy.mockRestore()
    })
  })

  describe('getInitialFiles()', () => {
    it('returns empty array when not in Tauri environment', async () => {
      const files = await getInitialFiles()
      expect(files).toEqual([])
    })
  })

  describe('loadFileFromPath() and loadFilesFromPaths()', () => {
    it('returns null when not in Tauri environment', async () => {
      const file = await loadFileFromPath('/path/to/test.png')
      expect(file).toBeNull()
    })

    it('returns empty array for loadFilesFromPaths when not in Tauri', async () => {
      const files = await loadFilesFromPaths(['/path/to/1.png', '/path/to/2.jpg'])
      expect(files).toEqual([])
    })
  })
})
