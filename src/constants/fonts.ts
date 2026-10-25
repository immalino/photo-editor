import type { FontOption } from '../types/font'

export type { FontOption }

export const WINDOWS_STANDARD_FONTS: FontOption[] = [
  { name: 'Arial', value: 'Arial', category: 'sans-serif' },
  { name: 'Arial Black', value: 'Arial Black', category: 'sans-serif' },
  { name: 'Calibri', value: 'Calibri', category: 'sans-serif' },
  { name: 'Comic Sans MS', value: 'Comic Sans MS', category: 'display' },
  { name: 'Courier New', value: 'Courier New', category: 'monospace' },
  { name: 'Georgia', value: 'Georgia', category: 'serif' },
  { name: 'Impact', value: 'Impact', category: 'display' },
  { name: 'Lucida Console', value: 'Lucida Console', category: 'monospace' },
  { name: 'Segoe UI', value: 'Segoe UI', category: 'sans-serif' },
  { name: 'Tahoma', value: 'Tahoma', category: 'sans-serif' },
  { name: 'Times New Roman', value: 'Times New Roman', category: 'serif' },
  { name: 'Trebuchet MS', value: 'Trebuchet MS', category: 'sans-serif' },
  { name: 'Verdana', value: 'Verdana', category: 'sans-serif' },
]

export const DEFAULT_FONT = 'Arial'
