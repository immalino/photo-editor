export type ExportFormat = 'png' | 'jpg' | 'webp'

export interface ExportConfig {
  format: ExportFormat
  quality: number // 0.0 to 1.0 (or 1 to 100)
  namingPattern: string // e.g. "{name}_edited"
  outputDir?: string
}

export interface ExportProgress {
  total: number
  current: number
  currentFileName?: string
  percentage: number
  isProcessing: boolean
  completedList: string[]
  failedList: Array<{ fileName: string; error: string }>
}
