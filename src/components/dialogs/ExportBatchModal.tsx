import { useState, useId } from 'react'
import { X, Download, CheckCircle2, AlertCircle, StopCircle, Layers } from 'lucide-react'
import type { PhotoItem } from '../../types/photo'
import type { TextLayer } from '../../types/layer'
import type { ExportConfig, ExportFormat } from '../../types/export'
import { generateExportFileName } from '../../utils/fileNaming'
import { useBatchProcess } from '../../hooks/useBatchProcess'

export interface ExportBatchModalProps {
  isOpen: boolean
  onClose: () => void
  photos: PhotoItem[]
  layersMap: Record<string, TextLayer[]>
}

export function ExportBatchModal({
  isOpen,
  onClose,
  photos,
  layersMap,
}: ExportBatchModalProps) {
  const [format, setFormat] = useState<ExportFormat>('png')
  const [quality, setQuality] = useState<number>(90)
  const [namingPattern, setNamingPattern] = useState<string>('{name}_edited')
  const [hasStarted, setHasStarted] = useState(false)

  const patternId = useId()
  const qualityId = useId()

  const {
    isProcessing,
    currentProgress,
    totalPhotos,
    currentFileName,
    completedList,
    failedList,
    isCancelled,
    processQueue,
    cancel,
    reset,
  } = useBatchProcess({ itemDelay: 35 })

  if (!isOpen) return null

  const firstPhotoName = photos[0]?.name ?? 'photo'
  const previewFileName = generateExportFileName(firstPhotoName, namingPattern, format)

  const progressPercent = totalPhotos > 0 ? Math.round((currentProgress / totalPhotos) * 100) : 0
  const isFinished = hasStarted && !isProcessing

  const handleStartExport = async () => {
    setHasStarted(true)
    const config: ExportConfig = {
      format,
      quality: quality / 100,
      namingPattern,
    }
    await processQueue(photos, layersMap, config)
  }

  const handleClose = () => {
    if (isProcessing) {
      cancel()
    }
    reset()
    setHasStarted(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in">
      <div className="relative w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-slate-100">
              Ekspor Batch ({photos.length} Foto)
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isProcessing}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Configuration settings (shown before processing or allows re-run) */}
        {!hasStarted && (
          <div className="space-y-4 text-xs">
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
            </div>

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
                <span className="text-slate-400">Contoh: {firstPhotoName} →</span>
                <span className="text-indigo-400 font-mono truncate max-w-[200px]" title={previewFileName}>
                  {previewFileName}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Progress Display */}
        {hasStarted && (
          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-300">
                  {isProcessing
                    ? `Memproses ${currentProgress + 1} dari ${totalPhotos}...`
                    : isCancelled
                      ? 'Proses dihentikan pengguna'
                      : 'Proses ekspor batch selesai'}
                </span>
                <span className="font-mono font-semibold text-indigo-400">{progressPercent}%</span>
              </div>

              {/* Progress Bar Track */}
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {isProcessing && currentFileName && (
                <p className="truncate text-[11px] text-slate-400">
                  File saat ini: <span className="font-medium text-slate-200">{currentFileName}</span>
                </p>
              )}
            </div>

            {/* Results Summary Box */}
            <div className="rounded-lg border border-slate-800 bg-slate-800/50 p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="inline-flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Berhasil: {completedList.length}</span>
                </span>
                {failedList.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-red-400">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Gagal: {failedList.length}</span>
                  </span>
                )}
              </div>

              {failedList.length > 0 && (
                <div className="max-h-24 overflow-y-auto rounded bg-red-950/40 p-2 text-[10px] text-red-300 space-y-1">
                  {failedList.map((fail, i) => (
                    <div key={i} className="truncate">
                      • {fail.fileName}: {fail.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-800 pt-4">
          {!hasStarted && (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleStartExport}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500 transition active:scale-95 shadow-md"
              >
                <Download className="h-4 w-4" />
                <span>Mulai Ekspor Batch</span>
              </button>
            </>
          )}

          {isProcessing && (
            <button
              type="button"
              onClick={cancel}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/60 bg-red-950/60 px-4 py-2 text-xs font-medium text-red-300 hover:bg-red-900 transition"
            >
              <StopCircle className="h-4 w-4" />
              <span>Hentikan Proses</span>
            </button>
          )}

          {isFinished && (
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-medium text-white hover:bg-indigo-500 transition active:scale-95"
            >
              <span>Selesai & Tutup</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
