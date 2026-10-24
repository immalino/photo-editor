import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'

describe('useKeyboardShortcuts', () => {
  it('triggers onUndo when Ctrl+Z is pressed', () => {
    const onUndo = vi.fn()
    renderHook(() => useKeyboardShortcuts({ onUndo }))

    const event = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    })
    window.dispatchEvent(event)

    expect(onUndo).toHaveBeenCalledTimes(1)
  })

  it('triggers onRedo when Ctrl+Y is pressed', () => {
    const onRedo = vi.fn()
    renderHook(() => useKeyboardShortcuts({ onRedo }))

    const event = new KeyboardEvent('keydown', {
      key: 'y',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    })
    window.dispatchEvent(event)

    expect(onRedo).toHaveBeenCalledTimes(1)
  })

  it('triggers onRedo when Ctrl+Shift+Z is pressed', () => {
    const onRedo = vi.fn()
    renderHook(() => useKeyboardShortcuts({ onRedo }))

    const event = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })
    window.dispatchEvent(event)

    expect(onRedo).toHaveBeenCalledTimes(1)
  })

  it('triggers onDelete when Delete key is pressed', () => {
    const onDelete = vi.fn()
    renderHook(() => useKeyboardShortcuts({ onDelete }))

    const event = new KeyboardEvent('keydown', {
      key: 'Delete',
      bubbles: true,
      cancelable: true,
    })
    window.dispatchEvent(event)

    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it('does not trigger shortcuts when target is an input element', () => {
    const onUndo = vi.fn()
    renderHook(() => useKeyboardShortcuts({ onUndo }))

    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    const event = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    })
    window.dispatchEvent(event)

    expect(onUndo).not.toHaveBeenCalled()
    document.body.removeChild(input)
  })
})
