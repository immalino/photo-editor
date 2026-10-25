import { describe, it, expect, beforeEach } from 'vitest'
import { useLayerStore } from '../stores/useLayerStore'
import { DEFAULT_TEXT_STYLE } from '../constants/defaultStyles'
import { resetLastUsedTextStyle } from '../services/textStyleStorage'

describe('useLayerStore', () => {
  beforeEach(() => {
    resetLastUsedTextStyle()
    useLayerStore.getState().clearLayers()
  })

  it('initializes with empty layers and null selectedLayerId', () => {
    const state = useLayerStore.getState()
    expect(state.layers).toEqual({})
    expect(state.selectedLayerId).toBeNull()
  })

  it('adds a new text layer and automatically selects it', () => {
    const photoId = 'photo-1'
    const newLayer = useLayerStore.getState().addTextLayer(photoId)

    const state = useLayerStore.getState()
    expect(state.layers[photoId]).toBeDefined()
    expect(state.layers[photoId]).toHaveLength(1)
    expect(state.layers[photoId][0].id).toBe(newLayer.id)
    expect(state.layers[photoId][0].text).toBe('Teks Baru')
    expect(state.layers[photoId][0].relativeX).toBe(0.5)
    expect(state.layers[photoId][0].relativeY).toBe(0.5)
    expect(state.layers[photoId][0].style).toEqual(DEFAULT_TEXT_STYLE)
    expect(state.selectedLayerId).toBe(newLayer.id)
  })

  it('updates text layer properties and styles', () => {
    const photoId = 'photo-1'
    const layer = useLayerStore.getState().addTextLayer(photoId)

    useLayerStore.getState().updateLayer(photoId, layer.id, {
      text: 'Judul Baru',
      relativeX: 0.25,
      relativeY: 0.75,
      rotation: 45,
      style: {
        ...DEFAULT_TEXT_STYLE,
        fontSize: 64,
        fill: '#ff0000',
      },
    })

    const updated = useLayerStore.getState().layers[photoId][0]
    expect(updated.text).toBe('Judul Baru')
    expect(updated.relativeX).toBe(0.25)
    expect(updated.relativeY).toBe(0.75)
    expect(updated.rotation).toBe(45)
    expect(updated.style.fontSize).toBe(64)
    expect(updated.style.fill).toBe('#ff0000')
    // Untouched properties should still be preserved
    expect(updated.style.fontFamily).toBe(DEFAULT_TEXT_STYLE.fontFamily)
  })

  it('selects and deselects layers', () => {
    const photoId = 'photo-1'
    const layer1 = useLayerStore.getState().addTextLayer(photoId)
    const layer2 = useLayerStore.getState().addTextLayer(photoId)

    expect(useLayerStore.getState().selectedLayerId).toBe(layer2.id)

    useLayerStore.getState().selectLayer(layer1.id)
    expect(useLayerStore.getState().selectedLayerId).toBe(layer1.id)

    useLayerStore.getState().selectLayer(null)
    expect(useLayerStore.getState().selectedLayerId).toBeNull()
  })

  it('deletes layer and clears selection if deleted layer was selected', () => {
    const photoId = 'photo-1'
    const layer = useLayerStore.getState().addTextLayer(photoId)

    expect(useLayerStore.getState().selectedLayerId).toBe(layer.id)

    useLayerStore.getState().deleteLayer(photoId, layer.id)
    const state = useLayerStore.getState()
    expect(state.layers[photoId]).toHaveLength(0)
    expect(state.selectedLayerId).toBeNull()
  })

  it('does not reset selection when another layer is deleted', () => {
    const photoId = 'photo-1'
    const layer1 = useLayerStore.getState().addTextLayer(photoId)
    const layer2 = useLayerStore.getState().addTextLayer(photoId)

    useLayerStore.getState().selectLayer(layer1.id)
    useLayerStore.getState().deleteLayer(photoId, layer2.id)

    expect(useLayerStore.getState().selectedLayerId).toBe(layer1.id)
    expect(useLayerStore.getState().layers[photoId]).toHaveLength(1)
  })

  it('reorders layers correctly with zIndex', () => {
    const photoId = 'photo-1'
    const layer1 = useLayerStore.getState().addTextLayer(photoId)
    const layer2 = useLayerStore.getState().addTextLayer(photoId)

    useLayerStore.getState().reorderLayers(photoId, [layer2.id, layer1.id])

    const layers = useLayerStore.getState().layers[photoId]
    expect(layers[0].id).toBe(layer2.id)
    expect(layers[0].zIndex).toBe(0)
    expect(layers[1].id).toBe(layer1.id)
    expect(layers[1].zIndex).toBe(1)
  })

  it('retrieves selected layer with getSelectedLayer helper', () => {
    const photoId = 'photo-1'
    const layer = useLayerStore.getState().addTextLayer(photoId)
    const retrieved = useLayerStore.getState().getSelectedLayer(photoId)

    expect(retrieved?.id).toBe(layer.id)
  })
})
