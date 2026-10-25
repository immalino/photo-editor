import { describe, it, expect, beforeEach } from 'vitest'
import {
  getAppTemplates,
  saveAppTemplate,
  deleteAppTemplate,
  clearUserTemplates,
  BUILT_IN_TEMPLATES,
} from '../services/appTemplateStorage'
import type { TextLayer } from '../types/layer'
import { DEFAULT_TEXT_STYLE } from '../constants/defaultStyles'

describe('appTemplateStorage service', () => {
  beforeEach(async () => {
    await clearUserTemplates()
  })

  it('retrieves built-in templates by default', async () => {
    const templates = await getAppTemplates()
    expect(templates.length).toBeGreaterThanOrEqual(BUILT_IN_TEMPLATES.length)
    expect(templates[0].id).toBe(BUILT_IN_TEMPLATES[0].id)
  })

  it('saves and retrieves user templates in app storage', async () => {
    const dummyLayer: TextLayer = {
      id: 'layer-1',
      text: 'My Custom Watermark',
      relativeX: 0.8,
      relativeY: 0.8,
      rotation: 0,
      zIndex: 0,
      visible: true,
      style: { ...DEFAULT_TEXT_STYLE },
    }

    const saved = await saveAppTemplate(
      'Custom Watermark v1',
      [dummyLayer],
      'Test description'
    )
    expect(saved.id).toBeDefined()
    expect(saved.name).toBe('Custom Watermark v1')
    expect(saved.isBuiltIn).toBe(false)
    expect(saved.layers.length).toBe(1)

    const all = await getAppTemplates()
    const found = all.find((t) => t.id === saved.id)
    expect(found).toBeDefined()
    expect(found?.name).toBe('Custom Watermark v1')
  })

  it('cannot delete built-in templates', async () => {
    const success = await deleteAppTemplate(BUILT_IN_TEMPLATES[0].id)
    expect(success).toBe(false)
  })

  it('deletes user templates successfully', async () => {
    const dummyLayer: TextLayer = {
      id: 'layer-1',
      text: 'Delete Me',
      relativeX: 0.5,
      relativeY: 0.5,
      rotation: 0,
      zIndex: 0,
      visible: true,
      style: { ...DEFAULT_TEXT_STYLE },
    }

    const saved = await saveAppTemplate('To Delete', [dummyLayer])
    const delSuccess = await deleteAppTemplate(saved.id)
    expect(delSuccess).toBe(true)

    const all = await getAppTemplates()
    expect(all.some((t) => t.id === saved.id)).toBe(false)
  })
})

