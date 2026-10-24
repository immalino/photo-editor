import type { TextStyle } from '../types/layer'

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: 'Arial',
  fontSize: 48,
  fill: '#ffffff',
  opacity: 1,
  align: 'left',
  bold: false,
  italic: false,
  stroke: {
    enabled: true,
    color: '#000000',
    width: 2,
  },
  shadow: {
    enabled: false,
    color: 'rgba(0, 0, 0, 0.5)',
    blur: 4,
    offsetX: 2,
    offsetY: 2,
  },
  background: {
    enabled: false,
    color: '#000000',
    opacity: 0.5,
    padding: 8,
    borderRadius: 4,
  },
}
