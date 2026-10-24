import { useState, useRef, type ChangeEvent } from 'react'
import { X, Save, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react'
import type { TextLayer } from '../../types/layer'
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
  const [tab, setTab] = useState<'save' | 'load'>('save')
  const [templateName, setTemplateName] = useState<string>('Template Teks')
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false)
  const [importedLayers, setImportedLayers] = useState<TextLayer[] | null>(null)
  const [loadMode, setLoadMode] = useState<'replace' | 'append'>('replace')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleSave = async () => {
    if (currentLayers.length === 0) {
      setErrorMessage('Tidak ada layer teks untuk disimpan sebagai template.')
      return
    }
    setErrorMessage(null)
    const success = await saveTemplateAsFile(currentLayers, templateName)
    if (success) {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
    } else {
      setErrorMessage('Gagal menyimpan file template.')
    }
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

  const handleApply = () => {
    if (!importedLayers || importedLayers.length === 0) return
    onApplyTemplate(importedLayers, loadMode)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          aria-label="Tutup Dialog"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-base font-semibold text-slate-100">Template Layer Teks (JSON)</h3>
        <p className="mt-1 text-xs text-slate-400">
          Simpan susunan gaya teks atau muat template untuk dipakai kembali.
        </p>

        {/* Tab Switcher */}
        <div className="mt-4 flex rounded-lg bg-slate-800/80 p-1">
          <button
            type="button"
            onClick={() => {
              setTab('save')
              setErrorMessage(null)
            }}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${
              tab === 'save'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Simpan Template
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('load')
              setErrorMessage(null)
            }}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${
              tab === 'load'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Muat Template
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/60 p-2.5 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {tab === 'save' ? (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nama Template
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
                placeholder="misal: Watermark Logo & Tanggal"
              />
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-xs text-slate-300">
              <div className="flex justify-between font-medium">
                <span>Jumlah Layer Teks:</span>
                <span className="text-indigo-400">{currentLayers.length} layer</span>
              </div>
              {currentLayers.length > 0 && (
                <ul className="mt-2 max-h-24 overflow-y-auto space-y-1 text-[11px] text-slate-400">
                  {currentLayers.map((l, i) => (
                    <li key={l.id} className="truncate">
                      {i + 1}. "{l.text}" ({l.style.fontFamily})
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={currentLayers.length === 0}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Template Berhasil Disimpan!</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Simpan & Unduh File .json</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-950/40 p-5 text-center transition hover:border-indigo-500 hover:bg-slate-950/70"
            >
              <Upload className="h-6 w-6 text-slate-400 mb-1" />
              <span className="text-xs font-medium text-slate-300">
                Pilih File Template .json
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">
                Klik untuk memilih file dari komputer
              </span>
            </button>

            {importedLayers && (
              <div className="space-y-3">
                <div className="rounded-lg border border-indigo-500/30 bg-indigo-950/30 p-3 text-xs text-slate-200">
                  <div className="flex items-center gap-2 font-medium text-indigo-300">
                    <FileText className="h-4 w-4" />
                    <span>Ditemukan {importedLayers.length} layer teks</span>
                  </div>
                  <ul className="mt-2 max-h-20 overflow-y-auto space-y-1 text-[11px] text-slate-300">
                    {importedLayers.map((l, i) => (
                      <li key={l.id} className="truncate">
                        {i + 1}. "{l.text}"
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="block text-slate-300 font-medium">Metode Terapkan:</label>
                  <div className="flex gap-4 text-slate-300">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="loadMode"
                        checked={loadMode === 'replace'}
                        onChange={() => setLoadMode('replace')}
                        className="text-indigo-600 focus:ring-0"
                      />
                      <span>Gantikan layer saat ini</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="loadMode"
                        checked={loadMode === 'append'}
                        onChange={() => setLoadMode('append')}
                        className="text-indigo-600 focus:ring-0"
                      />
                      <span>Tambahkan ke layer</span>
                    </label>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApply}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-emerald-500 active:scale-95"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Terapkan Template ke Foto</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
