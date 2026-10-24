import type { TextLayer } from '../../types/layer'
import { WINDOWS_STANDARD_FONTS } from '../../constants/fonts'

interface ContentPropertyProps {
  layer: TextLayer
  onChange: (updates: Partial<TextLayer>) => void
}

export function ContentProperty({ layer, onChange }: ContentPropertyProps) {
  return (
    <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
      <div className="flex items-center justify-between">
        <label htmlFor="layer-text-input" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Konten Teks
        </label>
      </div>

      <textarea
        id="layer-text-input"
        value={layer.text}
        onChange={(e) => onChange({ text: e.target.value })}
        rows={3}
        className="w-full resize-none rounded-md border border-slate-700 bg-slate-950 p-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
        placeholder="Ketik teks di sini..."
      />

      <div className="space-y-1.5">
        <label htmlFor="font-family-select" className="text-xs text-slate-300">
          Font Family
        </label>
        <select
          id="font-family-select"
          value={layer.style.fontFamily}
          onChange={(e) =>
            onChange({
              style: { ...layer.style, fontFamily: e.target.value },
            })
          }
          className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
          style={{ fontFamily: layer.style.fontFamily }}
        >
          {WINDOWS_STANDARD_FONTS.map((font) => (
            <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
              {font.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span>Ukuran Font</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={8}
              max={256}
              value={layer.style.fontSize}
              onChange={(e) => {
                const val = Math.max(8, Math.min(256, Number(e.target.value) || 8))
                onChange({ style: { ...layer.style, fontSize: val } })
              }}
              className="w-14 rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-right font-mono text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
            />
            <span className="text-slate-500">px</span>
          </div>
        </div>
        <input
          type="range"
          min={8}
          max={200}
          value={layer.style.fontSize}
          onChange={(e) =>
            onChange({
              style: { ...layer.style, fontSize: Number(e.target.value) },
            })
          }
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-blue-500"
        />
      </div>
    </div>
  )
}
