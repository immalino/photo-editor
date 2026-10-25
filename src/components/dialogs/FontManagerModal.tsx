import { useState, useRef, type ChangeEvent, type DragEvent } from 'react'
import {
  X,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Type,
  FolderOpen,
  Loader2,
  Files,
} from 'lucide-react'
import { useFontStore } from '../../stores/useFontStore'
import { detectFontFormat } from '../../services/customFontService'
import { openFolderDialog, isTauri } from '../../services/platformAdapter'

export interface FontManagerModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FontManagerModal({ isOpen, onClose }: FontManagerModalProps) {
  const { customFonts, addFont, addFonts, removeFont } = useFontStore()
  const [fontNameInput, setFontNameInput] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [folderName, setFolderName] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(
    null
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const resetSelection = () => {
    setSelectedFiles([])
    setFolderName(null)
    setFontNameInput('')
    setUploadProgress(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (folderInputRef.current) folderInputRef.current.value = ''
  }

  const processIncomingFiles = (rawFiles: File[], sourceFolder?: string) => {
    setErrorMessage(null)
    setSuccessMessage(null)

    const validFiles = rawFiles.filter((f) => detectFontFormat(f.name) !== null)

    if (validFiles.length === 0) {
      setErrorMessage(
        'Tidak ada file font yang didukung (.ttf, .otf, .woff, .woff2) di dalam pilihan Anda.'
      )
      resetSelection()
      return
    }

    setSelectedFiles(validFiles)
    setFolderName(sourceFolder || null)

    if (validFiles.length === 1) {
      setFontNameInput(validFiles[0].name.replace(/\.[^/.]+$/, ''))
    } else {
      setFontNameInput('')
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    if (files.length === 0) return
    processIncomingFiles(files)
  }

  const handleFolderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    if (files.length === 0) return

    // Attempt to extract folder name from webkitRelativePath
    let detectedFolder: string | undefined
    if (files[0]?.webkitRelativePath) {
      detectedFolder = files[0].webkitRelativePath.split('/')[0]
    }

    processIncomingFiles(files, detectedFolder)
  }

  const handleOpenFolderClick = async () => {
    if (isTauri()) {
      try {
        const files = await openFolderDialog({
          extensions: ['ttf', 'otf', 'woff', 'woff2'],
        })
        if (files.length > 0) {
          processIncomingFiles(files, 'Folder Desktop')
        }
        return
      } catch (err) {
        console.warn('Tauri openFolderDialog error:', err)
      }
    }

    // Browser fallback
    if (folderInputRef.current) {
      folderInputRef.current.click()
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const dt = e.dataTransfer
    const files = dt.files ? Array.from(dt.files) : []
    if (files.length > 0) {
      processIncomingFiles(files)
    }
  }

  const handleUploadSingle = async () => {
    if (selectedFiles.length === 0) return
    const file = selectedFiles[0]

    setIsUploading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const added = await addFont(file, fontNameInput.trim() || undefined)
      setSuccessMessage(`Font "${added.name}" berhasil ditambahkan dan siap digunakan!`)
      resetSelection()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal menambahkan font kustom.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleUploadBatch = async () => {
    if (selectedFiles.length === 0) return

    setIsUploading(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    setUploadProgress({ current: 0, total: selectedFiles.length })

    try {
      const { added, failed } = await addFonts(selectedFiles, (current, total) => {
        setUploadProgress({ current, total })
      })

      if (added.length > 0) {
        let msg = `Berhasil menambahkan ${added.length} font kustom baru!`
        if (failed.length > 0) {
          msg += ` (${failed.length} file dilewati atau gagal)`
        }
        setSuccessMessage(msg)
      } else if (failed.length > 0) {
        setErrorMessage(
          `Gagal menambahkan font. ${failed.map((f) => `${f.fileName}: ${f.reason}`).join('; ')}`
        )
      }
      resetSelection()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal memproses folder font.')
    } finally {
      setIsUploading(false)
      setUploadProgress(null)
    }
  }

  const handleDelete = async (fontName: string) => {
    if (window.confirm(`Hapus font kustom "${fontName}"?`)) {
      await removeFont(fontName)
    }
  }

  const isMultiple = selectedFiles.length > 1
  const isSingle = selectedFiles.length === 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl border bg-slate-900 p-6 shadow-2xl transition ${
          isDragOver ? 'border-indigo-400 ring-2 ring-indigo-500/50' : 'border-slate-700'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          aria-label="Tutup Dialog"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <Type className="h-5 w-5 text-indigo-400" />
          <h3 className="text-base font-semibold text-slate-100">Kelola Font Kustom</h3>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Unggah file font individual atau seluruh folder (.ttf, .otf, .woff, .woff2) untuk digunakan di foto dan pratinjau kanvas.
        </p>

        {/* Upload Form Section */}
        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/70 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Unggah Font Baru
            </span>
            <span className="text-[11px] text-slate-500">Bisa pilih file atau 1 folder penuh</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Hidden native inputs */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".ttf,.otf,.woff,.woff2"
              onChange={handleFileChange}
              className="hidden"
              id="custom-font-file-input"
            />
            <input
              ref={folderInputRef}
              type="file"
              {...{ webkitdirectory: '', directory: '' }}
              multiple
              onChange={handleFolderChange}
              className="hidden"
              id="custom-font-folder-input"
            />

            {/* Pick File Button */}
            <label
              htmlFor="custom-font-file-input"
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white active:scale-95 shadow-sm"
              title="Pilih satu atau beberapa file font"
            >
              <Upload className="h-3.5 w-3.5 text-indigo-400" />
              <span>Pilih File</span>
            </label>

            {/* Pick Folder Button */}
            <button
              type="button"
              onClick={handleOpenFolderClick}
              className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white active:scale-95 shadow-sm"
              title="Pilih seluruh folder untuk menambahkan semua font di dalamnya sekaligus"
            >
              <FolderOpen className="h-3.5 w-3.5 text-amber-400" />
              <span>Pilih Folder</span>
            </button>

            {selectedFiles.length > 0 && (
              <button
                type="button"
                onClick={resetSelection}
                className="text-[11px] text-slate-400 hover:text-slate-200 ml-auto"
              >
                Batal
              </button>
            )}
          </div>

          {/* Single File Selected Form */}
          {isSingle && (
            <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-900/60 p-2.5 animate-fade-in">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-mono truncate max-w-[280px]" title={selectedFiles[0].name}>
                  {selectedFiles[0].name}
                </span>
                <span className="text-[10px] text-slate-500 uppercase">
                  {selectedFiles[0].name.split('.').pop()}
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nama Font (opsional)"
                  value={fontNameInput}
                  onChange={(e) => setFontNameInput(e.target.value)}
                  className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleUploadSingle}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 rounded bg-indigo-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Pasang Font</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Multiple Files / Folder Selected Form */}
          {isMultiple && (
            <div className="space-y-2 rounded-lg border border-indigo-900/50 bg-indigo-950/30 p-3 animate-fade-in">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-indigo-300 font-medium">
                  <Files className="h-4 w-4 text-indigo-400" />
                  <span>
                    {folderName
                      ? `Folder: ${folderName} (${selectedFiles.length} font)`
                      : `${selectedFiles.length} file font terpilih`}
                  </span>
                </div>
              </div>

              {/* Preview preview chips */}
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1 py-1">
                {selectedFiles.slice(0, 8).map((f) => (
                  <span
                    key={f.name}
                    className="inline-flex items-center gap-1 rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-slate-300 border border-slate-700/60"
                    title={f.name}
                  >
                    <span className="truncate max-w-[120px]">{f.name}</span>
                  </span>
                ))}
                {selectedFiles.length > 8 && (
                  <span className="rounded bg-indigo-900/60 px-1.5 py-0.5 text-[10px] text-indigo-300 font-semibold">
                    +{selectedFiles.length - 8} lainnya
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-indigo-900/40">
                <span className="text-[11px] text-slate-400">
                  {uploadProgress
                    ? `Memproses ${uploadProgress.current} dari ${uploadProgress.total}...`
                    : 'Siap diunggah sekaligus'}
                </span>

                <button
                  type="button"
                  onClick={handleUploadBatch}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50 shadow-md"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>
                        Memasang ({uploadProgress?.current || 0}/{uploadProgress?.total || selectedFiles.length})...
                      </span>
                    </>
                  ) : (
                    <span>Pasang Semua ({selectedFiles.length} Font)</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 rounded bg-red-950/60 border border-red-800/40 p-2 text-xs text-red-300 animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 rounded bg-emerald-950/60 border border-emerald-800/40 p-2 text-xs text-emerald-300 animate-fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Custom Fonts List */}
        <div className="mt-4 flex flex-1 flex-col overflow-hidden">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
            <span>Daftar Font Kustom ({customFonts.length})</span>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            {customFonts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
                Belum ada font kustom yang diunggah. Pilih file font atau satu folder penuh untuk menambahkan font otomatis ke aplikasi.
              </div>
            ) : (
              customFonts.map((font) => (
                <div
                  key={font.name}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/50 p-3 transition hover:border-slate-700"
                >
                  <div className="overflow-hidden pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-200">{font.name}</span>
                      {font.format && (
                        <span className="rounded bg-slate-700 px-1.5 py-0.2 text-[10px] uppercase text-slate-300">
                          {font.format}
                        </span>
                      )}
                    </div>
                    <div
                      className="mt-1 text-sm text-slate-400 truncate"
                      style={{ fontFamily: font.value }}
                    >
                      The quick brown fox jumps over the lazy dog 123
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(font.name)}
                    className="rounded p-1.5 text-slate-400 hover:bg-red-950/60 hover:text-red-400 transition"
                    title={`Hapus font ${font.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
