export type FontCategory = 'sans-serif' | 'serif' | 'monospace' | 'display' | 'custom'

export type FontFormat = 'truetype' | 'opentype' | 'woff' | 'woff2'

export interface FontOption {
  name: string
  value: string
  category?: FontCategory
  isCustom?: boolean
  format?: FontFormat
  dataUrl?: string
  fileName?: string
}

export interface CustomFontRecord {
  id: string
  name: string
  fileName: string
  format: FontFormat
  dataUrl: string
  createdAt: string
}

