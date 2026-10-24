import type { TextLayer } from '../../types/layer'
import { ColorPickerRow } from './ColorPickerRow'

interface StrokePropertyProps {
  layer: TextLayer
  onChange: (updates: Partial<TextLayer>) => void
}

export function StrokeProperty({ layer, onChange }: StrokePropertyProps) {
  const stroke = layer.style.stroke

  const updateStroke = (updates: Partial<typeof stroke>) => {
    onChange({
      style: {
        ...layer.style,
        stroke: { ...stroke, ...updates },
      },
    })
  }

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
          <div className="h-5 w-9 rounded-full bg-slate-700 peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all"></div>
        </label>
      </div>

      {stroke.enabled && (
        <div className="space-y-3 border-t border-slate-800/80 pt-2.5">
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
                  min={1}
                  max={50}
                  value={stroke.width}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(50, Number(e.target.value) || 1))
                    updateStroke({ width: val })
                  }}
                  className="w-14 rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-right font-mono text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                />
                <span className="text-slate-500">px</span>
              </div>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              value={stroke.width}
              onChange={(e) => updateStroke({ width: Number(e.target.value) })}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  )
}
