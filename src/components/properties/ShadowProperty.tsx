import type { TextLayer } from '../../types/layer'
import { ColorPickerRow } from './ColorPickerRow'

interface ShadowPropertyProps {
  layer: TextLayer
  onChange: (updates: Partial<TextLayer>) => void
}

export function ShadowProperty({ layer, onChange }: ShadowPropertyProps) {
  const shadow = layer.style.shadow

  const updateShadow = (updates: Partial<typeof shadow>) => {
    onChange({
      style: {
        ...layer.style,
        shadow: { ...shadow, ...updates },
      },
    })
  }

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
          <div className="h-5 w-9 rounded-full bg-slate-700 peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all"></div>
        </label>
      </div>

      {shadow.enabled && (
        <div className="space-y-3 border-t border-slate-800/80 pt-2.5">
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
              <span className="font-mono text-slate-400">{shadow.blur}px</span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              value={shadow.blur}
              onChange={(e) => updateShadow({ blur: Number(e.target.value) })}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-blue-500"
            />
          </div>

          {/* Offset X Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Offset X</span>
              <span className="font-mono text-slate-400">{shadow.offsetX}px</span>
            </div>
            <input
              type="range"
              min={-50}
              max={50}
              value={shadow.offsetX}
              onChange={(e) => updateShadow({ offsetX: Number(e.target.value) })}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-blue-500"
            />
          </div>

          {/* Offset Y Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Offset Y</span>
              <span className="font-mono text-slate-400">{shadow.offsetY}px</span>
            </div>
            <input
              type="range"
              min={-50}
              max={50}
              value={shadow.offsetY}
              onChange={(e) => updateShadow({ offsetY: Number(e.target.value) })}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  )
}
