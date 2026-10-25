import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import {
  X,
  Save,
  Upload,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  BookmarkCheck,
  FolderOpen,
  Sparkles,
} from 'lucide-react'
import type { TextLayer } from '../../types/layer'
import type { SavedTemplate } from '../../types/template'
import {
  getAppTemplates,
  saveAppTemplate,
  deleteAppTemplate,
} from '../../services/appTemplateStorage'
import {
  saveTemplateAsFile,
  importTemplateFromJson,
} from '../../services/templateService'

export interface TemplateModalProps {
  isOpen: boolean
  onClose: () => void
  currentLayers: TextLayer[]
  onApplyTemplate: (layers: TextLayer[], mode: 'replace' | 'append') => void
}

export function TemplateModal({
  isOpen,
  onClose,
  currentLayers,
  onApplyTemplate,
}: TemplateModalProps) {
  const [tab, setTab] = useState<'library' | 'save' | 'import'>('library')
  const [templates, setTemplates] = useState<SavedTemplate[]>([])
  const [templateName, setTemplateName] = useState<string>('Template Teks Baru')
  const [templateDesc, setTemplateDesc] = useState<string>('')
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [importedLayers, setImportedLayers] = useState<TextLayer[] | null>(null)
  const [loadMode, setLoadMode] = useState<'replace' | 'append'>('replace')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load templates list on modal open or after save/delete
  const loadTemplates = async () => {
    try {
      const list = await getAppTemplates()
      setTemplates(list)
    } catch (e) {
      console.error('Failed to load templates:', e)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
      setErrorMessage(null)
      setSaveSuccess(null)
      setImportedLayers(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSaveToApp = async () => {
    if (currentLayers.length === 0) {
      setErrorMessage('Tidak ada layer teks untuk disimpan sebagai template.')
      return
    }
    if (!templateName.trim()) {
      setErrorMessage('Nama template tidak boleh kosong.')
      return
    }

    setErrorMessage(null)
    try {
      const saved = await saveAppTemplate(templateName, currentLayers, templateDesc)
      await loadTemplates()
      setSaveSuccess(`Template "${saved.name}" berhasil disimpan ke pustaka aplikasi!`)
      setTemplateName('Template Teks Baru')
      setTemplateDesc('')
      setTimeout(() => {
        setSaveSuccess(null)
        setTab('library')
      }, 1500)
    } catch {
      setErrorMessage('Gagal menyimpan template ke pustaka.')
    }
  }

  const handleDeleteTemplate = async (template: SavedTemplate) => {
    if (window.confirm(`Hapus template "${template.name}" dari pustaka?`)) {
      const ok = await deleteAppTemplate(template.id)
      if (ok) {
        await loadTemplates()
      }
    }
  }

  const handleDownloadAsJson = async (template: SavedTemplate) => {
    await saveTemplateAsFile(template.layers, template.name)
  }

  const handleApplyTemplateDirect = (tplLayers: TextLayer[], mode: 'replace' | 'append') => {
    onApplyTemplate(tplLayers, mode)
    onClose()
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setErrorMessage(null)
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const layers = importTemplateFromJson(text)
        setImportedLayers(layers)
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Gagal memproses file template JSON.'
        )
        setImportedLayers(null)
      }
    }
    reader.onerror = () => {
      setErrorMessage('Gagal membaca file dari disk.')
      setImportedLayers(null)
    }
    reader.readAsText(file)
  }

  const handleSaveImportedToLibrary = async () => {
    if (!importedLayers || importedLayers.length === 0) return
    const name = fileInputRef.current?.files?.[0]?.name.replace(/\.json$/i, '') || 'Template Impor'
    await saveAppTemplate(name, importedLayers)
    await loadTemplates()
    setSaveSuccess(`Template "${name}" berhasil ditambahkan ke pustaka!`)
    setTimeout(() => {
      setSaveSuccess(null)
      setTab('library')
    }, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative flex max-h-[88vh] w-full max-w-xl flex-col rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          aria-label="Tutup Dialog"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-base font-semibold text-slate-100">Pustaka & Template Teks</h3>
        <p className="mt-1 text-xs text-slate-400">
          Gunakan template tersimpan di aplikasi atau simpan gaya layer aktif untuk dipakai ulang.
        </p>

        {/* Tab Switcher */}
        <div className="mt-4 flex rounded-lg bg-slate-800/80 p-1">
          <button
            type="button"
            onClick={() => {
              setTab('library')
              setErrorMessage(null)
            }}
            className={`flex items-center justify-center gap-1.5 flex-1 rounded-md py-1.5 text-xs font-medium transition ${
              tab === 'library'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderOpen className="h-3.5 w-3.5" />
            <span>Pustaka Template ({templates.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('save')
              setErrorMessage(null)
            }}
            className={`flex items-center justify-center gap-1.5 flex-1 rounded-md py-1.5 text-xs font-medium transition ${
              tab === 'save'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Save className="h-3.5 w-3.5" />
            <span>Simpan ke Pustaka</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('import')
              setErrorMessage(null)
            }}
            className={`flex items-center justify-center gap-1.5 flex-1 rounded-md py-1.5 text-xs font-medium transition ${
              tab === 'import'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>File .JSON</span>
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/60 p-2.5 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/60 p-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {/* Tab 1: Library */}
        {tab === 'library' && (
          <div className="mt-4 flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="rounded-lg border border-slate-800 bg-slate-800/40 p-3 transition hover:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-100">{tpl.name}</span>
                        {tpl.isBuiltIn && (
                          <span className="inline-flex items-center gap-1 rounded bg-indigo-950/80 px-1.5 py-0.5 text-[10px] font-medium text-indigo-300 border border-indigo-800/40">
                            <Sparkles className="h-2.5 w-2.5" />
                            Bawaan
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">
                          ({tpl.layers.length} layer)
                        </span>
                      </div>
                      {tpl.description && (
                        <p className="mt-1 text-xs text-slate-400">{tpl.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDownloadAsJson(tpl)}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition"
                        title="Ekspor template ini sebagai file .JSON"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>

                      {!tpl.isBuiltIn && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(tpl)}
                          className="rounded p-1.5 text-slate-400 hover:bg-red-950/60 hover:text-red-400 transition"
                          title="Hapus template dari pustaka"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5">
                    <span className="text-[11px] text-slate-400">
                      {tpl.layers.map((l) => `"${l.text}"`).join(', ').slice(0, 45)}...
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleApplyTemplateDirect(tpl.layers, 'append')}
                        className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 transition hover:bg-slate-700 hover:text-white"
                        title="Tambahkan layer template ini tanpa menghapus layer yang ada"
                      >
                        + Tambah
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyTemplateDirect(tpl.layers, 'replace')}
                        className="rounded bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-indigo-500"
                        title="Ganti semua layer aktif dengan template ini"
                      >
                        Terapkan
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Save to Library */}
        {tab === 'save' && (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400">
              Menyimpan <strong className="text-slate-200">{currentLayers.length} layer</strong> teks aktif ke pustaka aplikasi agar dapat langsung dipilih sewaktu-waktu.
            </div>

            <div className="space-y-1.5">
              <label htmlFor="save-tpl-name" className="text-xs text-slate-300">
                Nama Template
              </label>
              <input
                id="save-tpl-name"
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Contoh: Watermark Brand Utama"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="save-tpl-desc" className="text-xs text-slate-300">
                Deskripsi (Opsional)
              </label>
              <input
                id="save-tpl-desc"
                type="text"
                value={templateDesc}
                onChange={(e) => setTemplateDesc(e.target.value)}
                placeholder="Catatan posisi atau penggunaan template..."
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleSaveToApp}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-500 active:scale-95"
              >
                <BookmarkCheck className="h-4 w-4" />
                <span>Simpan ke Pustaka Aplikasi</span>
              </button>

              <button
                type="button"
                onClick={() => saveTemplateAsFile(currentLayers, templateName)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
                title="Unduh langsung sebagai file .JSON eksternal"
              >
                <Download className="h-4 w-4" />
                <span>Unduh .JSON</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Import/Export External JSON */}
        {tab === 'import' && (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border-2 border-dashed border-slate-700 p-6 text-center hover:border-slate-500 transition">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
                id="template-json-upload"
              />
              <label
                htmlFor="template-json-upload"
                className="flex cursor-pointer flex-col items-center justify-center gap-2"
              >
                <Upload className="h-8 w-8 text-indigo-400 animate-bounce" />
                <span className="text-xs font-medium text-slate-200">
                  Pilih file template eksternal (.json)
                </span>
                <span className="text-[11px] text-slate-500">
                  Klik untuk mencari file template dari komputer
                </span>
              </label>
            </div>

            {importedLayers && (
              <div className="rounded-lg border border-indigo-500/30 bg-indigo-950/40 p-3 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-indigo-300">File berhasil dibaca!</span>
                  <span className="text-indigo-200">{importedLayers.length} Layer terdeteksi</span>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="loadMode"
                      value="replace"
                      checked={loadMode === 'replace'}
                      onChange={() => setLoadMode('replace')}
                      className="accent-indigo-600"
                    />
                    <span>Ganti Semua Layer</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                    <input
                      type="radio"
                      name="loadMode"
                      value="append"
                      checked={loadMode === 'append'}
                      onChange={() => setLoadMode('append')}
                      className="accent-indigo-600"
                    />
                    <span>Tambahkan ke Layer Aktif</span>
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleApplyTemplateDirect(importedLayers, loadMode)}
                    className="flex-1 rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
                  >
                    Terapkan ke Foto Ini
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveImportedToLibrary}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
                    title="Simpan juga file ini ke pustaka template aplikasi"
                  >
                    + Simpan ke Pustaka
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
