import type { TextLayer, DimensionReference } from '../../types/layer'
import { ColorPickerRow } from './ColorPickerRow'
import { pxToPercent } from '../../utils/unitMath'

interface ShadowPropertyProps {
  layer: TextLayer
  photoWidth?: number
  photoHeight?: number
  onChange: (updates: Partial<TextLayer>) => void
}

export function ShadowProperty({
  layer,
  photoWidth = 1920,
  photoHeight = 1080,
  onChange,
}: ShadowPropertyProps) {
  const shadow = layer.style.shadow
  const unit = shadow.unit || 'px'
  const refDim = shadow.ref || 'width'
  const basis = refDim === 'height' ? photoHeight : photoWidth

  const updateShadow = (updates: Partial<typeof shadow>) => {
    onChange({
      style: {
        ...layer.style,
        shadow: { ...shadow, ...updates },
      },
    })
  }

  const handleUnitToggle = (newUnit: 'px' | '%') => {
    if (newUnit === unit) return
    if (newUnit === '%') {
      updateShadow({
        unit: '%',
        ref: refDim,
        blurPercent: pxToPercent(shadow.blur, basis),
        offsetXPercent: pxToPercent(shadow.offsetX, basis),
        offsetYPercent: pxToPercent(shadow.offsetY, basis),
      })
    } else {
      updateShadow({ unit: 'px' })
    }
  }

  const handleRefDimChange = (newRef: DimensionReference) => {
    updateShadow({ ref: newRef })
  }

  const currentBlurPct =
    typeof shadow.blurPercent === 'number'
      ? shadow.blurPercent
      : pxToPercent(shadow.blur, basis)

  const currentOffXPct =
    typeof shadow.offsetXPercent === 'number'
      ? shadow.offsetXPercent
      : pxToPercent(shadow.offsetX, basis)

  const currentOffYPct =
    typeof shadow.offsetYPercent === 'number'
      ? shadow.offsetYPercent
      : pxToPercent(shadow.offsetY, basis)

  return (
    <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Bayangan (Shadow)
        </span>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={shadow.enabled}
            onChange={(e) => updateShadow({ enabled: e.target.checked })}
            className="peer sr-only"
          />
          <div className="h-5 w-9 rounded-full bg-slate-700 peer-checked:bg-indigo-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all"></div>
        </label>
      </div>

      {shadow.enabled && (
        <div className="space-y-3 border-t border-slate-800/80 pt-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Satuan Parameter:</span>
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
            label="Warna Bayangan"
            value={shadow.color}
            onChange={(color) => updateShadow({ color })}
            showPresets
          />

          {/* Blur Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Blur Radius</span>
              <span className="font-mono text-slate-400">
                {unit === '%' ? `${currentBlurPct}%` : `${shadow.blur}px`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={unit === '%' ? 10 : 50}
              step={unit === '%' ? 0.1 : 1}
              value={unit === '%' ? currentBlurPct : shadow.blur}
              onChange={(e) => {
                const val = Number(e.target.value)
                if (unit === '%') {
                  updateShadow({ blurPercent: val })
                } else {
                  updateShadow({ blur: val })
                }
              }}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-indigo-500"
            />
          </div>

          {/* Offset X Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Offset X</span>
              <span className="font-mono text-slate-400">
                {unit === '%' ? `${currentOffXPct}%` : `${shadow.offsetX}px`}
              </span>
            </div>
            <input
              type="range"
              min={unit === '%' ? -10 : -50}
              max={unit === '%' ? 10 : 50}
              step={unit === '%' ? 0.1 : 1}
              value={unit === '%' ? currentOffXPct : shadow.offsetX}
              onChange={(e) => {
                const val = Number(e.target.value)
                if (unit === '%') {
                  updateShadow({ offsetXPercent: val })
                } else {
                  updateShadow({ offsetX: val })
                }
              }}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-indigo-500"
            />
          </div>

          {/* Offset Y Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Offset Y</span>
              <span className="font-mono text-slate-400">
                {unit === '%' ? `${currentOffYPct}%` : `${shadow.offsetY}px`}
              </span>
            </div>
            <input
              type="range"
              min={unit === '%' ? -10 : -50}
              max={unit === '%' ? 10 : 50}
              step={unit === '%' ? 0.1 : 1}
              value={unit === '%' ? currentOffYPct : shadow.offsetY}
              onChange={(e) => {
                const val = Number(e.target.value)
                if (unit === '%') {
                  updateShadow({ offsetYPercent: val })
                } else {
                  updateShadow({ offsetY: val })
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
