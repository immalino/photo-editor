import type { TextLayer, DimensionReference } from '../../types/layer'
import { ColorPickerRow } from './ColorPickerRow'
import { pxToPercent } from '../../utils/unitMath'

interface BackgroundPropertyProps {
  layer: TextLayer
  photoWidth?: number
  photoHeight?: number
  onChange: (updates: Partial<TextLayer>) => void
}

export function BackgroundProperty({
  layer,
  photoWidth = 1920,
  photoHeight = 1080,
  onChange,
}: BackgroundPropertyProps) {
  const bg = layer.style.background
  const unit = bg.unit || 'px'
  const refDim = bg.ref || 'width'
  const basis = refDim === 'height' ? photoHeight : photoWidth

  const updateBg = (updates: Partial<typeof bg>) => {
    onChange({
      style: {
        ...layer.style,
        background: { ...bg, ...updates },
      },
    })
  }

  const handleUnitToggle = (newUnit: 'px' | '%') => {
    if (newUnit === unit) return
    if (newUnit === '%') {
      updateBg({
        unit: '%',
        ref: refDim,
        paddingPercent: pxToPercent(bg.padding, basis),
        borderRadiusPercent: pxToPercent(bg.borderRadius, basis),
      })
    } else {
      updateBg({ unit: 'px' })
    }
  }

  const handleRefDimChange = (newRef: DimensionReference) => {
    updateBg({ ref: newRef })
  }

  const currentPaddingPct =
    typeof bg.paddingPercent === 'number'
      ? bg.paddingPercent
      : pxToPercent(bg.padding, basis)

  const currentRadiusPct =
    typeof bg.borderRadiusPercent === 'number'
      ? bg.borderRadiusPercent
      : pxToPercent(bg.borderRadius, basis)

  return (
    <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Background Kotak
        </span>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={bg.enabled}
            onChange={(e) => updateBg({ enabled: e.target.checked })}
            className="peer sr-only"
          />
          <div className="h-5 w-9 rounded-full bg-slate-700 peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all"></div>
        </label>
      </div>

      {bg.enabled && (
        <div className="space-y-3 border-t border-slate-800/80 pt-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Satuan Dimensi:</span>
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
          </div>

          {unit === '%' && (
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Acuan Rasio:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleRefDimChange('width')}
                  className={`rounded px-1.5 py-0.5 text-[10px] transition ${
                    refDim === 'width'
                      ? 'bg-slate-800 text-indigo-300 font-semibold'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Lebar (W)
                </button>
                <span className="text-slate-700">•</span>
                <button
                  type="button"
                  onClick={() => handleRefDimChange('height')}
                  className={`rounded px-1.5 py-0.5 text-[10px] transition ${
                    refDim === 'height'
                      ? 'bg-slate-800 text-indigo-300 font-semibold'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Tinggi (H)
                </button>
              </div>
            </div>
          )}

          <ColorPickerRow
            label="Warna Background"
            value={bg.color}
            onChange={(color) => updateBg({ color })}
            showPresets
          />

          {/* Background Opacity */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Opasitas Background</span>
              <span className="font-mono text-slate-400">
                {Math.round(bg.opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={bg.opacity}
              onChange={(e) => updateBg({ opacity: Number(e.target.value) })}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-indigo-500"
            />
          </div>

          {/* Padding */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Padding</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step={unit === '%' ? 0.2 : 1}
                  min={0}
                  max={unit === '%' ? 20 : 100}
                  value={unit === '%' ? currentPaddingPct : bg.padding}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0
                    if (unit === '%') {
                      updateBg({ paddingPercent: val })
                    } else {
                      updateBg({ padding: Math.max(0, Math.min(100, val)) })
                    }
                  }}
                  className="w-14 rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-right font-mono text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
                <span className="text-slate-500">{unit}</span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={unit === '%' ? 10 : 60}
              step={unit === '%' ? 0.1 : 1}
              value={unit === '%' ? currentPaddingPct : bg.padding}
              onChange={(e) => {
                const val = Number(e.target.value)
                if (unit === '%') {
                  updateBg({ paddingPercent: val })
                } else {
                  updateBg({ padding: val })
                }
              }}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-indigo-500"
            />
          </div>

          {/* Border Radius */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Radius Sudut</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step={unit === '%' ? 0.2 : 1}
                  min={0}
                  max={unit === '%' ? 20 : 50}
                  value={unit === '%' ? currentRadiusPct : bg.borderRadius}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0
                    if (unit === '%') {
                      updateBg({ borderRadiusPercent: val })
                    } else {
                      updateBg({ borderRadius: Math.max(0, Math.min(50, val)) })
                    }
                  }}
                  className="w-14 rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-right font-mono text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
                <span className="text-slate-500">{unit}</span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={unit === '%' ? 10 : 40}
              step={unit === '%' ? 0.1 : 1}
              value={unit === '%' ? currentRadiusPct : bg.borderRadius}
              onChange={(e) => {
                const val = Number(e.target.value)
                if (unit === '%') {
                  updateBg({ borderRadiusPercent: val })
                } else {
                  updateBg({ borderRadius: val })
                }
              }}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-indigo-500"
            />
          </div>
        </div>
      )}
    </div>
  )
}
