import { Image as ImageIcon, FolderOpen, RotateCcw, Type, Download, Layers } from 'lucide-react'
import type { PhotoItem } from '../../types/photo'

export interface HeaderToolbarProps {
  activePhoto?: PhotoItem
  photosCount?: number
  onOpenPhoto: () => void
  onReset?: () => void
  onAddText?: () => void
  onExport?: () => void
  onExportBatch?: () => void
}

export function HeaderToolbar({
  activePhoto,
  photosCount = 0,
  onOpenPhoto,
  onReset,
  onAddText,
  onExport,
  onExportBatch,
}: HeaderToolbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 font-semibold text-slate-100">
          <ImageIcon className="h-5 w-5 text-indigo-400" />
          <span className="text-sm md:text-base">Photo Text Editor</span>
        </div>

        {activePhoto && (
          <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
            <span className="text-slate-600">|</span>
            <span
              className="max-w-[200px] truncate font-medium text-slate-300"
              title={activePhoto.name}
            >
              {activePhoto.name}
            </span>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[11px] text-slate-400">
              {activePhoto.originalWidth} × {activePhoto.originalHeight} px
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {activePhoto && onAddText && (
          <button
            type="button"
            onClick={onAddText}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-500 active:scale-95 shadow-sm"
            title="Tambah Teks (Layer baru)"
          >
            <Type className="h-4 w-4" />
            <span>Tambah Teks</span>
          </button>
        )}

        {activePhoto && onExport && (
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500 active:scale-95 shadow-sm"
            title="Ekspor Foto Resolusi Penuh"
          >
            <Download className="h-4 w-4" />
            <span>Ekspor</span>
          </button>
        )}

        {photosCount > 1 && onExportBatch && (
          <button
            type="button"
            onClick={onExportBatch}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-teal-500 active:scale-95 shadow-sm"
            title="Ekspor Semua Foto (Batch Queue)"
          >
            <Layers className="h-4 w-4" />
            <span>Ekspor Batch ({photosCount})</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenPhoto}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700 active:scale-95"
        >
          <FolderOpen className="h-4 w-4" />
          <span>Buka Foto</span>
        </button>

        {activePhoto && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-slate-700 active:scale-95"
            title="Tutup Foto"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tutup</span>
          </button>
        )}
      </div>
    </header>
  )
}
