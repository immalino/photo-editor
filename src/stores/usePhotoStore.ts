import { create } from 'zustand'
import type { PhotoItem } from '../types/photo'

export interface PhotoStoreState {
  photos: PhotoItem[]
  activePhotoId: string | null
  addPhoto: (photo: PhotoItem) => void
  addPhotos: (photos: PhotoItem[]) => void
  setActivePhoto: (id: string | null) => void
  removePhoto: (id: string) => void
  clearPhotos: () => void
  getActivePhoto: () => PhotoItem | undefined
}

export const usePhotoStore = create<PhotoStoreState>((set, get) => ({
  photos: [],
  activePhotoId: null,

  addPhoto: (photo: PhotoItem) => {
    set((state) => {
      // Avoid duplicate by id or duplicate object url
      const exists = state.photos.some((p) => p.id === photo.id)
      if (exists) {
        return { activePhotoId: photo.id }
      }
      return {
        photos: [...state.photos, photo],
        activePhotoId: photo.id,
      }
    })
  },

  addPhotos: (newPhotos: PhotoItem[]) => {
    if (newPhotos.length === 0) return

    set((state) => {
      const existingIds = new Set(state.photos.map((p) => p.id))
      const uniqueNew = newPhotos.filter((p) => !existingIds.has(p.id))
      const combined = [...state.photos, ...uniqueNew]
      return {
        photos: combined,
        activePhotoId: state.activePhotoId || (combined[0] ? combined[0].id : null),
      }
    })
  },

  setActivePhoto: (id: string | null) => {
    set({ activePhotoId: id })
  },

  removePhoto: (id: string) => {
    set((state) => {
      const remaining = state.photos.filter((p) => p.id !== id)
      let nextActiveId = state.activePhotoId

      if (state.activePhotoId === id) {
        nextActiveId = remaining.length > 0 ? remaining[0].id : null
      }

      return {
        photos: remaining,
        activePhotoId: nextActiveId,
      }
    })
  },

  clearPhotos: () => {
    set({
      photos: [],
      activePhotoId: null,
    })
  },

  getActivePhoto: () => {
    const { photos, activePhotoId } = get()
    if (!activePhotoId) return undefined
    return photos.find((p) => p.id === activePhotoId)
  },
}))

