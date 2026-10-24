import { useEffect } from 'react'

export interface KeyboardShortcutsOptions {
  onUndo?: () => void
  onRedo?: () => void
  onDelete?: () => void
  enabled?: boolean
}

/**
 * Global keyboard shortcuts hook for Undo, Redo, and Delete actions.
 */
export function useKeyboardShortcuts({
  onUndo,
  onRedo,
  onDelete,
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
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onUndo, onRedo, onDelete, enabled])
}
