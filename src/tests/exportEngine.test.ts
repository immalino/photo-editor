import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  normalizeExportQuality,
  getMimeType,
  calculateAbsolutePosition,
  drawRoundedRect,
  renderPhotoWithLayers,
} from '../services/exportEngine'
import { generateExportFileName } from '../utils/fileNaming'
import type { PhotoItem } from '../types/photo'
import type { TextLayer } from '../types/layer'
import type { ExportConfig } from '../types/export'

describe('fileNaming', () => {
  describe('generateExportFileName', () => {
    it('replaces {name} with original file base name', () => {
      const result = generateExportFileName('landscape.jpg', '{name}_watermark', 'png')
      expect(result).toBe('landscape_watermark.png')
    })

    it('works when extension has a leading dot', () => {
      const result = generateExportFileName('photo.png', '{name}_hd', '.jpg')
      expect(result).toBe('photo_hd.jpg')
    })

    it('uses pattern directly if no {name} placeholder is present', () => {
      const result = generateExportFileName('photo.png', 'custom_output', 'webp')
      expect(result).toBe('custom_output.webp')
    })

    it('handles empty filename by falling back to "photo"', () => {
      const result = generateExportFileName('', '{name}_export', 'png')
      expect(result).toBe('photo_export.png')
    })

    it('handles empty or whitespace pattern with default {name}_edited', () => {
      const result = generateExportFileName('travel.webp', '  ', 'jpg')
      expect(result).toBe('travel_edited.jpg')
    })
  })
})

describe('exportEngine', () => {
  describe('normalizeExportQuality', () => {
    it('converts percentage (1-100) to decimal (0.01-1.0)', () => {
      expect(normalizeExportQuality(85)).toBeCloseTo(0.85, 2)
      expect(normalizeExportQuality(50)).toBeCloseTo(0.5, 2)
      expect(normalizeExportQuality(100)).toBe(1.0)
    })

    it('keeps decimal values as-is within valid range', () => {
      expect(normalizeExportQuality(0.85)).toBeCloseTo(0.85, 2)
      expect(normalizeExportQuality(0.3)).toBeCloseTo(0.3, 2)
    })

    it('clamps values below 0.01 and above 1.0', () => {
      expect(normalizeExportQuality(-5)).toBe(0.01)
      expect(normalizeExportQuality(150)).toBe(1.0)
    })

    it('returns default 0.92 for NaN or invalid input', () => {
      expect(normalizeExportQuality(NaN)).toBe(0.92)
      expect(normalizeExportQuality(undefined as unknown as number)).toBe(0.92)
    })
  })

  describe('getMimeType', () => {
    it('returns image/png for png', () => {
      expect(getMimeType('png')).toBe('image/png')
    })

    it('returns image/jpeg for jpg', () => {
      expect(getMimeType('jpg')).toBe('image/jpeg')
    })

    it('returns image/webp for webp', () => {
      expect(getMimeType('webp')).toBe('image/webp')
    })
  })

  describe('calculateAbsolutePosition', () => {
    it('calculates pixel position from relative coordinates and dimensions', () => {
      const pos = calculateAbsolutePosition(0.5, 0.25, 4000, 3000)
      expect(pos).toEqual({
        x: 2000,
        y: 750,
      })
    })

    it('rounds result to integer pixels', () => {
      const pos = calculateAbsolutePosition(0.3333, 0.6666, 1920, 1080)
      expect(Number.isInteger(pos.x)).toBe(true)
      expect(Number.isInteger(pos.y)).toBe(true)
    })
  })

  describe('drawRoundedRect', () => {
    it('uses roundRect if supported by context', () => {
      const roundRectMock = vi.fn()
      const mockCtx = {
        beginPath: vi.fn(),
        roundRect: roundRectMock,
      } as unknown as CanvasRenderingContext2D

      drawRoundedRect(mockCtx, 10, 20, 100, 50, 8)
      expect(roundRectMock).toHaveBeenCalledWith(10, 20, 100, 50, 8)
    })

    it('uses bezier/quadratic curve fallback if roundRect is not present', () => {
      const mockCtx = {
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        quadraticCurveTo: vi.fn(),
        closePath: vi.fn(),
      } as unknown as CanvasRenderingContext2D

      drawRoundedRect(mockCtx, 0, 0, 100, 60, 10)
      expect(mockCtx.beginPath).toHaveBeenCalled()
      expect(mockCtx.quadraticCurveTo).toHaveBeenCalled()
      expect(mockCtx.closePath).toHaveBeenCalled()
    })
  })

  describe('renderPhotoWithLayers', () => {
    const samplePhoto: PhotoItem = {
      id: 'photo-1',
      name: 'mountain.jpg',
      url: 'blob:http://localhost/mountain',
      originalWidth: 2000,
      originalHeight: 1500,
    }

    const sampleLayers: TextLayer[] = [
      {
        id: 'layer-1',
        text: 'Title Text\nSecond Line',
        relativeX: 0.1,
        relativeY: 0.2,
        rotation: 15,
        zIndex: 1,
        visible: true,
        style: {
          fontFamily: 'Arial',
          fontSize: 64,
          fill: '#ffffff',
          opacity: 0.9,
          align: 'center',
          bold: true,
          italic: false,
          stroke: {
            enabled: true,
            color: '#000000',
            width: 3,
          },
          shadow: {
            enabled: true,
            color: 'rgba(0, 0, 0, 0.8)',
            blur: 6,
            offsetX: 3,
            offsetY: 3,
          },
          background: {
            enabled: true,
            color: '#000000',
            opacity: 0.7,
            padding: 12,
            borderRadius: 6,
          },
        },
      },
      {
        id: 'layer-hidden',
        text: 'Hidden Layer',
        relativeX: 0.5,
        relativeY: 0.5,
        rotation: 0,
        zIndex: 2,
        visible: false,
        style: {
          fontFamily: 'Arial',
          fontSize: 32,
          fill: '#ff0000',
          opacity: 1,
          align: 'left',
          bold: false,
          italic: false,
          stroke: { enabled: false, color: '#000', width: 0 },
          shadow: { enabled: false, color: '#000', blur: 0, offsetX: 0, offsetY: 0 },
          background: { enabled: false, color: '#000', opacity: 0, padding: 0, borderRadius: 0 },
        },
      },
    ]

    const config: ExportConfig = {
      format: 'png',
      quality: 0.9,
      namingPattern: '{name}_edited',
    }

    beforeEach(() => {
      // Mock Image constructor in jsdom
      vi.stubGlobal(
        'Image',
        class {
          crossOrigin = ''
          src = ''
          onload: (() => void) | null = null
          onerror: (() => void) | null = null
          constructor() {
            setTimeout(() => {
              if (this.onload) this.onload()
            }, 0)
          }
        }
      )
    })

    it('renders base image and visible layers at full resolution onto canvas', async () => {
      const drawImageMock = vi.fn()
      const fillTextMock = vi.fn()
      const strokeTextMock = vi.fn()
      const toBlobMock = vi.fn((callback: (b: Blob | null) => void) => {
        callback(new Blob(['test-blob'], { type: 'image/png' }))
      })

      const mockContext = {
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        quadraticCurveTo: vi.fn(),
        fill: vi.fn(),
        drawImage: drawImageMock,
        fillText: fillTextMock,
        strokeText: strokeTextMock,
        measureText: vi.fn((text: string) => ({ width: text.length * 10 })),
        font: '',
        textBaseline: '',
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
        globalAlpha: 1,
        shadowColor: '',
        shadowBlur: 0,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
      }

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => mockContext),
        toBlob: toBlobMock,
      } as unknown as HTMLCanvasElement

      const resultBlob = await renderPhotoWithLayers(samplePhoto, sampleLayers, config, mockCanvas)

      expect(mockCanvas.width).toBe(2000)
      expect(mockCanvas.height).toBe(1500)
      expect(drawImageMock).toHaveBeenCalledWith(expect.anything(), 0, 0, 2000, 1500)
      expect(mockContext.rotate).toHaveBeenCalledWith((15 * Math.PI) / 180)
      expect(fillTextMock).toHaveBeenCalled()
      expect(strokeTextMock).toHaveBeenCalled()
      expect(resultBlob).toBeInstanceOf(Blob)
    })

    it('handles canvas without 2D context by rejecting', async () => {
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => null),
      } as unknown as HTMLCanvasElement

      await expect(
        renderPhotoWithLayers(samplePhoto, sampleLayers, config, mockCanvas)
      ).rejects.toThrow('Canvas 2D context is not supported')
    })
  })
})

