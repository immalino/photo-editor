import { useState, useRef } from 'react'
import { Settings, Sparkles, RotateCw, Hash } from 'lucide-react'
import type { TextLayer, DimensionReference } from '../../types/layer'
import { useFontStore } from '../../stores/useFontStore'
import { pxToPercent, percentToPx } from '../../utils/unitMath'
import { hasDynamicTokens, resolveDynamicText } from '../../utils/dynamicText'

interface ContentPropertyProps {
  layer: TextLayer
  photoWidth?: number
  photoHeight?: number
  onOpenFontManager?: () => void
  onChange: (updates: Partial<TextLayer>) => void
}

export function ContentProperty({
  layer,
  photoWidth = 1920,
  photoHeight = 1080,
  onOpenFontManager,
  onChange,
}: ContentPropertyProps) {
  const { systemFonts, customFonts } = useFontStore()
  const { style } = layer
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [, setPreviewSeed] = useState(0)

  const isDynamic = hasDynamicTokens(layer.text)
  const previewText = isDynamic ? resolveDynamicText(layer.text) : ''

  const handleInsertToken = (token: string) => {
    const textarea = textareaRef.current
    if (!textarea) {
      onChange({ text: (layer.text || '') + token })
      return
    }
    const start = textarea.selectionStart ?? layer.text.length
    const end = textarea.selectionEnd ?? layer.text.length
    const nextText = layer.text.substring(0, start) + token + layer.text.substring(end)
    onChange({ text: nextText })

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + token.length, start + token.length)
    }, 10)
  }

  const handleRerollPreview = () => {
    setPreviewSeed((s) => s + 1)
  }

  const unit = style.fontSizeUnit || 'px'
  const refDim = style.fontSizeRef || 'width'
  const basis = refDim === 'height' ? photoHeight : photoWidth

  // Computed display values
  const currentPct =
    typeof style.fontSizePercent === 'number'
      ? style.fontSizePercent
      : pxToPercent(style.fontSize, basis)

  const handleUnitToggle = (newUnit: 'px' | '%') => {
    if (newUnit === unit) return

    if (newUnit === '%') {
      const calculatedPct = pxToPercent(style.fontSize, basis)
      onChange({
        style: {
          ...style,
          fontSizeUnit: '%',
          fontSizeRef: refDim,
          fontSizePercent: calculatedPct,
        },
      })
    } else {
      const calculatedPx = percentToPx(currentPct, basis)
      onChange({
        style: {
          ...style,
          fontSizeUnit: 'px',
          fontSize: Math.max(1, calculatedPx),
        },
      })
    }
  }

  const handleRefDimChange = (newRef: DimensionReference) => {
    const newBasis = newRef === 'height' ? photoHeight : photoWidth
    // Keep visual size consistent by recomputing percent
    const currentPx = percentToPx(currentPct, basis)
    const recomputedPct = pxToPercent(currentPx, newBasis)

    onChange({
      style: {
        ...style,
        fontSizeRef: newRef,
        fontSizePercent: recomputedPct,
      },
    })
  }

  const handleFontSizeChange = (val: number) => {
    if (unit === '%') {
      const clamped = Math.max(0.05, Math.min(50, val))
      onChange({
        style: {
          ...style,
          fontSizePercent: Number(clamped.toFixed(1)),
        },
      })
    } else {
      const clamped = Math.max(1, Math.min(500, val))
      onChange({
        style: {
          ...style,
          fontSize: clamped,
        },
      })
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
      <div className="flex items-center justify-between">
        <label
          htmlFor="layer-text-input"
          className="text-xs font-semibold uppercase tracking-wider text-slate-400"
        >
          Konten Teks
        </label>
      </div>

      <textarea
        ref={textareaRef}
        id="layer-text-input"
        value={layer.text}
        onChange={(e) => onChange({ text: e.target.value })}
        rows={3}
        className="w-full resize-none rounded-md border border-slate-700 bg-slate-950 p-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
        placeholder="Ketik teks di sini..."
      />

      {/* Dynamic Random Number Insert Helpers */}
      <div className="space-y-1.5 pt-0.5">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1 font-medium text-slate-300">
            <Sparkles className="h-3 w-3 text-indigo-400" />
            <span>Variabel Angka Acak:</span>
          </span>
          <span className="text-[10px] text-slate-500">Acak saat ekspor</span>
        </div>

        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => handleInsertToken('{random:1}')}
            className="rounded border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-indigo-300 hover:bg-slate-700 hover:text-white transition"
            title="1 digit acak (0 s/d 9)"
          >
            + 1 Angka (0-9)
          </button>
          <button
            type="button"
            onClick={() => handleInsertToken('{random:2}')}
            className="rounded border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-indigo-300 hover:bg-slate-700 hover:text-white transition"
            title="2 digit acak dengan padding nol (00 s/d 99)"
          >
            + 2 Angka (00-99)
          </button>
          <button
            type="button"
            onClick={() => handleInsertToken('{random:3}')}
            className="rounded border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-indigo-300 hover:bg-slate-700 hover:text-white transition"
            title="3 digit acak dengan padding nol (000 s/d 999)"
          >
            + 3 Angka (000-999)
          </button>
          <button
            type="button"
            onClick={() => handleInsertToken('{random:4}')}
            className="rounded border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-indigo-300 hover:bg-slate-700 hover:text-white transition"
            title="4 digit acak (0000 s/d 9999)"
          >
            + 4 Angka
          </button>
          <button
            type="button"
            onClick={() => handleInsertToken('{random:100-999}')}
            className="rounded border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition"
            title="Rentang kustom (misal: 100 s/d 999)"
          >
            + Rentang
          </button>
        </div>

        {/* Live Preview of Dynamic Text */}
        {isDynamic && (
          <div className="flex items-center justify-between rounded-md border border-indigo-900/60 bg-indigo-950/40 p-2 text-xs text-indigo-200 animate-fade-in">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <Hash className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <div className="flex flex-col overflow-hidden">
                <span className="text-[10px] font-semibold uppercase text-indigo-400">
                  Pratinjau Ekspor:
                </span>
                <span className="truncate font-mono text-xs text-white" title={previewText}>
                  {previewText}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRerollPreview}
              className="rounded p-1 text-indigo-300 hover:bg-indigo-900/60 hover:text-white transition shrink-0 ml-1"
              title="Acak ulang pratinjau angka"
            >
              <RotateCw className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Font Family Selector & Custom Font Button */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="font-family-select" className="text-xs text-slate-300">
            Font Family
          </label>
          {onOpenFontManager && (
            <button
              type="button"
              onClick={onOpenFontManager}
              className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition"
              title="Kelola Font Kustom (Upload .ttf / .otf)"
            >
              <Settings className="h-3 w-3" />
              <span>+ Kelola Font</span>
            </button>
          )}
        </div>

        <select
          id="font-family-select"
          value={layer.style.fontFamily}
          onChange={(e) =>
            onChange({
              style: { ...layer.style, fontFamily: e.target.value },
            })
          }
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
          style={{ fontFamily: layer.style.fontFamily }}
        >
          {customFonts.length > 0 && (
            <optgroup label="Font Kustom (Diunggah)">
              {customFonts.map((font) => (
                <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                  {font.name}
                </option>
              ))}
            </optgroup>
          )}

          <optgroup label="Font Standar Sistem">
            {systemFonts.map((font) => (
              <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                {font.name}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* Font Size with Dual Unit Support */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span>Ukuran Font</span>

          <div className="flex items-center gap-2">
            {/* Unit Toggle */}
            <div className="flex rounded bg-slate-950 p-0.5 border border-slate-800">
              <button
                type="button"
                onClick={() => handleUnitToggle('px')}
                className={`rounded px-1.5 py-0.2 text-[10px] font-semibold transition ${
                  unit === 'px' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                px
              </button>
              <button
                type="button"
                onClick={() => handleUnitToggle('%')}
                className={`rounded px-1.5 py-0.2 text-[10px] font-semibold transition ${
                  unit === '%' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                %
              </button>
            </div>

            {/* Value Input */}
            <div className="flex items-center gap-1">
              <input
                type="number"
                step={unit === '%' ? 0.1 : 1}
                min={unit === '%' ? 0.05 : 1}
                max={unit === '%' ? 50 : 500}
                value={unit === '%' ? currentPct : style.fontSize}
                onChange={(e) => handleFontSizeChange(Number(e.target.value) || 0)}
                className="w-14 rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-right font-mono text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-slate-500">{unit}</span>
            </div>
          </div>
        </div>

        {/* Dimension Reference Selector when in % mode */}
        {unit === '%' && (
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <span>Acuan Rasio:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleRefDimChange('width')}
                className={`rounded px-1.5 py-0.5 transition ${
                  refDim === 'width'
                    ? 'bg-slate-800 text-indigo-300 font-semibold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Lebar Foto (W)
              </button>
              <span className="text-slate-700">•</span>
              <button
                type="button"
                onClick={() => handleRefDimChange('height')}
                className={`rounded px-1.5 py-0.5 transition ${
                  refDim === 'height'
                    ? 'bg-slate-800 text-indigo-300 font-semibold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Tinggi Foto (H)
              </button>
            </div>
          </div>
        )}

        <input
          type="range"
          min={unit === '%' ? 0.1 : 1}
          max={unit === '%' ? 30 : 200}
          step={unit === '%' ? 0.1 : 1}
          value={unit === '%' ? currentPct : style.fontSize}
          onChange={(e) => handleFontSizeChange(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-indigo-500"
        />
      </div>
    </div>
  )
}
