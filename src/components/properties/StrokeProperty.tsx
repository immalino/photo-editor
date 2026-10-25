import type { TextLayer, DimensionReference } from '../../types/layer'
import { ColorPickerRow } from './ColorPickerRow'
import { pxToPercent } from '../../utils/unitMath'

interface StrokePropertyProps {
  layer: TextLayer
  photoWidth?: number
  photoHeight?: number
  onChange: (updates: Partial<TextLayer>) => void
}

export function StrokeProperty({
  layer,
  photoWidth = 1920,
  photoHeight = 1080,
  onChange,
}: StrokePropertyProps) {
  const stroke = layer.style.stroke
  const unit = stroke.unit || 'px'
  const refDim = stroke.ref || 'width'
  const basis = refDim === 'height' ? photoHeight : photoWidth

  const updateStroke = (updates: Partial<typeof stroke>) => {
    onChange({
      style: {
        ...layer.style,
        stroke: { ...stroke, ...updates },
      },
    })
  }

  const handleUnitToggle = (newUnit: 'px' | '%') => {
    if (newUnit === unit) return
    if (newUnit === '%') {
      updateStroke({
        unit: '%',
        ref: refDim,
        widthPercent: pxToPercent(stroke.width, basis),
      })
    } else {
      updateStroke({ unit: 'px' })
    }
  }

  const handleRefDimChange = (newRef: DimensionReference) => {
    updateStroke({ ref: newRef })
  }

  const currentWidthPct =
    typeof stroke.widthPercent === 'number'
      ? stroke.widthPercent
      : pxToPercent(stroke.width, basis)

  return (
    <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Outline / Stroke
        </span>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={stroke.enabled}
            onChange={(e) => updateStroke({ enabled: e.target.checked })}
            className="peer sr-only"
          />
          <div className="h-5 w-9 rounded-full bg-slate-700 peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all"></div>
        </label>
      </div>

      {stroke.enabled && (
        <div className="space-y-3 border-t border-slate-800/80 pt-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Satuan Ketebalan:</span>
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
            label="Warna Stroke"
            value={stroke.color}
            onChange={(color) => updateStroke({ color })}
            showPresets
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Ketebalan</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step={unit === '%' ? 0.1 : 1}
                  min={unit === '%' ? 0.05 : 1}
                  max={unit === '%' ? 10 : 50}
                  value={unit === '%' ? currentWidthPct : stroke.width}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0
                    if (unit === '%') {
                      updateStroke({ widthPercent: val })
                    } else {
                      updateStroke({ width: Math.max(1, Math.min(50, val)) })
                    }
                  }}
                  className="w-14 rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-right font-mono text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                />
                <span className="text-slate-500">{unit}</span>
              </div>
            </div>
            <input
              type="range"
              min={unit === '%' ? 0.1 : 1}
              max={unit === '%' ? 5 : 30}
              step={unit === '%' ? 0.05 : 1}
              value={unit === '%' ? currentWidthPct : stroke.width}
              onChange={(e) => {
                const val = Number(e.target.value)
                if (unit === '%') {
                  updateStroke({ widthPercent: val })
                } else {
                  updateStroke({ width: val })
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
