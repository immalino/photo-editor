export const PRESET_COLORS: string[] = [
  '#ffffff',
  '#000000',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
]

/**
 * Validates whether a string is a valid 3, 6, or 8-digit hexadecimal color code.
 */
export function isValidHex(hex: string): boolean {
  return /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(hex.trim())
}

/**
 * Normalizes a hex string by ensuring a leading '#' and 6-digit uppercase format.
 * Returns fallback if invalid.
 */
export function normalizeHex(hex: string, fallback = '#ffffff'): string {
  const trimmed = hex.trim()
  if (!trimmed) return fallback
  const formatted = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
  if (!isValidHex(formatted)) return fallback

  // Expand shorthand #RGB to #RRGGBB
  if (formatted.length === 4) {
    const r = formatted[1]
    const g = formatted[2]
    const b = formatted[3]
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
  }

  return formatted.slice(0, 7).toUpperCase()
}

/**
 * Converts a hex color and opacity (0-1) to an rgba() string.
 */
export function hexToRgba(hex: string, alpha = 1): string {
  const normalized = normalizeHex(hex)
  const r = parseInt(normalized.slice(1, 3), 16)
  const g = parseInt(normalized.slice(3, 5), 16)
  const b = parseInt(normalized.slice(5, 7), 16)
  const clampedAlpha = Math.max(0, Math.min(1, alpha))
  return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`
}
