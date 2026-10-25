import { Settings } from 'lucide-react'
import type { TextLayer, DimensionReference } from '../../types/layer'
import { useFontStore } from '../../stores/useFontStore'
import { pxToPercent, percentToPx } from '../../utils/unitMath'

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
          fontSize: Math.max(8, calculatedPx),
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
      const clamped = Math.max(0.2, Math.min(50, val))
      onChange({
        style: {
          ...style,
          fontSizePercent: Number(clamped.toFixed(1)),
        },
      })
    } else {
      const clamped = Math.max(8, Math.min(300, val))
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
        id="layer-text-input"
        value={layer.text}
        onChange={(e) => onChange({ text: e.target.value })}
        rows={3}
        className="w-full resize-none rounded-md border border-slate-700 bg-slate-950 p-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
        placeholder="Ketik teks di sini..."
      />

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
                step={unit === '%' ? 0.2 : 1}
                min={unit === '%' ? 0.2 : 8}
                max={unit === '%' ? 50 : 300}
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
          min={unit === '%' ? 0.5 : 8}
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
