import type { SavedTemplate } from '../types/template'
import type { TextLayer } from '../types/layer'
import { DEFAULT_TEXT_STYLE } from '../constants/defaultStyles'

const STORAGE_KEY = 'photo_editor_app_templates_v1'

export const BUILT_IN_TEMPLATES: SavedTemplate[] = [
  {
    id: 'builtin-watermark-bottom-right',
    name: 'Watermark Kanan Bawah',
    description: 'Teks watermark halus di pojok kanan bawah dengan bayangan lembut.',
    createdAt: '2026-10-25T00:00:00.000Z',
    updatedAt: '2026-10-25T00:00:00.000Z',
    isBuiltIn: true,
    layers: [
      {
        id: 'tpl-wm-1',
        text: '© PHOTO TEXT EDITOR',
        relativeX: 0.92,
        relativeY: 0.94,
        rotation: 0,
        zIndex: 0,
        visible: true,
        style: {
          ...DEFAULT_TEXT_STYLE,
          fontFamily: 'Segoe UI',
          fontSize: 32,
          fontSizeUnit: '%',
          fontSizeRef: 'width',
          fontSizePercent: 2.5,
          fill: '#ffffff',
          opacity: 0.85,
          align: 'right',
          bold: true,
          shadow: {
            enabled: true,
            color: 'rgba(0, 0, 0, 0.65)',
            blur: 4,
            offsetX: 2,
            offsetY: 2,
            unit: 'px',
          },
        },
      },
    ],
  },
  {
    id: 'builtin-caption-polaroid',
    name: 'Caption Polaroid Bawah',
    description: 'Subtitle di bagian bawah foto dengan background kotak elegan.',
    createdAt: '2026-10-25T00:00:00.000Z',
    updatedAt: '2026-10-25T00:00:00.000Z',
    isBuiltIn: true,
    layers: [
      {
        id: 'tpl-caption-1',
        text: 'Koleksi Foto Kenangan • 2026',
        relativeX: 0.5,
        relativeY: 0.90,
        rotation: 0,
        zIndex: 0,
        visible: true,
        style: {
          ...DEFAULT_TEXT_STYLE,
          fontFamily: 'Calibri',
          fontSize: 36,
          fontSizeUnit: '%',
          fontSizeRef: 'width',
          fontSizePercent: 3.2,
          fill: '#f8fafc',
          opacity: 1,
          align: 'center',
          background: {
            enabled: true,
            color: '#0f172a',
            opacity: 0.8,
            padding: 12,
            borderRadius: 8,
            unit: 'px',
          },
        },
      },
    ],
  },
  {
    id: 'builtin-title-subtitle-center',
    name: 'Judul & Subjudul Tengah',
    description: 'Header teks ganda di bagian tengah untuk cover foto atau poster.',
    createdAt: '2026-10-25T00:00:00.000Z',
    updatedAt: '2026-10-25T00:00:00.000Z',
    isBuiltIn: true,
    layers: [
      {
        id: 'tpl-title-1',
        text: 'EXPLORE INDONESIA',
        relativeX: 0.5,
        relativeY: 0.44,
        rotation: 0,
        zIndex: 0,
        visible: true,
        style: {
          ...DEFAULT_TEXT_STYLE,
          fontFamily: 'Impact',
          fontSize: 68,
          fontSizeUnit: '%',
          fontSizeRef: 'width',
          fontSizePercent: 7.0,
          fill: '#ffffff',
          opacity: 1,
          align: 'center',
          stroke: {
            enabled: true,
            color: '#000000',
            width: 2,
            unit: 'px',
          },
          shadow: {
            enabled: true,
            color: 'rgba(0, 0, 0, 0.75)',
            blur: 12,
            offsetX: 0,
            offsetY: 6,
            unit: 'px',
          },
        },
      },
      {
        id: 'tpl-subtitle-2',
        text: 'Pesona Alam yang Tak Pernah Padam',
        relativeX: 0.5,
        relativeY: 0.54,
        rotation: 0,
        zIndex: 1,
        visible: true,
        style: {
          ...DEFAULT_TEXT_STYLE,
          fontFamily: 'Segoe UI',
          fontSize: 32,
          fontSizeUnit: '%',
          fontSizeRef: 'width',
          fontSizePercent: 3.0,
          fill: '#f1f5f9',
          opacity: 0.95,
          align: 'center',
          italic: true,
          shadow: {
            enabled: true,
            color: 'rgba(0, 0, 0, 0.6)',
            blur: 6,
            offsetX: 0,
            offsetY: 3,
            unit: 'px',
          },
        },
      },
    ],
  },
]

/**
 * Loads custom saved templates from storage.
 */
function loadUserTemplatesFromStorage(): SavedTemplate[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return []
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    console.error('Failed to load user templates from storage:', e)
    return []
  }
}

/**
 * Persists user templates to local storage.
 */
function saveUserTemplatesToStorage(templates: SavedTemplate[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  } catch (e) {
    console.error('Failed to save templates to storage:', e)
  }
}

/**
 * Retrieves all available templates: built-in presets followed by user-saved templates.
 */
export async function getAppTemplates(): Promise<SavedTemplate[]> {
  const userTemplates = loadUserTemplatesFromStorage()
  return [...BUILT_IN_TEMPLATES, ...userTemplates]
}

/**
 * Saves a new template to local app storage.
 */
export async function saveAppTemplate(
  name: string,
  layers: TextLayer[],
  description?: string
): Promise<SavedTemplate> {
  const cleanName = name.trim() || 'Template Baru'
  const now = new Date().toISOString()

  const newTemplate: SavedTemplate = {
    id: `user-tpl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: cleanName,
    description: description?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
    isBuiltIn: false,
    layers: layers.map((layer, index) => ({
      ...layer,
      id: `tpl-layer-${index + 1}`,
    })),
  }

  const existing = loadUserTemplatesFromStorage()
  const updated = [newTemplate, ...existing]
  saveUserTemplatesToStorage(updated)

  return newTemplate
}

/**
 * Deletes a user template by ID. Built-in templates cannot be deleted.
 */
export async function deleteAppTemplate(id: string): Promise<boolean> {
  const isBuiltIn = BUILT_IN_TEMPLATES.some((t) => t.id === id)
  if (isBuiltIn) {
    return false
  }

  const existing = loadUserTemplatesFromStorage()
  const filtered = existing.filter((t) => t.id !== id)
  if (filtered.length === existing.length) {
    return false
  }

  saveUserTemplatesToStorage(filtered)
  return true
}

/**
 * Clears all user templates (for testing or reset).
 */
export async function clearUserTemplates(): Promise<void> {
  if (typeof window === 'undefined' || !window.localStorage) return
  window.localStorage.removeItem(STORAGE_KEY)
}

