import type { TextLayer } from '../types/layer'
import { DEFAULT_TEXT_STYLE } from '../constants/defaultStyles'
import { saveFileBlob } from './platformAdapter'

export interface TextTemplateData {
  version: '1.0'
  name: string
  createdAt: string
  layers: TextLayer[]
}

/**
 * Serializes layers and metadata into JSON string format.
 */
export function exportTemplateAsJson(
  layers: TextLayer[],
  templateName: string = 'Template Teks'
): string {
  const data: TextTemplateData = {
    version: '1.0',
    name: templateName.trim() || 'Template Teks',
    createdAt: new Date().toISOString(),
    layers: layers.map((layer, index) => ({
      id: layer.id,
      text: layer.text,
      relativeX: Number(layer.relativeX.toFixed(4)),
      relativeY: Number(layer.relativeY.toFixed(4)),
      rotation: layer.rotation || 0,
      zIndex: typeof layer.zIndex === 'number' ? layer.zIndex : index,
      visible: layer.visible !== false,
      style: {
        ...DEFAULT_TEXT_STYLE,
        ...layer.style,
      },
    })),
  }

  return JSON.stringify(data, null, 2)
}

/**
 * Saves template JSON file using platform adapter.
 */
export async function saveTemplateAsFile(
  layers: TextLayer[],
  templateName: string = 'template_teks'
): Promise<boolean> {
  const jsonContent = exportTemplateAsJson(layers, templateName)
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' })
  const sanitizedName = templateName
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'template_teks'
  
  return saveFileBlob(blob, `${sanitizedName}.json`)
}

/**
 * Validates and converts JSON string content into TextLayer array with fresh IDs.
 */
export function importTemplateFromJson(fileContent: string): TextLayer[] {
  if (!fileContent || typeof fileContent !== 'string') {
    throw new Error('Konten file template kosong atau tidak valid.')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(fileContent)
  } catch {
    throw new Error('Gagal membaca file: format bukan JSON yang valid.')
  }

  let rawLayers: unknown[] = []

  if (Array.isArray(parsed)) {
    rawLayers = parsed
  } else if (
    parsed &&
    typeof parsed === 'object' &&
    'layers' in parsed &&
    Array.isArray((parsed as { layers: unknown }).layers)
  ) {
    rawLayers = (parsed as { layers: unknown[] }).layers
  } else {
    throw new Error('Struktur template tidak dikenali: data layer tidak ditemukan.')
  }

  if (rawLayers.length === 0) {
    throw new Error('Template tidak memuat layer teks apapun.')
  }

  const validatedLayers: TextLayer[] = []

  rawLayers.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      return
    }

    const obj = item as Record<string, unknown>
    const text = typeof obj.text === 'string' ? obj.text : 'Teks Template'
    const relativeX =
      typeof obj.relativeX === 'number' && !isNaN(obj.relativeX)
        ? Math.max(0, Math.min(1, obj.relativeX))
        : 0.5
    const relativeY =
      typeof obj.relativeY === 'number' && !isNaN(obj.relativeY)
        ? Math.max(0, Math.min(1, obj.relativeY))
        : 0.5
    const rotation =
      typeof obj.rotation === 'number' && !isNaN(obj.rotation)
        ? obj.rotation
        : 0
    const zIndex =
      typeof obj.zIndex === 'number' && !isNaN(obj.zIndex)
        ? obj.zIndex
        : index
    const visible = obj.visible !== false

    const rawStyle =
      obj.style && typeof obj.style === 'object'
        ? (obj.style as Record<string, unknown>)
        : {}

    const newId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `imported-${Date.now()}-${Math.random()}-${index}`

    validatedLayers.push({
      id: newId,
      text,
      relativeX,
      relativeY,
      rotation,
      zIndex,
      visible,
      style: {
        ...DEFAULT_TEXT_STYLE,
        ...rawStyle,
      },
    })
  })

  if (validatedLayers.length === 0) {
    throw new Error('Tidak ada layer teks yang valid dalam template.')
  }

  return validatedLayers
}
