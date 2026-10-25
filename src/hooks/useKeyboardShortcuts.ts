import { useEffect } from 'react'

export interface KeyboardShortcutsOptions {
  onUndo?: () => void
  onRedo?: () => void
  onDelete?: () => void
  onNudge?: (dx: number, dy: number) => void
  enabled?: boolean
}

/**
 * Global keyboard shortcuts hook for Undo, Redo, Delete, and Arrow Nudge actions.
 */
export function useKeyboardShortcuts({
  onUndo,
  onRedo,
  onDelete,
  onNudge,
  enabled = true,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement | null
      const isInput =
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.isContentEditable

      // Do not trigger shortcuts while user is typing in form controls
      if (isInput) {
        return
      }

      const isModifier = event.ctrlKey || event.metaKey
      const key = event.key.toLowerCase()

      // Redo: Ctrl + Y or Ctrl + Shift + Z
      if (
        isModifier &&
        (key === 'y' || (event.shiftKey && key === 'z'))
      ) {
        if (onRedo) {
          event.preventDefault()
          onRedo()
        }
        return
      }

      // Undo: Ctrl + Z (without Shift)
      if (isModifier && !event.shiftKey && key === 'z') {
        if (onUndo) {
          event.preventDefault()
          onUndo()
        }
        return
      }

      // Delete: Delete or Backspace key
      if (!isModifier && !event.altKey && (event.key === 'Delete' || event.key === 'Backspace')) {
        if (onDelete) {
          event.preventDefault()
          onDelete()
        }
        return
      }

      // Arrow Nudging: Arrow keys (1px or 10px with Shift)
      if (
        onNudge &&
        !isModifier &&
        !event.altKey &&
        (event.key === 'ArrowUp' ||
          event.key === 'ArrowDown' ||
          event.key === 'ArrowLeft' ||
          event.key === 'ArrowRight')
      ) {
        event.preventDefault()
        const step = event.shiftKey ? 10 : 1
        switch (event.key) {
          case 'ArrowUp':
            onNudge(0, -step)
            break
          case 'ArrowDown':
            onNudge(0, step)
            break
          case 'ArrowLeft':
            onNudge(-step, 0)
            break
          case 'ArrowRight':
            onNudge(step, 0)
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onUndo, onRedo, onDelete, onNudge, enabled])
}
