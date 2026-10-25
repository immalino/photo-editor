export type TextAlign = 'left' | 'center' | 'right'

export type SizeUnit = 'px' | '%'

export type DimensionReference = 'width' | 'height'

export interface StrokeStyle {
  enabled: boolean
  color: string
  width: number
  unit?: SizeUnit
  ref?: DimensionReference
  widthPercent?: number
}

export interface ShadowStyle {
  enabled: boolean
  color: string
  blur: number
  offsetX: number
  offsetY: number
  unit?: SizeUnit
  ref?: DimensionReference
  blurPercent?: number
  offsetXPercent?: number
  offsetYPercent?: number
}

export interface BackgroundStyle {
  enabled: boolean
  color: string
  opacity: number
  padding: number
  borderRadius: number
  unit?: SizeUnit
  ref?: DimensionReference
  paddingPercent?: number
  borderRadiusPercent?: number
}

export interface TextStyle {
  fontFamily: string
  fontSize: number
  fontSizeUnit?: SizeUnit
  fontSizeRef?: DimensionReference
  fontSizePercent?: number
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
