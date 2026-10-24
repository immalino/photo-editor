import { create } from 'zustand'
import type { TextLayer } from '../types/layer'

export const MAX_HISTORY_STEPS = 50

export interface HistoryStoreState {
  past: TextLayer[][]
  future: TextLayer[][]

  pushState: (layers: TextLayer[]) => void
  undo: (currentLayers: TextLayer[]) => TextLayer[] | null
  redo: (currentLayers: TextLayer[]) => TextLayer[] | null
  canUndo: () => boolean
  canRedo: () => boolean
  clearHistory: () => void
}

function cloneLayers(layers: TextLayer[]): TextLayer[] {
  return layers.map((layer) => ({
    ...layer,
    style: { ...layer.style },
  }))
}

export const useHistoryStore = create<HistoryStoreState>((set, get) => ({
  past: [],
  future: [],

  pushState: (layers: TextLayer[]) => {
    const cloned = cloneLayers(layers)
    set((state) => {
      const newPast = [...state.past, cloned]
      if (newPast.length > MAX_HISTORY_STEPS) {
        newPast.shift()
      }
      return {
        past: newPast,
        future: [],
      }
    })
  },

  undo: (currentLayers: TextLayer[]) => {
    const { past } = get()
    if (past.length === 0) return null

    const previous = past[past.length - 1]
    const newPast = past.slice(0, -1)
    const clonedCurrent = cloneLayers(currentLayers)

    set((state) => ({
      past: newPast,
      future: [clonedCurrent, ...state.future],
    }))

    return cloneLayers(previous)
  },

  redo: (currentLayers: TextLayer[]) => {
    const { future } = get()
    if (future.length === 0) return null

    const next = future[0]
    const newFuture = future.slice(1)
    const clonedCurrent = cloneLayers(currentLayers)

    set((state) => {
      const newPast = [...state.past, clonedCurrent]
      if (newPast.length > MAX_HISTORY_STEPS) {
        newPast.shift()
      }
      return {
        past: newPast,
        future: newFuture,
      }
    })

    return cloneLayers(next)
  },

  canUndo: () => {
    return get().past.length > 0
  },

  canRedo: () => {
    return get().future.length > 0
  },

  clearHistory: () => {
    set({ past: [], future: [] })
  },
}))
