import { Eye, EyeOff, Trash2, ChevronUp, ChevronDown, Layers } from 'lucide-react'
import type { TextLayer } from '../../types/layer'

interface LayerOrderListProps {
  layers: TextLayer[]
  selectedLayerId: string | null
  onSelectLayer: (layerId: string) => void
  onToggleVisibility: (layerId: string) => void
  onDeleteLayer: (layerId: string) => void
  onMoveUp: (layerId: string) => void
  onMoveDown: (layerId: string) => void
}

export function LayerOrderList({
  layers,
  selectedLayerId,
  onSelectLayer,
  onToggleVisibility,
  onDeleteLayer,
  onMoveUp,
  onMoveDown,
}: LayerOrderListProps) {
  if (layers.length === 0) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-center text-xs text-slate-400">
        <Layers className="mx-auto mb-2 h-6 w-6 text-slate-500 opacity-60" />
        Belum ada layer teks. Klik tombol <span className="text-blue-400 font-medium">"+ Tambah Teks"</span> di toolbar.
      </div>
    )
  }

  // Display top layer (highest index / z-index) first, down to bottom layer
  const displayList = [...layers].map((layer, index) => ({
    layer,
    originalIndex: index,
  })).reverse()

  return (
    <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5" />
          Daftar Layer ({layers.length})
        </span>
        <span className="text-[10px] text-slate-500">Atas ➔ Bawah</span>
      </div>

      <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
        {displayList.map(({ layer, originalIndex }) => {
          const isSelected = layer.id === selectedLayerId
          const canMoveUp = originalIndex < layers.length - 1
          const canMoveDown = originalIndex > 0

          return (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              className={`group flex items-center justify-between gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors cursor-pointer ${
                isSelected
                  ? 'border border-blue-500/80 bg-blue-950/40 text-blue-200 shadow-sm'
                  : 'border border-transparent bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-slate-100'
              } ${!layer.visible ? 'opacity-50' : ''}`}
            >
              {/* Layer Title / Snippet */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="font-mono text-[10px] text-slate-500 w-3">
                  {originalIndex + 1}
                </span>
                <span className="truncate font-medium">
                  {layer.text.trim() || '(Teks Kosong)'}
                </span>
              </div>

              {/* Action Buttons */}
              <div
                className="flex items-center gap-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Move Up in stack (towards top) */}
                <button
                  type="button"
                  disabled={!canMoveUp}
                  onClick={() => onMoveUp(layer.id)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-slate-200 disabled:opacity-20 disabled:hover:bg-transparent"
                  title="Naikkan Urutan (Ke Depan)"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>

                {/* Move Down in stack (towards bottom) */}
                <button
                  type="button"
                  disabled={!canMoveDown}
                  onClick={() => onMoveDown(layer.id)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-slate-200 disabled:opacity-20 disabled:hover:bg-transparent"
                  title="Turunkan Urutan (Ke Belakang)"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>

                {/* Visibility Toggle */}
                <button
                  type="button"
                  onClick={() => onToggleVisibility(layer.id)}
                  className={`rounded p-1 ${
                    layer.visible
                      ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                      : 'text-amber-400 hover:bg-slate-700'
                  }`}
                  title={layer.visible ? 'Sembunyikan Layer' : 'Tampilkan Layer'}
                >
                  {layer.visible ? (
                    <Eye className="h-3.5 w-3.5" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5" />
                  )}
                </button>

                {/* Delete Layer */}
                <button
                  type="button"
                  onClick={() => onDeleteLayer(layer.id)}
                  className="rounded p-1 text-slate-400 hover:bg-red-950/60 hover:text-red-300"
                  title="Hapus Layer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
