export interface PhotoItem {
  id: string
  file?: File
  path?: string
  url: string
  name: string
  originalWidth: number
  originalHeight: number
  size?: number
}

export interface PhotoMetadata {
  width: number
  height: number
  aspectRatio: number
  format?: string
}
