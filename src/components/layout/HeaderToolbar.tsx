import {
  Image as ImageIcon,
  RotateCcw,
  Type,
  Download,
  Layers,
  Undo2,
  Redo2,
  FileCode,
  FolderOpen,
  Baseline,
} from 'lucide-react'
import type { PhotoItem } from '../../types/photo'

export interface HeaderToolbarProps {
  activePhoto?: PhotoItem
  photosCount?: number
  canUndo?: boolean
  canRedo?: boolean
  onUndo?: () => void
  onRedo?: () => void
  onOpenTemplate?: () => void
  onOpenFontManager?: () => void
  onOpenPhoto: () => void
  onReset?: () => void
  onAddText?: () => void
  onExport?: () => void
  onExportBatch?: () => void
}

export function HeaderToolbar({
  activePhoto,
  photosCount = 0,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onOpenTemplate,
  onOpenFontManager,
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
        {/* Open Photo Button */}
        <button
          type="button"
          onClick={onOpenPhoto}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-200 transition hover:bg-slate-700 active:scale-95 shadow-sm"
          title="Buka Foto dari Komputer"
        >
          <FolderOpen className="h-3.5 w-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Buka Foto</span>
        </button>

        {/* Undo & Redo buttons */}
        {activePhoto && (
          <div className="flex items-center rounded-lg border border-slate-700/80 bg-slate-800/60 p-0.5 mr-1">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className="rounded p-1.5 text-slate-300 transition hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
              title="Undo (Ctrl + Z)"
              aria-label="Undo"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              className="rounded p-1.5 text-slate-300 transition hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
              title="Redo (Ctrl + Y)"
              aria-label="Redo"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Font Manager Button */}
        {onOpenFontManager && (
          <button
            type="button"
            onClick={onOpenFontManager}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-200 transition hover:bg-slate-700 active:scale-95 shadow-sm"
            title="Kelola Font Kustom (Upload font .ttf, .otf, dll)"
          >
            <Baseline className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Font</span>
          </button>
        )}

        {/* Template Button */}
        {activePhoto && onOpenTemplate && (
          <button
            type="button"
            onClick={onOpenTemplate}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs text-slate-200 transition hover:bg-slate-700 active:scale-95 shadow-sm"
            title="Pustaka & Template Layer Teks"
          >
            <FileCode className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Template</span>
          </button>
        )}

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

        {photosCount > 0 && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
            title="Tutup & Reset Semua Foto"
            aria-label="Tutup & Reset Semua Foto"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  )
}
