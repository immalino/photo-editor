import type { TextStyle } from '../types/layer'
import { DEFAULT_TEXT_STYLE } from '../constants/defaultStyles'

export const LAST_USED_STYLE_STORAGE_KEY = 'photo_editor_last_used_text_style_v1'

/**
 * Retrieves the last-used text style from persistent localStorage.
 * Falls back safely to DEFAULT_TEXT_STYLE if none is stored or on error.
 */
export function getLastUsedTextStyle(): TextStyle {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...DEFAULT_TEXT_STYLE }
  }

  try {
    const raw = window.localStorage.getItem(LAST_USED_STYLE_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_TEXT_STYLE }

    const parsed = JSON.parse(raw) as Partial<TextStyle>
    return {
      ...DEFAULT_TEXT_STYLE,
      ...parsed,
      stroke: {
        ...DEFAULT_TEXT_STYLE.stroke,
        ...(parsed.stroke || {}),
      },
      shadow: {
        ...DEFAULT_TEXT_STYLE.shadow,
        ...(parsed.shadow || {}),
      },
      background: {
        ...DEFAULT_TEXT_STYLE.background,
        ...(parsed.background || {}),
      },
    }
  } catch (err) {
    console.warn('Failed to parse last used text style from storage:', err)
    return { ...DEFAULT_TEXT_STYLE }
  }
}

/**
 * Persists the given text style to localStorage as the last-used style.
 */
export function saveLastUsedTextStyle(style: Partial<TextStyle>): void {
  if (typeof window === 'undefined' || !window.localStorage) return

  try {
    const current = getLastUsedTextStyle()
    const merged: TextStyle = {
      ...current,
      ...style,
      stroke: style.stroke ? { ...current.stroke, ...style.stroke } : current.stroke,
      shadow: style.shadow ? { ...current.shadow, ...style.shadow } : current.shadow,
      background: style.background ? { ...current.background, ...style.background } : current.background,
    }
    window.localStorage.setItem(LAST_USED_STYLE_STORAGE_KEY, JSON.stringify(merged))
  } catch (err) {
    console.warn('Failed to save last used text style to storage:', err)
  }
}

/**
 * Clears the stored last-used text style (useful for resetting or testing).
 */
export function resetLastUsedTextStyle(): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.removeItem(LAST_USED_STYLE_STORAGE_KEY)
  } catch {
    // Ignore error
  }
}

