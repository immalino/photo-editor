import { Bold, Italic, AlignLeft, AlignCenter, AlignRight, RotateCw } from 'lucide-react'
import type { TextLayer, TextAlign } from '../../types/layer'
import { ColorPickerRow } from './ColorPickerRow'

interface TypographyPropertyProps {
  layer: TextLayer
  onChange: (updates: Partial<TextLayer>) => void
}

export function TypographyProperty({ layer, onChange }: TypographyPropertyProps) {
  const { style } = layer

  const updateStyle = (styleUpdates: Partial<typeof layer.style>) => {
    onChange({ style: { ...style, ...styleUpdates } })
  }

  const handleAlignChange = (align: TextAlign) => {
    updateStyle({ align })
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        Tipografi & Warna
      </span>

      {/* Formatting & Alignment Toolbar */}
      <div className="flex items-center gap-1.5 border-b border-slate-800/80 pb-2.5">
        <button
          type="button"
          onClick={() => updateStyle({ bold: !style.bold })}
          className={`flex h-8 w-8 items-center justify-center rounded border transition-colors ${
            style.bold
              ? 'border-blue-500 bg-blue-600/30 text-blue-300'
              : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700'
          }`}
          title="Tebal (Bold)"
        >
          <Bold className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => updateStyle({ italic: !style.italic })}
          className={`flex h-8 w-8 items-center justify-center rounded border transition-colors ${
            style.italic
              ? 'border-blue-500 bg-blue-600/30 text-blue-300'
              : 'border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700'
          }`}
          title="Miring (Italic)"
        >
          <Italic className="h-4 w-4" />
        </button>

        <div className="h-5 w-px bg-slate-700 mx-1" />

        <div className="flex items-center rounded border border-slate-700 bg-slate-800/80 p-0.5">
          {(['left', 'center', 'right'] as const).map((align) => (
            <button
              key={align}
              type="button"
              onClick={() => handleAlignChange(align)}
              className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
                style.align === align
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={`Rata ${align === 'left' ? 'Kiri' : align === 'center' ? 'Tengah' : 'Kanan'}`}
            >
              {align === 'left' && <AlignLeft className="h-3.5 w-3.5" />}
              {align === 'center' && <AlignCenter className="h-3.5 w-3.5" />}
              {align === 'right' && <AlignRight className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      </div>

      {/* Text Color Picker */}
      <ColorPickerRow
        label="Warna Teks"
        value={style.fill}
        onChange={(fill) => updateStyle({ fill })}
        showPresets
      />

      {/* Opacity Slider */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span>Opasitas Teks</span>
          <span className="font-mono text-slate-400">
            {Math.round(style.opacity * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={style.opacity}
          onChange={(e) => updateStyle({ opacity: Number(e.target.value) })}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-blue-500"
        />
      </div>

      {/* Rotation Slider */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center gap-1.5">
            <RotateCw className="h-3 w-3 text-slate-400" />
            Rotasi
          </span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={-180}
              max={180}
              value={layer.rotation}
              onChange={(e) => onChange({ rotation: Number(e.target.value) || 0 })}
              className="w-14 rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-right font-mono text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
            />
            <span className="text-slate-500">°</span>
          </div>
        </div>
        <input
          type="range"
          min={-180}
          max={180}
          value={layer.rotation}
          onChange={(e) => onChange({ rotation: Number(e.target.value) })}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-blue-500"
        />
      </div>
    </div>
  )
}
