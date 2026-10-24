export type TextAlign = 'left' | 'center' | 'right'

export interface StrokeStyle {
  enabled: boolean
  color: string
  width: number
}

export interface ShadowStyle {
  enabled: boolean
  color: string
  blur: number
  offsetX: number
  offsetY: number
}

export interface BackgroundStyle {
  enabled: boolean
  color: string
  opacity: number
  padding: number
  borderRadius: number
}

export interface TextStyle {
  fontFamily: string
  fontSize: number
  fill: string
  opacity: number
  align: TextAlign
  bold: boolean
  italic: boolean
  stroke: StrokeStyle
  shadow: ShadowStyle
  background: BackgroundStyle
}

export interface TextLayer {
  id: string
  text: string
  relativeX: number
  relativeY: number
  rotation: number
  zIndex: number
  visible: boolean
  style: TextStyle
}
