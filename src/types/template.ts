import type { TextLayer } from './layer'

export interface SavedTemplate {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  isBuiltIn?: boolean
  description?: string
  layers: TextLayer[]
}

export interface TextTemplateData {
  version: '1.0'
  name: string
  createdAt: string
  layers: TextLayer[]
}

