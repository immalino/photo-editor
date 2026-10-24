import { useState, useId } from 'react'
import { X, Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import type { PhotoItem } from '../../types/photo'
import type { TextLayer } from '../../types/layer'
import type { ExportConfig, ExportFormat } from '../../types/export'
import { generateExportFileName } from '../../utils/fileNaming'
import { renderPhotoWithLayers } from '../../services/exportEngine'
import { saveFileBlob } from '../../services/platformAdapter'

export interface ExportSingleModalProps {
  isOpen: boolean
  onClose: () => void
  photo: PhotoItem
  layers: TextLayer[]
}

export function ExportSingleModal({
  isOpen,
  onClose,
  photo,
  layers,
}: ExportSingleModalProps) {
  const [format, setFormat] = useState<ExportFormat>('png')
  const [quality, setQuality] = useState<number>(90)
  const [namingPattern, setNamingPattern] = useState<string>('{name}_edited')
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const patternId = useId()
  const qualityId = useId()

  if (!isOpen) return null

  const previewFileName = generateExportFileName(photo.name, namingPattern, format)

  const handleExport = async () => {
    setIsExporting(true)
    setExportStatus('idle')
    setErrorMessage('')

    try {
      const config: ExportConfig = {
        format,
        quality: quality / 100,
        namingPattern,
      }

      const blob = await renderPhotoWithLayers(photo, layers, config)
      const success = await saveFileBlob(blob, previewFileName)

      if (success) {
        setExportStatus('success')
        setTimeout(() => {
          onClose()
          setExportStatus('idle')
        }, 1200)
      } else {
        setExportStatus('error')
        setErrorMessage('Gagal menyimpan file ke penyimpanan lokal.')
      }
    } catch (err) {
      console.error('Export failed:', err)
      setExportStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses ekspor.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
      <div className="relative w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-slate-100">Ekspor Resolusi Penuh</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Photo Info Banner */}
        <div className="mb-4 rounded-lg bg-slate-800/60 p-3 border border-slate-700/50 text-xs flex justify-between items-center">
          <span className="truncate max-w-[200px] text-slate-300 font-medium" title={photo.name}>
            {photo.name}
          </span>
          <span className="text-indigo-300 font-mono">
            {photo.originalWidth} × {photo.originalHeight} px
          </span>
        </div>

        <div className="space-y-4 text-xs">
          {/* Format Selection */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Format Gambar</label>
            <div className="grid grid-cols-3 gap-2">
              {(['png', 'jpg', 'webp'] as ExportFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setFormat(fmt)}
                  className={`rounded-lg py-2 font-medium uppercase transition border ${
                    format === fmt
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700/60'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {format === 'png'
                ? 'PNG: Kualitas tanpa kompresi lossy (Lossless, ideal untuk teks tajam).'
                : format === 'jpg'
                  ? 'JPG: Ukuran file lebih kecil dengan kompresi berkualitas tinggi.'
                  : 'WebP: Format modern dengan rasio kompresi optimal.'}
            </p>
          </div>

          {/* Quality Slider (for JPG & WebP) */}
          {format !== 'png' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor={qualityId} className="text-slate-300 font-medium">
                  Kualitas Kompresi
                </label>
                <span className="font-mono text-indigo-400 font-semibold">{quality}%</span>
              </div>
              <input
                id={qualityId}
                type="range"
                min="1"
                max="100"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          )}

          {/* File Naming Pattern */}
          <div>
            <label htmlFor={patternId} className="block text-slate-300 font-medium mb-1.5">
              Pola Penamaan File
            </label>
            <input
              id={patternId}
              type="text"
              value={namingPattern}
              onChange={(e) => setNamingPattern(e.target.value)}
              placeholder="{name}_edited"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            <div className="mt-1 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Gunakan {'{name}'} untuk nama foto asli</span>
              <span className="text-indigo-400 font-mono truncate max-w-[180px]" title={previewFileName}>
                {previewFileName}
              </span>
            </div>
          </div>
        </div>

        {/* Status Notification */}
        {exportStatus === 'success' && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 p-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>Ekspor berhasil! File sedang diunduh.</span>
          </div>
        )}

        {exportStatus === 'error' && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-950/80 border border-red-500/40 p-2.5 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 transition active:scale-95 disabled:opacity-50 shadow-md"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Mengekspor...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Ekspor & Simpan</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

