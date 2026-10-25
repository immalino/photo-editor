import { Bold, Italic, AlignLeft, AlignCenter, AlignRight, Type, Space, MoveVertical, RotateCcw } from 'lucide-react'
import type { TextLayer, TextAlign } from '../../types/layer'
import { ColorPickerRow } from './ColorPickerRow'
import { measureLayerBounds } from '../../utils/snapEngine'

interface TypographyPropertyProps {
  layer: TextLayer
  photoWidth?: number
  photoHeight?: number
  onChange: (updates: Partial<TextLayer>) => void
}

export function TypographyProperty({
  layer,
  photoWidth = 1920,
  photoHeight = 1080,
  onChange,
}: TypographyPropertyProps) {
  const { style } = layer

  const updateStyle = (styleUpdates: Partial<typeof layer.style>) => {
    onChange({ style: { ...style, ...styleUpdates } })
  }

  const handleAlignChange = (newAlign: TextAlign) => {
    const oldAlign = style.align || 'left'
    if (newAlign === oldAlign) return

    const pw = photoWidth || 1920
    const ph = photoHeight || 1080
    const { width } = measureLayerBounds(layer, pw, ph)
    const relWidth = width / pw

    // Calculate current visual left in relative coordinates
    let visualLeft = layer.relativeX
    if (oldAlign === 'center') {
      visualLeft = layer.relativeX - relWidth / 2
    } else if (oldAlign === 'right') {
      visualLeft = layer.relativeX - relWidth
    }

    // Determine the new relativeX based on the new alignment anchor
    let newRelativeX = visualLeft
    if (newAlign === 'center') {
      newRelativeX = visualLeft + relWidth / 2
    } else if (newAlign === 'right') {
      newRelativeX = visualLeft + relWidth
    }

    onChange({
      relativeX: Number(Math.max(-0.5, Math.min(1.5, newRelativeX)).toFixed(5)),
      style: {
        ...style,
        align: newAlign,
      },
    })
  }

  const letterSpacing = style.letterSpacing ?? 0
  const lineHeight = style.lineHeight ?? 1.2

  return (
    <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-3 shadow-xs">
      <div className="flex items-center gap-1.5">
        <Type className="h-3.5 w-3.5 text-indigo-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          Tipografi & Format
        </span>
      </div>

      {/* Formatting & Alignment Toolbar */}
      <div className="flex items-center gap-1.5 border-b border-slate-800/80 pb-2.5">
        <button
          type="button"
          onClick={() => updateStyle({ bold: !style.bold })}
          className={`flex h-8 w-8 items-center justify-center rounded border transition-colors ${
            style.bold
              ? 'border-indigo-500 bg-indigo-600/30 text-indigo-300 shadow-xs'
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
              ? 'border-indigo-500 bg-indigo-600/30 text-indigo-300 shadow-xs'
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
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={`Rata ${align === 'left' ? 'Kiri (Anchor Kiri)' : align === 'center' ? 'Tengah (Anchor Simetris)' : 'Kanan (Anchor Kanan)'}`}
            >
              {align === 'left' && <AlignLeft className="h-3.5 w-3.5" />}
              {align === 'center' && <AlignCenter className="h-3.5 w-3.5" />}
              {align === 'right' && <AlignRight className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      </div>

      {/* Letter Spacing (Jarak Huruf) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Space className="h-3 w-3 text-slate-400" />
            Jarak Huruf
          </span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={-5}
              max={40}
              value={letterSpacing}
              onChange={(e) => updateStyle({ letterSpacing: Number(e.target.value) || 0 })}
              className="w-14 rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-right font-mono text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
            <span className="text-[11px] text-slate-500">px</span>
            {letterSpacing !== 0 && (
              <button
                type="button"
                onClick={() => updateStyle({ letterSpacing: 0 })}
                className="text-slate-500 hover:text-slate-300 transition-colors"
                title="Reset jarak huruf ke default (0 px)"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
        <input
          type="range"
          min={-5}
          max={30}
          step={1}
          value={letterSpacing}
          onChange={(e) => updateStyle({ letterSpacing: Number(e.target.value) })}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-indigo-500"
        />
      </div>

      {/* Line Height / Line Spacing (Jarak Baris) */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center gap-1.5 text-slate-400">
            <MoveVertical className="h-3 w-3 text-slate-400" />
            Jarak Baris
          </span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0.5}
              max={3.0}
              step={0.05}
              value={lineHeight}
              onChange={(e) => updateStyle({ lineHeight: Number(e.target.value) || 1.2 })}
              className="w-14 rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-right font-mono text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
            <span className="text-[11px] text-slate-500">×</span>
            {lineHeight !== 1.2 && (
              <button
                type="button"
                onClick={() => updateStyle({ lineHeight: 1.2 })}
                className="text-slate-500 hover:text-slate-300 transition-colors"
                title="Reset jarak baris ke default (1.2×)"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
        <input
          type="range"
          min={0.8}
          max={2.5}
          step={0.05}
          value={lineHeight}
          onChange={(e) => updateStyle({ lineHeight: Number(e.target.value) })}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-indigo-500"
        />
      </div>

      <div className="border-t border-slate-800/80 pt-2.5 space-y-3">
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
            <span className="text-slate-400">Opasitas Teks</span>
            <span className="font-mono text-slate-300">
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
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-indigo-500"
          />
        </div>
      </div>
    </div>
  )
}
