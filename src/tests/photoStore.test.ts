import { describe, it, expect, beforeEach } from 'vitest'
import { usePhotoStore } from '../stores/usePhotoStore'
import type { PhotoItem } from '../types/photo'

describe('usePhotoStore', () => {
  const dummyPhoto1: PhotoItem = {
    id: 'p1',
    name: 'photo1.jpg',
    url: 'blob://mock-url-1',
    originalWidth: 1920,
    originalHeight: 1080,
    size: 204800,
  }

  const dummyPhoto2: PhotoItem = {
    id: 'p2',
    name: 'photo2.png',
    url: 'blob://mock-url-2',
    originalWidth: 1080,
    originalHeight: 1080,
    size: 102400,
  }

  beforeEach(() => {
    usePhotoStore.getState().clearPhotos()
  })

  it('starts with empty photos and null activePhotoId', () => {
    const state = usePhotoStore.getState()
    expect(state.photos).toEqual([])
    expect(state.activePhotoId).toBeNull()
    expect(state.getActivePhoto()).toBeUndefined()
  })

  it('adds photo and sets it as active', () => {
    usePhotoStore.getState().addPhoto(dummyPhoto1)
    const state = usePhotoStore.getState()

    expect(state.photos.length).toBe(1)
    expect(state.activePhotoId).toBe('p1')
    expect(state.getActivePhoto()?.name).toBe('photo1.jpg')
  })

  it('adds multiple photos with addPhotos', () => {
    usePhotoStore.getState().addPhotos([dummyPhoto1, dummyPhoto2])
    const state = usePhotoStore.getState()

    expect(state.photos.length).toBe(2)
    expect(state.activePhotoId).toBe('p1')
  })

  it('switches active photo with setActivePhoto', () => {
    usePhotoStore.getState().addPhotos([dummyPhoto1, dummyPhoto2])
    usePhotoStore.getState().setActivePhoto('p2')

    const state = usePhotoStore.getState()
    expect(state.activePhotoId).toBe('p2')
    expect(state.getActivePhoto()?.id).toBe('p2')
  })

  it('removes active photo and selects next remaining photo', () => {
    usePhotoStore.getState().addPhotos([dummyPhoto1, dummyPhoto2])
    usePhotoStore.getState().setActivePhoto('p1')

    usePhotoStore.getState().removePhoto('p1')
    const state = usePhotoStore.getState()

    expect(state.photos.length).toBe(1)
    expect(state.activePhotoId).toBe('p2')
  })

  it('clears activePhotoId when last photo is removed', () => {
    usePhotoStore.getState().addPhoto(dummyPhoto1)
    usePhotoStore.getState().removePhoto('p1')
    const state = usePhotoStore.getState()

    expect(state.photos.length).toBe(0)
    expect(state.activePhotoId).toBeNull()
  })

  it('clears all photos', () => {
    usePhotoStore.getState().addPhotos([dummyPhoto1, dummyPhoto2])
    usePhotoStore.getState().clearPhotos()
    const state = usePhotoStore.getState()

    expect(state.photos).toEqual([])
    expect(state.activePhotoId).toBeNull()
  })
})

