import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  getLastUsedTextStyle,
  saveLastUsedTextStyle,
  resetLastUsedTextStyle,
  LAST_USED_STYLE_STORAGE_KEY,
} from '../services/textStyleStorage'
import { DEFAULT_TEXT_STYLE } from '../constants/defaultStyles'
import { useLayerStore } from '../stores/useLayerStore'

describe('textStyleStorage', () => {
  beforeEach(() => {
    resetLastUsedTextStyle()
    useLayerStore.getState().clearLayers()
  })

  afterEach(() => {
    resetLastUsedTextStyle()
  })

  it('returns DEFAULT_TEXT_STYLE when no style is saved', () => {
    const style = getLastUsedTextStyle()
    expect(style).toEqual(DEFAULT_TEXT_STYLE)
  })

  it('saves and retrieves modified text style properties', () => {
    saveLastUsedTextStyle({
      fontFamily: 'Impact',
      fontSize: 64,
      fill: '#ff0055',
      letterSpacing: 2.5,
      bold: true,
      shadow: {
        ...DEFAULT_TEXT_STYLE.shadow,
        enabled: true,
        blur: 8,
      },
    })

    const loaded = getLastUsedTextStyle()
    expect(loaded.fontFamily).toBe('Impact')
    expect(loaded.fontSize).toBe(64)
    expect(loaded.fill).toBe('#ff0055')
    expect(loaded.letterSpacing).toBe(2.5)
    expect(loaded.bold).toBe(true)
    expect(loaded.shadow.enabled).toBe(true)
    expect(loaded.shadow.blur).toBe(8)
    // Untouched properties still have default values
    expect(loaded.lineHeight).toBe(DEFAULT_TEXT_STYLE.lineHeight)
    expect(loaded.stroke).toEqual(DEFAULT_TEXT_STYLE.stroke)
  })

  it('merges subsequent partial updates cleanly', () => {
    saveLastUsedTextStyle({ fontFamily: 'Courier New', letterSpacing: 1.2 })
    saveLastUsedTextStyle({ fill: '#00ffaa' })

    const loaded = getLastUsedTextStyle()
    expect(loaded.fontFamily).toBe('Courier New')
    expect(loaded.letterSpacing).toBe(1.2)
    expect(loaded.fill).toBe('#00ffaa')
  })

  it('handles invalid JSON in localStorage gracefully', () => {
    window.localStorage.setItem(LAST_USED_STYLE_STORAGE_KEY, 'invalid-json{{{')
    const style = getLastUsedTextStyle()
    expect(style).toEqual(DEFAULT_TEXT_STYLE)
  })

  it('resets last-used text style', () => {
    saveLastUsedTextStyle({ fontFamily: 'Georgia', fontSize: 72 })
    resetLastUsedTextStyle()
    const loaded = getLastUsedTextStyle()
    expect(loaded).toEqual(DEFAULT_TEXT_STYLE)
  })

  it('causes new addTextLayer to automatically use the last-used text style', () => {
    const photoId = 'test-photo'

    // Simulate user editing a layer's style
    const layer1 = useLayerStore.getState().addTextLayer(photoId)
    useLayerStore.getState().updateLayer(photoId, layer1.id, {
      style: {
        ...DEFAULT_TEXT_STYLE,
        fontFamily: 'Comic Sans MS',
        fontSize: 55,
        fill: '#ffff00',
        letterSpacing: 3.5,
      },
    })

    // Now add another text layer
    const layer2 = useLayerStore.getState().addTextLayer(photoId)

    expect(layer2.style.fontFamily).toBe('Comic Sans MS')
    expect(layer2.style.fontSize).toBe(55)
    expect(layer2.style.fill).toBe('#ffff00')
    expect(layer2.style.letterSpacing).toBe(3.5)
    // Position and text are still fresh defaults
    expect(layer2.text).toBe('Teks Baru')
    expect(layer2.relativeX).toBe(0.5)
    expect(layer2.relativeY).toBe(0.5)
  })
})
