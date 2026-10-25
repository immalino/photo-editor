import { describe, it, expect, vi } from 'vitest'
import {
  detectFontFormat,
  sanitizeFontName,
  toFontOption,
  saveCustomFonts,
} from '../services/customFontService'
import type { CustomFontRecord } from '../types/font'

describe('customFontService', () => {
  it('detects font formats correctly from filename', () => {
    expect(detectFontFormat('my-font.ttf')).toBe('truetype')
    expect(detectFontFormat('ROBOTO.OTF')).toBe('opentype')
    expect(detectFontFormat('webfont.woff')).toBe('woff')
    expect(detectFontFormat('webfont2.woff2')).toBe('woff2')
    expect(detectFontFormat('image.png')).toBeNull()
    expect(detectFontFormat('document.pdf')).toBeNull()
  })

  it('sanitizes font names cleanly', () => {
    expect(sanitizeFontName('Poppins Bold!')).toBe('Poppins Bold')
    expect(sanitizeFontName('My-Custom_Font 123')).toBe('My-Custom_Font 123')
    expect(sanitizeFontName('$$$')).toBe('CustomFont')
  })

  it('converts CustomFontRecord to FontOption', () => {
    const record: CustomFontRecord = {
      id: 'font-1',
      name: 'OpenSans',
      fileName: 'OpenSans.ttf',
      format: 'truetype',
      dataUrl: 'data:font/ttf;base64,AAAA',
      createdAt: '2026-10-25T00:00:00Z',
    }

    const option = toFontOption(record)
    expect(option.name).toBe('OpenSans')
    expect(option.value).toBe('OpenSans')
    expect(option.isCustom).toBe(true)
    expect(option.format).toBe('truetype')
  })

  it('saveCustomFonts filters unsupported formats and calls progress callback', async () => {
    const validFile = new File(['dummy-font-bytes'], 'CustomRoboto.ttf', { type: 'font/ttf' })
    const invalidFile = new File(['dummy-text'], 'readme.txt', { type: 'text/plain' })

    const progressCalls: Array<{ current: number; total: number }> = []
    const onProgress = vi.fn((current, total) => {
      progressCalls.push({ current, total })
    })

    const result = await saveCustomFonts([validFile, invalidFile], onProgress)

    expect(result.added.length).toBe(1)
    expect(result.added[0].name).toBe('CustomRoboto')
    expect(result.added[0].format).toBe('truetype')

    expect(result.failed.length).toBe(1)
    expect(result.failed[0].fileName).toBe('readme.txt')

    expect(onProgress).toHaveBeenCalledTimes(2)
    expect(progressCalls).toEqual([
      { current: 1, total: 2 },
      { current: 2, total: 2 },
    ])
  })
})
