import { describe, it, expect } from 'vitest'
import { isSupportedImageFile } from '../services/fileReader'

describe('fileReader', () => {
  describe('isSupportedImageFile', () => {
    it('accepts JPG, PNG, and WebP by MIME type', () => {
      const jpg = new File([''], 'test.jpg', { type: 'image/jpeg' })
      const png = new File([''], 'test.png', { type: 'image/png' })
      const webp = new File([''], 'test.webp', { type: 'image/webp' })

      expect(isSupportedImageFile(jpg)).toBe(true)
      expect(isSupportedImageFile(png)).toBe(true)
      expect(isSupportedImageFile(webp)).toBe(true)
    })

    it('accepts files with valid extensions even if MIME type is missing', () => {
      const jpgNoMime = new File([''], 'photo.jpg')
      const jpegNoMime = new File([''], 'PHOTO.JPEG')
      const pngNoMime = new File([''], 'image.PNG')
      const webpNoMime = new File([''], 'graphic.webp')

      expect(isSupportedImageFile(jpgNoMime)).toBe(true)
      expect(isSupportedImageFile(jpegNoMime)).toBe(true)
      expect(isSupportedImageFile(pngNoMime)).toBe(true)
      expect(isSupportedImageFile(webpNoMime)).toBe(true)
    })

    it('rejects unsupported file formats', () => {
      const pdf = new File([''], 'document.pdf', { type: 'application/pdf' })
      const gif = new File([''], 'animation.gif', { type: 'image/gif' })
      const txt = new File([''], 'notes.txt', { type: 'text/plain' })

      expect(isSupportedImageFile(pdf)).toBe(false)
      expect(isSupportedImageFile(gif)).toBe(false)
      expect(isSupportedImageFile(txt)).toBe(false)
    })
  })
})
