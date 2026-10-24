import { Sliders, X, Trash2 } from 'lucide-react'
import type { TextLayer } from '../../types/layer'
import { ContentProperty } from './ContentProperty'
import { TypographyProperty } from './TypographyProperty'
import { StrokeProperty } from './StrokeProperty'
import { ShadowProperty } from './ShadowProperty'
import { BackgroundProperty } from './BackgroundProperty'
import { LayerOrderList } from './LayerOrderList'

interface PropertiesPanelProps {
  photoId: string | null
  selectedLayer: TextLayer | undefined
  layers: TextLayer[]
  onSelectLayer: (layerId: string | null) => void
  onUpdateLayer: (layerId: string, updates: Partial<TextLayer>) => void
  onDeleteLayer: (layerId: string) => void
  onToggleVisibility: (layerId: string) => void
  onMoveUp: (layerId: string) => void
  onMoveDown: (layerId: string) => void
}

export function PropertiesPanel({
  photoId,
  selectedLayer,
  layers,
  onSelectLayer,
  onUpdateLayer,
  onDeleteLayer,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
}: PropertiesPanelProps) {
  if (!photoId) {
    return (
      <aside className="w-80 border-l border-slate-800 bg-slate-950 p-4 text-center text-xs text-slate-500">
        Silakan buka foto terlebih dahulu untuk mulai menambahkan dan menyunting teks.
      </aside>
    )
  }

  return (
    <aside className="flex h-full w-80 flex-col border-l border-slate-800 bg-slate-950/95 backdrop-blur-sm">
      {/* Panel Header */}
      <div className="flex h-11 items-center justify-between border-b border-slate-800 px-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
          <Sliders className="h-4 w-4 text-blue-400" />
          <span>Panel Properti</span>
        </div>
        {selectedLayer && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onDeleteLayer(selectedLayer.id)}
              className="rounded p-1 text-slate-400 hover:bg-red-950/60 hover:text-red-300 transition-colors"
              title="Hapus Layer Terpilih"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onSelectLayer(null)}
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
              title="Tutup Panel Properti Layer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Panel Body */}
      <div className="flex-1 space-y-4 overflow-y-auto p-3 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
        {/* Layer Order List Section */}
        <LayerOrderList
          layers={layers}
          selectedLayerId={selectedLayer ? selectedLayer.id : null}
          onSelectLayer={(id) => onSelectLayer(id)}
          onToggleVisibility={onToggleVisibility}
          onDeleteLayer={onDeleteLayer}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
        />

        {/* Selected Layer Properties */}
        {selectedLayer ? (
          <div className="space-y-3 pt-1">
            <ContentProperty
              layer={selectedLayer}
              onChange={(updates) => onUpdateLayer(selectedLayer.id, updates)}
            />

            <TypographyProperty
              layer={selectedLayer}
              onChange={(updates) => onUpdateLayer(selectedLayer.id, updates)}
            />

            <StrokeProperty
              layer={selectedLayer}
              onChange={(updates) => onUpdateLayer(selectedLayer.id, updates)}
            />

            <ShadowProperty
              layer={selectedLayer}
              onChange={(updates) => onUpdateLayer(selectedLayer.id, updates)}
            />

            <BackgroundProperty
              layer={selectedLayer}
              onChange={(updates) => onUpdateLayer(selectedLayer.id, updates)}
            />
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-800 p-6 text-center text-xs text-slate-400">
            Pilih salah satu teks pada kanvas atau klik dari daftar layer di atas untuk mengubah gaya, ukuran, dan efek.
          </div>
        )}
      </div>
    </aside>
  )
}
