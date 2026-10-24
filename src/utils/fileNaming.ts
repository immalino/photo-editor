import { parseFileName } from '../services/platformAdapter'

/**
 * Generates an export file name by replacing the {name} placeholder
 * with the original base name and appending the specified extension.
 *
 * Example:
 * generateExportFileName('photo.jpg', '{name}_edited', 'png') => 'photo_edited.png'
 */
export function generateExportFileName(
  originalName: string,
  pattern: string = '{name}_edited',
  ext: string = 'png'
): string {
  const safeName = (originalName || '').trim()
  const { baseName } = parseFileName(safeName)
  const cleanExt = (ext || 'png').replace(/^\./, '').toLowerCase().trim() || 'png'
  const nameToUse = baseName || 'photo'
  const safePattern = (pattern || '').trim() || '{name}_edited'

  const rendered = safePattern.includes('{name}')
    ? safePattern.replace(/{name}/g, nameToUse)
    : safePattern

  return `${rendered}.${cleanExt}`
}

