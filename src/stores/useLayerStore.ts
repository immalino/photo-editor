import { create } from 'zustand'
import type { TextLayer } from '../types/layer'
import { DEFAULT_TEXT_STYLE } from '../constants/defaultStyles'
import { getLastUsedTextStyle, saveLastUsedTextStyle } from '../services/textStyleStorage'

export interface LayerStoreState {
  layers: Record<string, TextLayer[]>
  selectedLayerId: string | null

  // Actions
  addTextLayer: (photoId: string, overrides?: Partial<TextLayer>) => TextLayer
  updateLayer: (photoId: string, layerId: string, updates: Partial<TextLayer>) => void
  deleteLayer: (photoId: string, layerId: string) => void
  selectLayer: (id: string | null) => void
  getLayers: (photoId: string) => TextLayer[]
  getSelectedLayer: (photoId: string) => TextLayer | undefined
  setLayersForPhoto: (photoId: string, layers: TextLayer[]) => void
  reorderLayers: (photoId: string, layerIds: string[]) => void
  moveLayerUp: (photoId: string, layerId: string) => void
  moveLayerDown: (photoId: string, layerId: string) => void
  toggleVisibility: (photoId: string, layerId: string) => void
  applyLayersToAllPhotos: (sourcePhotoId: string, allPhotoIds: string[]) => void
  clearLayers: (photoId?: string) => void
}

export const useLayerStore = create<LayerStoreState>((set, get) => ({
  layers: {},
  selectedLayerId: null,

  addTextLayer: (photoId: string, overrides = {}) => {
    const current = get().layers[photoId] ?? []
    const lastUsedStyle = getLastUsedTextStyle()
    const newLayer: TextLayer = {
      id: crypto.randomUUID ? crypto.randomUUID() : `layer-${Date.now()}-${Math.random()}`,
      text: 'Teks Baru',
      relativeX: 0.5,
      relativeY: 0.5,
      rotation: 0,
      zIndex: current.length,
      visible: true,
      style: {
        ...DEFAULT_TEXT_STYLE,
        ...lastUsedStyle,
        ...(overrides.style || {}),
      },
      ...overrides,
    }

    set((state) => ({
      layers: {
        ...state.layers,
        [photoId]: [...(state.layers[photoId] ?? []), newLayer],
      },
      selectedLayerId: newLayer.id,
    }))

    return newLayer
  },

  updateLayer: (photoId: string, layerId: string, updates: Partial<TextLayer>) => {
    if (updates.style) {
      saveLastUsedTextStyle(updates.style)
    }

    set((state) => {
      const photoLayers = state.layers[photoId]
      if (!photoLayers) return state

      const updated = photoLayers.map((layer) => {
        if (layer.id !== layerId) return layer
        return {
          ...layer,
          ...updates,
          style: updates.style ? { ...layer.style, ...updates.style } : layer.style,
        }
      })

      return {
        layers: {
          ...state.layers,
          [photoId]: updated,
        },
      }
    })
  },

  deleteLayer: (photoId: string, layerId: string) => {
    set((state) => {
      const photoLayers = state.layers[photoId]
      if (!photoLayers) return state

      const filtered = photoLayers.filter((l) => l.id !== layerId)
      return {
        layers: {
          ...state.layers,
          [photoId]: filtered,
        },
        selectedLayerId: state.selectedLayerId === layerId ? null : state.selectedLayerId,
      }
    })
  },

  selectLayer: (id: string | null) => {
    set({ selectedLayerId: id })
    if (id) {
      const allLayers = Object.values(get().layers).flat()
      const found = allLayers.find((l) => l.id === id)
      if (found?.style) {
        saveLastUsedTextStyle(found.style)
      }
    }
  },

  getLayers: (photoId: string) => {
    return get().layers[photoId] ?? []
  },

  getSelectedLayer: (photoId: string) => {
    const selectedId = get().selectedLayerId
    if (!selectedId) return undefined
    return (get().layers[photoId] ?? []).find((l) => l.id === selectedId)
  },

  setLayersForPhoto: (photoId: string, layers: TextLayer[]) => {
    set((state) => ({
      layers: {
        ...state.layers,
        [photoId]: layers,
      },
    }))
  },

  reorderLayers: (photoId: string, layerIds: string[]) => {
    set((state) => {
      const photoLayers = state.layers[photoId]
      if (!photoLayers) return state

      const map = new Map(photoLayers.map((l) => [l.id, l]))
      const reordered: TextLayer[] = []

      layerIds.forEach((id, index) => {
        const item = map.get(id)
        if (item) {
          reordered.push({ ...item, zIndex: index })
        }
      })

      return {
        layers: {
          ...state.layers,
          [photoId]: reordered,
        },
      }
    })
  },

  moveLayerUp: (photoId: string, layerId: string) => {
    set((state) => {
      const list = [...(state.layers[photoId] ?? [])]
      const idx = list.findIndex((l) => l.id === layerId)
      if (idx === -1 || idx >= list.length - 1) return state

      const temp = list[idx]
      list[idx] = list[idx + 1]
      list[idx + 1] = temp

      const updated = list.map((item, index) => ({ ...item, zIndex: index }))
      return {
        layers: {
          ...state.layers,
          [photoId]: updated,
        },
      }
    })
  },

  moveLayerDown: (photoId: string, layerId: string) => {
    set((state) => {
      const list = [...(state.layers[photoId] ?? [])]
      const idx = list.findIndex((l) => l.id === layerId)
      if (idx <= 0) return state

      const temp = list[idx]
      list[idx] = list[idx - 1]
      list[idx - 1] = temp

      const updated = list.map((item, index) => ({ ...item, zIndex: index }))
      return {
        layers: {
          ...state.layers,
          [photoId]: updated,
        },
      }
    })
  },

  toggleVisibility: (photoId: string, layerId: string) => {
    set((state) => {
      const list = state.layers[photoId]
      if (!list) return state

      const updated = list.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      )
      return {
        layers: {
          ...state.layers,
          [photoId]: updated,
        },
      }
    })
  },

  applyLayersToAllPhotos: (sourcePhotoId: string, allPhotoIds: string[]) => {
    const sourceLayers = get().layers[sourcePhotoId] ?? []
    set((state) => {
      const nextLayers = { ...state.layers }
      for (const targetId of allPhotoIds) {
        if (targetId === sourcePhotoId) continue
        nextLayers[targetId] = sourceLayers.map((layer, index) => ({
          ...layer,
          id:
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : `layer-${Date.now()}-${Math.random()}-${index}`,
          style: { ...layer.style },
        }))
      }
      return { layers: nextLayers }
    })
  },

  clearLayers: (photoId?: string) => {
    if (photoId) {
      set((state) => {
        const next = { ...state.layers }
        delete next[photoId]
        return {
          layers: next,
          selectedLayerId: null,
        }
      })
    } else {
      set({ layers: {}, selectedLayerId: null })
    }
  },
}))
