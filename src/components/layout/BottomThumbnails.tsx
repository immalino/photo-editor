import { Plus, X, Copy, Layers, Image as ImageIcon } from 'lucide-react'
import type { PhotoItem } from '../../types/photo'
import type { TextLayer } from '../../types/layer'

export interface BottomThumbnailsProps {
  photos: PhotoItem[]
  activePhotoId: string | null
  layersMap: Record<string, TextLayer[]>
  onSelectPhoto: (id: string) => void
  onRemovePhoto: (id: string) => void
  onAddMorePhotos: () => void
  onApplyLayersToAll: () => void
  onOpenBatchExport?: () => void
}

export function BottomThumbnails({
  photos,
  activePhotoId,
  layersMap,
  onSelectPhoto,
  onRemovePhoto,
  onAddMorePhotos,
  onApplyLayersToAll,
  onOpenBatchExport,
}: BottomThumbnailsProps) {
  if (photos.length === 0) {
    return null
  }

  const activeLayersCount = activePhotoId ? (layersMap[activePhotoId]?.length ?? 0) : 0
  const canApplyToAll = activeLayersCount > 0 && photos.length > 1

  return (
    <aside
      aria-label="Thumbnail Strip"
      className="flex flex-col border-t border-slate-800 bg-slate-900/95 px-4 py-2.5 backdrop-blur-sm"
    >
      {/* Bar Header with Actions */}
      <div className="mb-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <ImageIcon className="h-4 w-4 text-indigo-400" />
          <span className="font-semibold text-slate-200">
            Daftar Foto ({photos.length})
          </span>
          <span className="hidden text-[11px] text-slate-500 sm:inline">
            Klik foto untuk beralih atau edit teks khusus
          </span>
        </div>

        <div className="flex items-center gap-2">
          {canApplyToAll && (
            <button
              type="button"
              onClick={onApplyLayersToAll}
              className="inline-flex items-center gap-1.5 rounded-md border border-indigo-500/50 bg-indigo-950/60 px-2.5 py-1 text-xs font-medium text-indigo-300 transition hover:bg-indigo-900/80 hover:text-white"
              title="Salin semua teks foto ini ke semua foto lain"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Terapkan Teks ke Semua</span>
            </button>
          )}

          {photos.length > 1 && onOpenBatchExport && (
            <button
              type="button"
              onClick={onOpenBatchExport}
              className="inline-flex items-center gap-1 rounded-md bg-emerald-600/90 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-emerald-500"
            >
              <span>Ekspor Semua ({photos.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={onAddMorePhotos}
            className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
            title="Tambah foto ke antrean batch"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Foto</span>
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Thumbnails List */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
        {photos.map((photo) => {
          const isActive = photo.id === activePhotoId
          const photoLayersCount = layersMap[photo.id]?.length ?? 0

          return (
            <div
              key={photo.id}
              onClick={() => onSelectPhoto(photo.id)}
              className={`group relative flex h-20 w-36 shrink-0 cursor-pointer flex-col overflow-hidden rounded-lg border transition ${
                isActive
                  ? 'border-indigo-500 bg-indigo-950/40 ring-2 ring-indigo-500/60'
                  : 'border-slate-800 bg-slate-800/60 hover:border-slate-700 hover:bg-slate-800'
              }`}
            >
              {/* Image Preview */}
              <div className="relative h-13 w-full bg-slate-950 overflow-hidden">
                <img
                  src={photo.url}
                  alt={photo.name}
                  className="h-full w-full object-cover"
                />

                {/* Layer Count Badge */}
                {photoLayersCount > 0 && (
                  <span className="absolute bottom-1 left-1 inline-flex items-center gap-0.5 rounded bg-black/75 px-1 py-0.5 text-[10px] font-medium text-indigo-300 backdrop-blur-xs">
                    <Layers className="h-2.5 w-2.5" />
                    <span>{photoLayersCount}</span>
                  </span>
                )}

                {/* Remove Photo Button */}
                <button
                  type="button"
                  aria-label={`Hapus ${photo.name}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemovePhoto(photo.id)
                  }}
                  className="absolute top-1 right-1 rounded-full bg-slate-900/80 p-0.5 text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-red-600 hover:text-white"
                  title="Hapus foto ini dari antrean"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>

              {/* Photo Information Label */}
              <div className="flex flex-1 items-center justify-between px-1.5 py-0.5 text-[10px]">
                <span
                  className="max-w-[75px] truncate font-medium text-slate-300"
                  title={photo.name}
                >
                  {photo.name}
                </span>
                <span className="text-slate-500">
                  {photo.originalWidth}×{photo.originalHeight}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}
