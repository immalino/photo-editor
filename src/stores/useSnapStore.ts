import { create } from 'zustand'
import type { SnapGuide } from '../utils/snapEngine'

export interface SnapStoreState {
  snapEnabled: boolean
  snapToCenter: boolean
  snapToEdges: boolean
  snapTolerance: number
  activeGuides: SnapGuide[]

  // Actions
  setSnapEnabled: (val: boolean) => void
  toggleSnap: () => void
  setActiveGuides: (guides: SnapGuide[]) => void
  clearActiveGuides: () => void
}

export const useSnapStore = create<SnapStoreState>((set) => ({
  snapEnabled: true,
  snapToCenter: true,
  snapToEdges: true,
  snapTolerance: 8,
  activeGuides: [],

  setSnapEnabled: (val) => set({ snapEnabled: val }),
  toggleSnap: () => set((state) => ({ snapEnabled: !state.snapEnabled, activeGuides: [] })),
  setActiveGuides: (guides) => set({ activeGuides: guides }),
  clearActiveGuides: () => set({ activeGuides: [] }),
}))

