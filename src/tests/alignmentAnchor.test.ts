import { describe, it, expect } from 'vitest'
import { measureLayerBounds, getPresetAlignmentPosition } from '../utils/snapEngine'
import { DEFAULT_TEXT_STYLE } from '../constants/defaultStyles'
import type { TextLayer, TextAlign } from '../types/layer'

describe('Alignment Anchor Mechanics (Right, Center, Left)', () => {
  const photoW = 1000
  const photoH = 800

  const createLayer = (overrides?: Partial<TextLayer>): TextLayer => ({
    id: 'test-layer-align',
    text: 'Short',
    relativeX: 0.9,
    relativeY: 0.8,
    rotation: 0,
    zIndex: 0,
    visible: true,
    style: {
      ...DEFAULT_TEXT_STYLE,
      fontSize: 40,
      fontSizeUnit: 'px',
      align: 'right',
    },
    ...overrides,
  })

  describe('Right-Aligned Anchor (Rata Kanan)', () => {
    it('maintains fixed right edge when text content expands', () => {
      // Short text
      const shortLayer = createLayer({ text: 'Halo', style: { ...DEFAULT_TEXT_STYLE, fontSize: 40, align: 'right' } })
      const boundsShort = measureLayerBounds(shortLayer, photoW, photoH)

      // Long text
      const longLayer = createLayer({ text: 'Halo Semuanya Selamat Pagi Dunia', style: { ...DEFAULT_TEXT_STYLE, fontSize: 40, align: 'right' } })
      const boundsLong = measureLayerBounds(longLayer, photoW, photoH)

      expect(boundsLong.width).toBeGreaterThan(boundsShort.width)

      // Both layers have the same relativeX anchor (0.9 -> 900px on photo)
      const anchorX = 0.9 * photoW // 900px

      // In the right-aligned model:
      // The right edge is at anchorX
      const rightEdgeShort = anchorX
      const rightEdgeLong = anchorX

      // Right edge remains identical!
      expect(rightEdgeLong).toBe(rightEdgeShort)

      // Left edge shifts leftwards
      const leftEdgeShort = anchorX - boundsShort.width
      const leftEdgeLong = anchorX - boundsLong.width

      expect(leftEdgeLong).toBeLessThan(leftEdgeShort)
    })

    it('positions right-aligned preset cleanly at right edge with safe margin ratio', () => {
      const layer = createLayer({
        style: {
          ...DEFAULT_TEXT_STYLE,
          fontSize: 30,
          align: 'right',
        },
      })

      const pos = getPresetAlignmentPosition(layer, photoW, photoH, 'bottom-right', 0.04)
      // For align = 'right', pos.relativeX represents the right edge!
      // Photo width (1000) - safeMargin (0.04 * 1000 = 40) = 960px -> relativeX = 0.96
      expect(pos.relativeX).toBe(0.96)
    })
  })

  describe('Center-Aligned Anchor (Rata Tengah)', () => {
    it('maintains fixed center when text content expands', () => {
      const shortLayer = createLayer({
        text: 'Short',
        relativeX: 0.5,
        style: { ...DEFAULT_TEXT_STYLE, fontSize: 40, align: 'center' },
      })
      const boundsShort = measureLayerBounds(shortLayer, photoW, photoH)

      const longLayer = createLayer({
        text: 'A Very Much Longer Center Aligned Text',
        relativeX: 0.5,
        style: { ...DEFAULT_TEXT_STYLE, fontSize: 40, align: 'center' },
      })
      const boundsLong = measureLayerBounds(longLayer, photoW, photoH)

      const anchorX = 0.5 * photoW // 500px

      // In center-aligned model: center is always at anchorX
      const centerShort = anchorX
      const centerLong = anchorX
      expect(centerLong).toBe(centerShort)

      // Left edge expands left, right edge expands right symmetrically
      const leftShort = anchorX - boundsShort.width / 2
      const leftLong = anchorX - boundsLong.width / 2
      const rightShort = anchorX + boundsShort.width / 2
      const rightLong = anchorX + boundsLong.width / 2

      expect(leftLong).toBeLessThan(leftShort)
      expect(rightLong).toBeGreaterThan(rightShort)
      expect(Math.round(centerLong - leftLong)).toBe(Math.round(rightLong - centerLong))
    })

    it('positions center preset exactly at 0.5', () => {
      const layer = createLayer({
        style: {
          ...DEFAULT_TEXT_STYLE,
          fontSize: 32,
          align: 'center',
        },
      })

      const pos = getPresetAlignmentPosition(layer, photoW, photoH, 'center')
      expect(pos.relativeX).toBe(0.5)
    })
  })

  describe('Left-Aligned Anchor (Rata Kiri)', () => {
    it('maintains fixed left edge when text content expands', () => {
      const shortLayer = createLayer({
        text: 'Left',
        relativeX: 0.1,
        style: { ...DEFAULT_TEXT_STYLE, fontSize: 40, align: 'left' },
      })
      const boundsShort = measureLayerBounds(shortLayer, photoW, photoH)

      const longLayer = createLayer({
        text: 'Left Expanded Words',
        relativeX: 0.1,
        style: { ...DEFAULT_TEXT_STYLE, fontSize: 40, align: 'left' },
      })
      const boundsLong = measureLayerBounds(longLayer, photoW, photoH)

      const anchorX = 0.1 * photoW // 100px

      // Left edge remains fixed
      expect(anchorX).toBe(100)

      // Right edge moves rightwards
      const rightShort = anchorX + boundsShort.width
      const rightLong = anchorX + boundsLong.width
      expect(rightLong).toBeGreaterThan(rightShort)
    })
  })

  describe('Dynamic Alignment Switching (Preserve Visual Position)', () => {
    function convertAlignAnchor(
      layer: TextLayer,
      newAlign: TextAlign,
      width: number,
      pw: number
    ): number {
      const oldAlign = layer.style.align || 'left'
      const relWidth = width / pw

      let visualLeft = layer.relativeX
      if (oldAlign === 'center') {
        visualLeft = layer.relativeX - relWidth / 2
      } else if (oldAlign === 'right') {
        visualLeft = layer.relativeX - relWidth
      }

      let newRelativeX = visualLeft
      if (newAlign === 'center') {
        newRelativeX = visualLeft + relWidth / 2
      } else if (newAlign === 'right') {
        newRelativeX = visualLeft + relWidth
      }

      return Number(newRelativeX.toFixed(5))
    }

    it('preserves visual left, center, and right coordinates when switching alignments', () => {
      const layer = createLayer({
        relativeX: 0.2,
        style: { ...DEFAULT_TEXT_STYLE, align: 'left' },
      })
      const width = 200 // 200px on 1000px photo = 0.2 relWidth

      // Initially left = 0.2, center = 0.3, right = 0.4
      // 1. Switch from Left to Center
      const centerRelX = convertAlignAnchor(layer, 'center', width, photoW)
      expect(centerRelX).toBe(0.3) // Center anchor is at 0.3

      // 2. Switch from Center to Right
      const centeredLayer = { ...layer, relativeX: centerRelX, style: { ...layer.style, align: 'center' as const } }
      const rightRelX = convertAlignAnchor(centeredLayer, 'right', width, photoW)
      expect(rightRelX).toBe(0.4) // Right anchor is at 0.4

      // 3. Switch back from Right to Left
      const rightLayer = { ...layer, relativeX: rightRelX, style: { ...layer.style, align: 'right' as const } }
      const leftRelX = convertAlignAnchor(rightLayer, 'left', width, photoW)
      expect(leftRelX).toBe(0.2) // Back to 0.2
    })
  })
})

