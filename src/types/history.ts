import type { TextLayer } from './layer'

export type ActionType =
  | 'ADD_LAYER'
  | 'UPDATE_LAYER'
  | 'DELETE_LAYER'
  | 'REORDER_LAYERS'
  | 'APPLY_TO_ALL'
  | 'RESET_LAYERS'

export interface HistorySnapshot {
  photoId: string
  layers: TextLayer[]
  action?: ActionType
  timestamp: number
}

export interface HistoryState {
  past: HistorySnapshot[]
  future: HistorySnapshot[]
  maxHistory: number
}
