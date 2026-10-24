import { describe, it, expect, vi } from 'vitest'
import {
  exportTemplateAsJson,
  importTemplateFromJson,
  saveTemplateAsFile,
} from '../services/templateService'
import type { TextLayer } from '../types/layer'
import { DEFAULT_TEXT_STYLE } from '../constants/defaultStyles'
import * as platformAdapter from '../services/platformAdapter'

function createTestLayer(id: string, text: string): TextLayer {
  return {
    id,
    text,
    relativeX: 0.25,
    relativeY: 0.75,
    rotation: 15,
    zIndex: 1,
    visible: true,
    style: {
      ...DEFAULT_TEXT_STYLE,
      fontFamily: 'Impact',
      fontSize: 48,
      fill: '#ff0000',
      stroke: { enabled: true, color: '#000000', width: 4 },
    },
  }
}

describe('templateService', () => {
  describe('exportTemplateAsJson()', () => {
    it('creates a valid formatted JSON template with metadata', () => {
      const layer = createTestLayer('layer-1', 'Watermark Title')
      const json = exportTemplateAsJson([layer], 'Watermark Premium')
      const parsed = JSON.parse(json)

      expect(parsed.version).toBe('1.0')
      expect(parsed.name).toBe('Watermark Premium')
      expect(typeof parsed.createdAt).toBe('string')
      expect(parsed.layers).toHaveLength(1)
      expect(parsed.layers[0].text).toBe('Watermark Title')
      expect(parsed.layers[0].style.fontFamily).toBe('Impact')
      expect(parsed.layers[0].style.stroke.enabled).toBe(true)
    })

    it('falls back to default template name if name is empty', () => {
      const layer = createTestLayer('l1', 'Sample')
      const json = exportTemplateAsJson([layer], '   ')
      const parsed = JSON.parse(json)
      expect(parsed.name).toBe('Template Teks')
    })
  })

  describe('importTemplateFromJson()', () => {
    it('imports template object and assigns new unique IDs', () => {
      const original = createTestLayer('old-id-123', 'Imported Text')
      const json = exportTemplateAsJson([original], 'My Preset')

      const imported = importTemplateFromJson(json)
      expect(imported).toHaveLength(1)
      expect(imported[0].text).toBe('Imported Text')
      expect(imported[0].id).not.toBe('old-id-123')
      expect(imported[0].style.fontFamily).toBe('Impact')
      expect(imported[0].relativeX).toBe(0.25)
      expect(imported[0].relativeY).toBe(0.75)
    })

    it('supports direct array format without wrapper object', () => {
      const layersArray = [createTestLayer('1', 'Direct Array')]
      const json = JSON.stringify(layersArray)

      const imported = importTemplateFromJson(json)
      expect(imported).toHaveLength(1)
      expect(imported[0].text).toBe('Direct Array')
    })

    it('clamps out-of-range relative coordinates to 0..1', () => {
      const malformed = [
        {
          text: 'Clamped',
          relativeX: 2.5,
          relativeY: -0.5,
        },
      ]
      const json = JSON.stringify(malformed)
      const imported = importTemplateFromJson(json)
      expect(imported[0].relativeX).toBe(1)
      expect(imported[0].relativeY).toBe(0)
    })

    it('throws error on empty or whitespace string', () => {
      expect(() => importTemplateFromJson('')).toThrow(
        'Konten file template kosong atau tidak valid.'
      )
    })

    it('throws error on invalid JSON syntax', () => {
      expect(() => importTemplateFromJson('{ invalid json: true')).toThrow(
        'Gagal membaca file: format bukan JSON yang valid.'
      )
    })

    it('throws error on unrecognized structure without layers', () => {
      expect(() => importTemplateFromJson('{"title": "No layers"}')).toThrow(
        'Struktur template tidak dikenali: data layer tidak ditemukan.'
      )
    })

    it('throws error when layers array is empty', () => {
      expect(() => importTemplateFromJson('{"layers": []}')).toThrow(
        'Template tidak memuat layer teks apapun.'
      )
    })
  })

  describe('saveTemplateAsFile()', () => {
    it('sanitizes filename and calls saveFileBlob', async () => {
      const saveSpy = vi
        .spyOn(platformAdapter, 'saveFileBlob')
        .mockResolvedValue(true)

      const layer = createTestLayer('l1', 'Saved Test')
      const success = await saveTemplateAsFile([layer], 'My Cool Template 2026!')

      expect(success).toBe(true)
      expect(saveSpy).toHaveBeenCalledTimes(1)
      const callArgs = saveSpy.mock.calls[0]
      expect(callArgs[1]).toBe('my_cool_template_2026.json')

      saveSpy.mockRestore()
    })
  })
})
