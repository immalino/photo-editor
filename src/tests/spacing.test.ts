import { describe, it, expect } from 'vitest'
import { resolvePadding, resolveCanvasStyle } from '../utils/unitMath'
import { calculateBackgroundBox } from '../utils/layerBounds'
import { measureLayerBounds } from '../utils/snapEngine'
import { DEFAULT_TEXT_STYLE } from '../constants/defaultStyles'
import type { TextLayer } from '../types/layer'

describe('Padding & Typography Spacing (Letter & Line Spacing)', () => {
  const createLayer = (overrides?: Partial<TextLayer>): TextLayer => ({
    id: 'test-layer-spacing',
    text: 'Test Spacing',
    relativeX: 0.5,
    relativeY: 0.5,
    rotation: 0,
    zIndex: 0,
    visible: true,
    style: {
      ...DEFAULT_TEXT_STYLE,
    },
    ...overrides,
  })

  describe('resolvePadding', () => {
    it('resolves uniform px padding correctly', () => {
      const layer = createLayer({
        style: {
          ...DEFAULT_TEXT_STYLE,
          padding: {
            unit: 'px',
            uniform: true,
            value: 15,
            top: 15,
            right: 15,
            bottom: 15,
            left: 15,
          },
        },
      })

      const res = resolvePadding(layer, 1000, 500)
      expect(res).toEqual({ top: 15, right: 15, bottom: 15, left: 15 })
    })

    it('resolves individual sides in px mode', () => {
      const layer = createLayer({
        style: {
          ...DEFAULT_TEXT_STYLE,
          padding: {
            unit: 'px',
            uniform: false,
            value: 0,
            top: 10,
            right: 25,
            bottom: 12,
            left: 30,
          },
        },
      })

      const res = resolvePadding(layer, 1000, 500)
      expect(res).toEqual({ top: 10, right: 25, bottom: 12, left: 30 })
    })

    it('resolves percentage padding relative to photo width', () => {
      const layer = createLayer({
        style: {
          ...DEFAULT_TEXT_STYLE,
          padding: {
            unit: '%',
            ref: 'width',
            uniform: true,
            value: 0,
            valuePercent: 2, // 2% of 1000 = 20px
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          },
        },
      })

      const res = resolvePadding(layer, 1000, 500)
      expect(res).toEqual({ top: 20, right: 20, bottom: 20, left: 20 })
    })

    it('resolves percentage padding relative to photo height when ref is height', () => {
      const layer = createLayer({
        style: {
          ...DEFAULT_TEXT_STYLE,
          padding: {
            unit: '%',
            ref: 'height',
            uniform: true,
            value: 0,
            valuePercent: 5, // 5% of 600 = 30px
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          },
        },
      })

      const res = resolvePadding(layer, 1000, 600)
      expect(res).toEqual({ top: 30, right: 30, bottom: 30, left: 30 })
    })

    it('falls back to background padding if style.padding is not defined', () => {
      const layer = createLayer({
        style: {
          ...DEFAULT_TEXT_STYLE,
          background: {
            enabled: true,
            color: '#000000',
            opacity: 0.5,
            padding: 14,
            borderRadius: 4,
          },
        },
      })

      const res = resolvePadding(layer, 1000, 500)
      expect(res).toEqual({ top: 14, right: 14, bottom: 14, left: 14 })
    })
  })

  describe('calculateBackgroundBox with multi-side padding', () => {
    it('applies asymmetrical padding to bounding box', () => {
      const box = calculateBackgroundBox({
        textWidth: 100,
        textHeight: 40,
        padding: { top: 5, right: 15, bottom: 10, left: 20 },
      })

      expect(box.x).toBe(-20)
      expect(box.y).toBe(-5)
      expect(box.width).toBe(135) // 100 + 20 + 15
      expect(box.height).toBe(55) // 40 + 5 + 10
    })

    it('scales multi-side padding correctly', () => {
      const box = calculateBackgroundBox({
        textWidth: 100,
        textHeight: 40,
        padding: { top: 10, right: 20, bottom: 10, left: 20 },
        scale: 0.5,
      })

      expect(box.x).toBe(-10)
      expect(box.y).toBe(-5)
      expect(box.width).toBe(120) // 100 + 10 + 10
      expect(box.height).toBe(50) // 40 + 5 + 5
    })
  })

  describe('resolveCanvasStyle and Typography Spacing', () => {
    it('resolves scaled preview padding, letterSpacing, and lineHeight', () => {
      const layer = createLayer({
        style: {
          ...DEFAULT_TEXT_STYLE,
          letterSpacing: 4,
          lineHeight: 1.5,
          padding: {
            unit: 'px',
            uniform: true,
            value: 20,
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
          },
        },
      })

      const fit = { scale: 0.5, renderedWidth: 500, renderedHeight: 250 }
      const res = resolveCanvasStyle(layer, fit)

      expect(res.padding.top).toBe(10)
      expect(res.padding.right).toBe(10)
      expect(res.letterSpacing).toBe(2) // 4 * 0.5 = 2
      expect(res.lineHeight).toBe(1.5)
    })

    it('preserves decimal letterSpacing precision', () => {
      const layer = createLayer({
        style: {
          ...DEFAULT_TEXT_STYLE,
          letterSpacing: 1.5,
        },
      })

      const fit = { scale: 0.5, renderedWidth: 500, renderedHeight: 250 }
      const res = resolveCanvasStyle(layer, fit)

      expect(res.letterSpacing).toBe(0.75) // 1.5 * 0.5 = 0.75
    })

    it('adjusts total text height when custom lineHeight is configured', () => {
      const defaultLayer = createLayer({
        text: 'Line 1\nLine 2',
        style: { ...DEFAULT_TEXT_STYLE, fontSize: 40, lineHeight: 1.0 },
      })
      const doubleSpacedLayer = createLayer({
        text: 'Line 1\nLine 2',
        style: { ...DEFAULT_TEXT_STYLE, fontSize: 40, lineHeight: 2.0 },
      })

      const boundsDefault = measureLayerBounds(defaultLayer, 1000, 1000)
      const boundsDouble = measureLayerBounds(doubleSpacedLayer, 1000, 1000)

      expect(boundsDouble.height).toBeGreaterThan(boundsDefault.height)
      expect(boundsDouble.height).toBe(boundsDefault.height * 2)
    })

    it('adjusts text width when letterSpacing is increased', () => {
      const normalLayer = createLayer({
        text: 'Antigravity',
        style: { ...DEFAULT_TEXT_STYLE, fontSize: 40, letterSpacing: 0 },
      })
      const spacedLayer = createLayer({
        text: 'Antigravity',
        style: { ...DEFAULT_TEXT_STYLE, fontSize: 40, letterSpacing: 5 },
      })

      const boundsNormal = measureLayerBounds(normalLayer, 1000, 1000)
      const boundsSpaced = measureLayerBounds(spacedLayer, 1000, 1000)

      expect(boundsSpaced.width).toBeGreaterThan(boundsNormal.width)
    })
  })
})
