import { create } from 'zustand'
import type { FontOption } from '../types/font'
import { WINDOWS_STANDARD_FONTS } from '../constants/fonts'
import {
  getAllCustomFonts,
  saveCustomFont,
  saveCustomFonts,
  deleteCustomFont,
  registerFontFace,
  toFontOption,
} from '../services/customFontService'

interface FontState {
  systemFonts: FontOption[]
  customFonts: FontOption[]
  isLoading: boolean
  isInitialized: boolean

  // Actions
  initFonts: () => Promise<void>
  addFont: (file: File, customName?: string) => Promise<FontOption>
  addFonts: (
    files: File[],
    onProgress?: (current: number, total: number) => void
  ) => Promise<{ added: FontOption[]; failed: Array<{ fileName: string; reason: string }> }>
  removeFont: (fontName: string) => Promise<boolean>
}

export const useFontStore = create<FontState>((set, get) => ({
  systemFonts: WINDOWS_STANDARD_FONTS,
  customFonts: [],
  isLoading: false,
  isInitialized: false,

  initFonts: async () => {
    if (get().isInitialized) return
    set({ isLoading: true })

    try {
      const records = await getAllCustomFonts()
      // Register all loaded fonts into document.fonts
      for (const rec of records) {
        try {
          await registerFontFace(rec.name, rec.dataUrl)
        } catch (e) {
          console.warn(`Could not register font ${rec.name}:`, e)
        }
      }

      const customOptions = records.map(toFontOption)
      set({ customFonts: customOptions, isInitialized: true, isLoading: false })
    } catch (err) {
      console.error('Error initializing custom fonts:', err)
      set({ isLoading: false, isInitialized: true })
    }
  },

  addFont: async (file: File, customName?: string) => {
    const record = await saveCustomFont(file, customName)
    const option = toFontOption(record)

    set((state) => ({
      customFonts: [
        option,
        ...state.customFonts.filter((f) => f.name.toLowerCase() !== option.name.toLowerCase()),
      ],
    }))

    return option
  },

  addFonts: async (files, onProgress) => {
    const { added, failed } = await saveCustomFonts(files, onProgress)
    const newOptions = added.map(toFontOption)

    if (newOptions.length > 0) {
      set((state) => {
        const newNames = new Set(newOptions.map((o) => o.name.toLowerCase()))
        const existing = state.customFonts.filter((f) => !newNames.has(f.name.toLowerCase()))
        return {
          customFonts: [...newOptions, ...existing],
        }
      })
    }

    return { added: newOptions, failed }
  },

  removeFont: async (fontName: string) => {
    const target = get().customFonts.find(
      (f) => f.name.toLowerCase() === fontName.toLowerCase()
    )
    if (!target) return false

    // Try finding the record id or match
    const records = await getAllCustomFonts()
    const match = records.find(
      (r) => r.name.toLowerCase() === fontName.toLowerCase()
    )
    if (match) {
      await deleteCustomFont(match.id)
    }

    set((state) => ({
      customFonts: state.customFonts.filter(
        (f) => f.name.toLowerCase() !== fontName.toLowerCase()
      ),
    }))

    return true
  },
}))

