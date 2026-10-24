import { describe, it, expect, beforeEach } from 'vitest'
import { calculateBackgroundBox } from '../utils/layerBounds'
import { isValidHex, normalizeHex, hexToRgba, PRESET_COLORS } from '../utils/colorUtils'
import { WINDOWS_STANDARD_FONTS, DEFAULT_FONT } from '../constants/fonts'
import { useLayerStore } from '../stores/useLayerStore'

describe('propertiesValidation', () => {
  describe('calculateBackgroundBox', () => {
    it('calculates bounding box with standard padding and scale 1', () => {
      const box = calculateBackgroundBox({
        textWidth: 100,
        textHeight: 40,
        padding: 10,
        borderRadius: 4,
        scale: 1,
      })

      expect(box.x).toBe(-10)
      expect(box.y).toBe(-10)
      expect(box.width).toBe(120)
      expect(box.height).toBe(60)
      expect(box.cornerRadius).toBe(4)
    })

    it('calculates bounding box correctly with scaling factor', () => {
      const box = calculateBackgroundBox({
        textWidth: 100,
        textHeight: 40,
        padding: 10,
        borderRadius: 6,
        scale: 0.5,
      })

      expect(box.x).toBe(-5)
      expect(box.y).toBe(-5)
      expect(box.width).toBe(110)
      expect(box.height).toBe(50)
      expect(box.cornerRadius).toBe(3)
    })

    it('handles zero padding and zero border radius', () => {
      const box = calculateBackgroundBox({
        textWidth: 80,
        textHeight: 25,
        padding: 0,
        borderRadius: 0,
      })

      expect(box.x).toBe(0)
      expect(box.y).toBe(0)
      expect(box.width).toBe(80)
      expect(box.height).toBe(25)
      expect(box.cornerRadius).toBe(0)
    })

    it('clamps corner radius so it does not exceed half the shortest dimension', () => {
      const box = calculateBackgroundBox({
        textWidth: 20,
        textHeight: 10,
        padding: 0,
        borderRadius: 50,
      })

      // height is 10, so max radius should be 5
      expect(box.cornerRadius).toBe(5)
    })
  })

  describe('colorUtils', () => {
    it('validates 3, 6, and 8 character hex codes correctly', () => {
      expect(isValidHex('#fff')).toBe(true)
      expect(isValidHex('#FFFFFF')).toBe(true)
      expect(isValidHex('#ff000080')).toBe(true)
      expect(isValidHex('123456')).toBe(false) // missing hash
      expect(isValidHex('#ggg')).toBe(false) // invalid hex characters
      expect(isValidHex('#12345')).toBe(false) // invalid length
    })

    it('normalizes hex strings and expands shorthand hex', () => {
      expect(normalizeHex('#fff')).toBe('#FFFFFF')
      expect(normalizeHex('ff0000')).toBe('#FF0000')
      expect(normalizeHex('#00ff00')).toBe('#00FF00')
      expect(normalizeHex('invalid', '#000000')).toBe('#000000')
    })

    it('converts hex to rgba string with custom opacity', () => {
      expect(hexToRgba('#ffffff', 1)).toBe('rgba(255, 255, 255, 1)')
      expect(hexToRgba('#000000', 0.5)).toBe('rgba(0, 0, 0, 0.5)')
      expect(hexToRgba('#ff0000', 0)).toBe('rgba(255, 0, 0, 0)')
    })

    it('includes a standard preset color palette', () => {
      expect(PRESET_COLORS.length).toBeGreaterThanOrEqual(8)
      expect(PRESET_COLORS).toContain('#ffffff')
      expect(PRESET_COLORS).toContain('#000000')
    })
  })

  describe('fonts constant', () => {
    it('provides standard Windows fonts including Arial and Segoe UI', () => {
      const fontValues = WINDOWS_STANDARD_FONTS.map((f) => f.value)
      expect(fontValues).toContain('Arial')
      expect(fontValues).toContain('Segoe UI')
      expect(fontValues).toContain('Times New Roman')
      expect(fontValues).toContain('Verdana')
      expect(DEFAULT_FONT).toBe('Arial')
    })
  })

  describe('Layer store properties & reordering', () => {
    const photoId = 'test-photo'

    beforeEach(() => {
      useLayerStore.getState().clearLayers()
    })

    it('updates text content and typography properties', () => {
      const layer = useLayerStore.getState().addTextLayer(photoId)

      useLayerStore.getState().updateLayer(photoId, layer.id, {
        text: 'Hello World',
        rotation: 30,
        style: {
          ...layer.style,
          fontFamily: 'Segoe UI',
          fontSize: 60,
          bold: true,
          italic: true,
          align: 'center',
          fill: '#ffaa00',
          opacity: 0.8,
        },
      })

      const updated = useLayerStore.getState().layers[photoId][0]
      expect(updated.text).toBe('Hello World')
      expect(updated.rotation).toBe(30)
      expect(updated.style.fontFamily).toBe('Segoe UI')
      expect(updated.style.fontSize).toBe(60)
      expect(updated.style.bold).toBe(true)
      expect(updated.style.italic).toBe(true)
      expect(updated.style.align).toBe('center')
      expect(updated.style.fill).toBe('#ffaa00')
      expect(updated.style.opacity).toBe(0.8)
    })

    it('updates stroke, shadow, and background effect properties', () => {
      const layer = useLayerStore.getState().addTextLayer(photoId)

      useLayerStore.getState().updateLayer(photoId, layer.id, {
        style: {
          ...layer.style,
          stroke: {
            enabled: true,
            color: '#123456',
            width: 5,
          },
          shadow: {
            enabled: true,
            color: '#000000',
            blur: 10,
            offsetX: 4,
            offsetY: 4,
          },
          background: {
            enabled: true,
            color: '#333333',
            opacity: 0.75,
            padding: 16,
            borderRadius: 8,
          },
        },
      })

      const updated = useLayerStore.getState().layers[photoId][0]
      expect(updated.style.stroke).toEqual({
        enabled: true,
        color: '#123456',
        width: 5,
      })
      expect(updated.style.shadow).toEqual({
        enabled: true,
        color: '#000000',
        blur: 10,
        offsetX: 4,
        offsetY: 4,
      })
      expect(updated.style.background).toEqual({
        enabled: true,
        color: '#333333',
        opacity: 0.75,
        padding: 16,
        borderRadius: 8,
      })
    })

    it('toggles layer visibility', () => {
      const layer = useLayerStore.getState().addTextLayer(photoId)
      expect(useLayerStore.getState().layers[photoId][0].visible).toBe(true)

      useLayerStore.getState().toggleVisibility(photoId, layer.id)
      expect(useLayerStore.getState().layers[photoId][0].visible).toBe(false)

      useLayerStore.getState().toggleVisibility(photoId, layer.id)
      expect(useLayerStore.getState().layers[photoId][0].visible).toBe(true)
    })

    it('moves layer up and down in the stacking order', () => {
      const layerA = useLayerStore.getState().addTextLayer(photoId, { text: 'Layer A' })
      const layerB = useLayerStore.getState().addTextLayer(photoId, { text: 'Layer B' })
      const layerC = useLayerStore.getState().addTextLayer(photoId, { text: 'Layer C' })

      // Initial order: [A, B, C]
      let currentLayers = useLayerStore.getState().layers[photoId]
      expect(currentLayers.map((l) => l.id)).toEqual([layerA.id, layerB.id, layerC.id])

      // Move B up (towards C / front): order becomes [A, C, B]
      useLayerStore.getState().moveLayerUp(photoId, layerB.id)
      currentLayers = useLayerStore.getState().layers[photoId]
      expect(currentLayers.map((l) => l.id)).toEqual([layerA.id, layerC.id, layerB.id])
      expect(currentLayers[2].zIndex).toBe(2)

      // Move B down: order becomes [A, B, C]
      useLayerStore.getState().moveLayerDown(photoId, layerB.id)
      currentLayers = useLayerStore.getState().layers[photoId]
      expect(currentLayers.map((l) => l.id)).toEqual([layerA.id, layerB.id, layerC.id])

      // Moving A down should do nothing as it is already at the bottom
      useLayerStore.getState().moveLayerDown(photoId, layerA.id)
      currentLayers = useLayerStore.getState().layers[photoId]
      expect(currentLayers.map((l) => l.id)).toEqual([layerA.id, layerB.id, layerC.id])

      // Moving C up should do nothing as it is already at the top
      useLayerStore.getState().moveLayerUp(photoId, layerC.id)
      currentLayers = useLayerStore.getState().layers[photoId]
      expect(currentLayers.map((l) => l.id)).toEqual([layerA.id, layerB.id, layerC.id])
    })
  })
})
