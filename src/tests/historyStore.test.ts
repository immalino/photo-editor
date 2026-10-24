import { describe, it, expect, beforeEach } from 'vitest'
import { useHistoryStore, MAX_HISTORY_STEPS } from '../stores/useHistoryStore'
import type { TextLayer } from '../types/layer'
import { DEFAULT_TEXT_STYLE } from '../constants/defaultStyles'

function createSampleLayer(id: string, text: string): TextLayer {
  return {
    id,
    text,
    relativeX: 0.5,
    relativeY: 0.5,
    rotation: 0,
    zIndex: 0,
    visible: true,
    style: { ...DEFAULT_TEXT_STYLE },
  }
}

describe('useHistoryStore', () => {
  beforeEach(() => {
    useHistoryStore.getState().clearHistory()
  })

  it('starts with empty history and cannot undo or redo', () => {
    const store = useHistoryStore.getState()
    expect(store.past).toHaveLength(0)
    expect(store.future).toHaveLength(0)
    expect(store.canUndo()).toBe(false)
    expect(store.canRedo()).toBe(false)
  })

  it('pushes state and enables undo while clearing future', () => {
    const layer1 = createSampleLayer('1', 'Pertama')
    useHistoryStore.getState().pushState([layer1])

    const store = useHistoryStore.getState()
    expect(store.past).toHaveLength(1)
    expect(store.past[0][0].text).toBe('Pertama')
    expect(store.canUndo()).toBe(true)
    expect(store.canRedo()).toBe(false)
  })

  it('performs undo and returns previous state while populating future', () => {
    const state0: TextLayer[] = []
    const state1: TextLayer[] = [createSampleLayer('1', 'Pertama')]
    const state2: TextLayer[] = [createSampleLayer('1', 'Pertama'), createSampleLayer('2', 'Kedua')]

    // Record initial state then state1 before moving to state2
    useHistoryStore.getState().pushState(state0)
    useHistoryStore.getState().pushState(state1)

    // Current state is state2. Undo should return state1
    const undone = useHistoryStore.getState().undo(state2)
    expect(undone).toHaveLength(1)
    expect(undone![0].text).toBe('Pertama')

    expect(useHistoryStore.getState().canUndo()).toBe(true)
    expect(useHistoryStore.getState().canRedo()).toBe(true)

    // Undo again to state0
    const undone2 = useHistoryStore.getState().undo(undone!)
    expect(undone2).toEqual([])
    expect(useHistoryStore.getState().canUndo()).toBe(false)
    expect(useHistoryStore.getState().canRedo()).toBe(true)
  })

  it('performs redo correctly after undo', () => {
    const state1: TextLayer[] = [createSampleLayer('1', 'Pertama')]
    const state2: TextLayer[] = [createSampleLayer('1', 'Pertama'), createSampleLayer('2', 'Kedua')]

    useHistoryStore.getState().pushState(state1)

    // Undo from state2
    const undone = useHistoryStore.getState().undo(state2)
    expect(undone![0].text).toBe('Pertama')

    // Redo back to state2
    const redone = useHistoryStore.getState().redo(undone!)
    expect(redone).toHaveLength(2)
    expect(redone![1].text).toBe('Kedua')
    expect(useHistoryStore.getState().canRedo()).toBe(false)
  })

  it('returns null when undoing with empty past or redoing with empty future', () => {
    const resultUndo = useHistoryStore.getState().undo([])
    expect(resultUndo).toBeNull()

    const resultRedo = useHistoryStore.getState().redo([])
    expect(resultRedo).toBeNull()
  })

  it(`caps past history at exactly ${MAX_HISTORY_STEPS} steps and drops oldest`, () => {
    for (let i = 0; i < 60; i++) {
      useHistoryStore.getState().pushState([createSampleLayer(`${i}`, `Layer ${i}`)])
    }

    const { past } = useHistoryStore.getState()
    expect(past).toHaveLength(MAX_HISTORY_STEPS)
    // First element in past should be step 10 (since 0..9 were dropped)
    expect(past[0][0].text).toBe('Layer 10')
    expect(past[MAX_HISTORY_STEPS - 1][0].text).toBe('Layer 59')
  })

  it('clears history resets past and future', () => {
    useHistoryStore.getState().pushState([createSampleLayer('1', 'Test 1')])
    useHistoryStore.getState().pushState([createSampleLayer('2', 'Test 2')])
    useHistoryStore.getState().undo([createSampleLayer('3', 'Current')])

    expect(useHistoryStore.getState().past.length).toBeGreaterThan(0)
    expect(useHistoryStore.getState().future.length).toBeGreaterThan(0)

    useHistoryStore.getState().clearHistory()
    expect(useHistoryStore.getState().past).toHaveLength(0)
    expect(useHistoryStore.getState().future).toHaveLength(0)
    expect(useHistoryStore.getState().canUndo()).toBe(false)
    expect(useHistoryStore.getState().canRedo()).toBe(false)
  })
})
