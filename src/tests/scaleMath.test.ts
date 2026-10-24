import { describe, it, expect } from 'vitest'
import {
  calculateFitScale,
  relativeToCanvas,
  canvasToRelative,
} from '../utils/scaleMath'

describe('scaleMath', () => {
  describe('calculateFitScale', () => {
    it('scales landscape photo inside larger landscape container (fit width & height proportionally)', () => {
      // Container: 1000 x 500 (aspect 2:1)
      // Image: 800 x 600 (aspect 4:3)
      // Width scale: 1000/800 = 1.25. Height scale: 500/600 = 0.8333...
      // Expected scale: 500/600 = 5/6
      const fit = calculateFitScale(1000, 500, 800, 600)

      expect(fit.scale).toBeCloseTo(5 / 6)
      expect(fit.renderedHeight).toBeCloseTo(500)
      expect(fit.renderedWidth).toBeCloseTo((800 * 5) / 6)
      // Centered horizontally: (1000 - renderedWidth) / 2
      expect(fit.x).toBeCloseTo((1000 - fit.renderedWidth) / 2)
      // Aligned vertically: (500 - 500) / 2 = 0
      expect(fit.y).toBeCloseTo(0)
    })

    it('scales landscape photo constrained by container width', () => {
      // Container: 800 x 1000 (aspect 4:5)
      // Image: 1600 x 800 (aspect 2:1)
      // Width scale: 800/1600 = 0.5. Height scale: 1000/800 = 1.25.
      // Expected scale: 0.5
      const fit = calculateFitScale(800, 1000, 1600, 800)

      expect(fit.scale).toBe(0.5)
      expect(fit.renderedWidth).toBe(800)
      expect(fit.renderedHeight).toBe(400)
      expect(fit.x).toBe(0)
      expect(fit.y).toBe((1000 - 400) / 2) // 300
    })

    it('scales portrait photo inside landscape container', () => {
      // Container: 1200 x 800
      // Image: 1000 x 2000 (portrait 1:2)
      // Width scale: 1200/1000 = 1.2. Height scale: 800/2000 = 0.4.
      // Expected scale: 0.4
      const fit = calculateFitScale(1200, 800, 1000, 2000)

      expect(fit.scale).toBe(0.4)
      expect(fit.renderedWidth).toBe(400)
      expect(fit.renderedHeight).toBe(800)
      expect(fit.x).toBe((1200 - 400) / 2) // 400
      expect(fit.y).toBe(0)
    })

    it('scales square photo in rectangular container', () => {
      // Container: 1000 x 600
      // Image: 500 x 500
      // Scale should be 600 / 500 = 1.2
      const fit = calculateFitScale(1000, 600, 500, 500)

      expect(fit.scale).toBe(1.2)
      expect(fit.renderedWidth).toBe(600)
      expect(fit.renderedHeight).toBe(600)
      expect(fit.x).toBe((1000 - 600) / 2) // 200
      expect(fit.y).toBe(0)
    })

    it('respects container padding', () => {
      const padding = 20
      // Container 1000 x 800, effective 960 x 760
      // Image 960 x 760 -> scale should be 1
      const fit = calculateFitScale(1000, 800, 960, 760, padding)

      expect(fit.scale).toBe(1)
      expect(fit.renderedWidth).toBe(960)
      expect(fit.renderedHeight).toBe(760)
      expect(fit.x).toBe(20)
      expect(fit.y).toBe(20)
    })

    it('handles high resolution photos (e.g. 50MP 8192 x 6144)', () => {
      const fit = calculateFitScale(1920, 1080, 8192, 6144)

      expect(fit.scale).toBeGreaterThan(0)
      expect(fit.renderedWidth).toBeLessThanOrEqual(1920)
      expect(fit.renderedHeight).toBeLessThanOrEqual(1080)
      expect(fit.x).toBeGreaterThanOrEqual(0)
      expect(fit.y).toBeGreaterThanOrEqual(0)
    })

    it('handles zero or negative container or image dimensions gracefully', () => {
      expect(calculateFitScale(0, 0, 100, 100)).toEqual({
        scale: 1,
        x: 0,
        y: 0,
        renderedWidth: 0,
        renderedHeight: 0,
      })

      expect(calculateFitScale(100, 100, 0, 0)).toEqual({
        scale: 1,
        x: 0,
        y: 0,
        renderedWidth: 0,
        renderedHeight: 0,
      })

      expect(calculateFitScale(-100, 200, 100, 100)).toEqual({
        scale: 1,
        x: 0,
        y: 0,
        renderedWidth: 0,
        renderedHeight: 0,
      })
    })

    it('handles padding larger than container gracefully', () => {
      const fit = calculateFitScale(100, 100, 200, 200, 60)
      expect(fit.scale).toBe(0)
      expect(fit.renderedWidth).toBe(0)
      expect(fit.renderedHeight).toBe(0)
    })
  })

  describe('relativeToCanvas and canvasToRelative', () => {
    const fit = {
      scale: 0.5,
      x: 100,
      y: 50,
      renderedWidth: 400,
      renderedHeight: 300,
    }

    it('converts relative coordinates (0 to 1) to canvas coordinates', () => {
      // (0, 0) relative is the top-left of the image on the canvas
      expect(relativeToCanvas(0, 0, fit)).toEqual({ x: 100, y: 50 })

      // (0.5, 0.5) is the exact center of the rendered image
      expect(relativeToCanvas(0.5, 0.5, fit)).toEqual({
        x: 100 + 0.5 * 400, // 300
        y: 50 + 0.5 * 300,  // 200
      })

      // (1, 1) is the bottom-right corner of the image
      expect(relativeToCanvas(1, 1, fit)).toEqual({
        x: 100 + 400, // 500
        y: 50 + 300,  // 350
      })
    })

    it('converts canvas coordinates back to relative coordinates', () => {
      expect(canvasToRelative(100, 50, fit)).toEqual({ relX: 0, relY: 0 })
      expect(canvasToRelative(300, 200, fit)).toEqual({ relX: 0.5, relY: 0.5 })
      expect(canvasToRelative(500, 350, fit)).toEqual({ relX: 1, relY: 1 })
    })

    it('handles zero dimensions in canvasToRelative', () => {
      const zeroFit = { scale: 0, x: 0, y: 0, renderedWidth: 0, renderedHeight: 0 }
      expect(canvasToRelative(100, 100, zeroFit)).toEqual({ relX: 0, relY: 0 })
    })
  })
})

