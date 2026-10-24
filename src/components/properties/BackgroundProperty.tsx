import type { TextLayer } from '../../types/layer'
import { ColorPickerRow } from './ColorPickerRow'

interface BackgroundPropertyProps {
  layer: TextLayer
  onChange: (updates: Partial<TextLayer>) => void
}

export function BackgroundProperty({ layer, onChange }: BackgroundPropertyProps) {
  const bg = layer.style.background

  const updateBg = (updates: Partial<typeof bg>) => {
    onChange({
      style: {
        ...layer.style,
        background: { ...bg, ...updates },
      },
    })
  }

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
          <div className="h-5 w-9 rounded-full bg-slate-700 peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all"></div>
        </label>
      </div>

      {bg.enabled && (
        <div className="space-y-3 border-t border-slate-800/80 pt-2.5">
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
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-blue-500"
            />
          </div>

          {/* Padding */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Padding</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={bg.padding}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(100, Number(e.target.value) || 0))
                    updateBg({ padding: val })
                  }}
                  className="w-14 rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-right font-mono text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                />
                <span className="text-slate-500">px</span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              value={bg.padding}
              onChange={(e) => updateBg({ padding: Number(e.target.value) })}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-blue-500"
            />
          </div>

          {/* Border Radius */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Radius Sudut</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={bg.borderRadius}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(100, Number(e.target.value) || 0))
                    updateBg({ borderRadius: val })
                  }}
                  className="w-14 rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-right font-mono text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                />
                <span className="text-slate-500">px</span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              value={bg.borderRadius}
              onChange={(e) => updateBg({ borderRadius: Number(e.target.value) })}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  )
}
