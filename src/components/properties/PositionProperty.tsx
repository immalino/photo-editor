import { useState } from 'react'
import {
  Move,
  RotateCw,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignEndHorizontal,
  Crosshair,
} from 'lucide-react'
import type { TextLayer } from '../../types/layer'
import type { PhotoItem } from '../../types/photo'
import { getPresetAlignmentPosition, type AlignmentPreset } from '../../utils/snapEngine'

interface PositionPropertyProps {
  layer: TextLayer
  photo?: PhotoItem
  onChange: (updates: Partial<TextLayer>) => void
}

export function PositionProperty({ layer, photo, onChange }: PositionPropertyProps) {
  const [unit, setUnit] = useState<'px' | '%'>('%')

  const photoWidth = photo?.originalWidth || 1920
  const photoHeight = photo?.originalHeight || 1080

  // Computed values
  const currentXPct = Number((layer.relativeX * 100).toFixed(1))
  const currentYPct = Number((layer.relativeY * 100).toFixed(1))
  const currentXPx = Math.round(layer.relativeX * photoWidth)
  const currentYPx = Math.round(layer.relativeY * photoHeight)

  const handleXChange = (val: number) => {
    if (unit === '%') {
      const clamped = Math.max(0, Math.min(100, val))
      onChange({ relativeX: Number((clamped / 100).toFixed(4)) })
    } else {
      const clamped = Math.max(0, Math.min(photoWidth, val))
      onChange({ relativeX: Number((clamped / photoWidth).toFixed(4)) })
    }
  }

  const handleYChange = (val: number) => {
    if (unit === '%') {
      const clamped = Math.max(0, Math.min(100, val))
      onChange({ relativeY: Number((clamped / 100).toFixed(4)) })
    } else {
      const clamped = Math.max(0, Math.min(photoHeight, val))
      onChange({ relativeY: Number((clamped / photoHeight).toFixed(4)) })
    }
  }

  const applyPreset = (preset: AlignmentPreset, safeMarginRatio = 0.05) => {
    const pos = getPresetAlignmentPosition(layer, photoWidth, photoHeight, preset, safeMarginRatio)
    onChange(pos)
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Move className="h-3.5 w-3.5" />
          Posisi & Penataan
        </span>

        {/* Unit Selector (px vs %) */}
        <div className="flex rounded bg-slate-950 p-0.5 border border-slate-800">
          <button
            type="button"
            onClick={() => setUnit('%')}
            className={`rounded px-2 py-0.5 text-[10px] font-semibold transition ${
              unit === '%' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Persentase terhadap dimensi foto (Proporsional untuk Batch)"
          >
            %
          </button>
          <button
            type="button"
            onClick={() => setUnit('px')}
            className={`rounded px-2 py-0.5 text-[10px] font-semibold transition ${
              unit === 'px' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Pixel absolut dari resolusi asli foto"
          >
            px
          </button>
        </div>
      </div>

      {/* Position X & Y Inputs */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span>Posisi X</span>
            <span className="text-[10px] text-slate-500">
              {unit === '%' ? `${currentXPx}px` : `${currentXPct}%`}
            </span>
          </div>
          <div className="flex items-center rounded border border-slate-700 bg-slate-950 px-2 py-1 focus-within:border-indigo-500">
            <span className="text-slate-500 font-mono mr-1">X:</span>
            <input
              type="number"
              step={unit === '%' ? 0.5 : 1}
              value={unit === '%' ? currentXPct : currentXPx}
              onChange={(e) => handleXChange(Number(e.target.value) || 0)}
              className="w-full bg-transparent text-right font-mono text-slate-200 outline-none"
            />
            <span className="text-slate-500 ml-1">{unit}</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span>Posisi Y</span>
            <span className="text-[10px] text-slate-500">
              {unit === '%' ? `${currentYPx}px` : `${currentYPct}%`}
            </span>
          </div>
          <div className="flex items-center rounded border border-slate-700 bg-slate-950 px-2 py-1 focus-within:border-indigo-500">
            <span className="text-slate-500 font-mono mr-1">Y:</span>
            <input
              type="number"
              step={unit === '%' ? 0.5 : 1}
              value={unit === '%' ? currentYPct : currentYPx}
              onChange={(e) => handleYChange(Number(e.target.value) || 0)}
              className="w-full bg-transparent text-right font-mono text-slate-200 outline-none"
            />
            <span className="text-slate-500 ml-1">{unit}</span>
          </div>
        </div>
      </div>

      {/* Quick Alignment Presets (3x3 grid & Center snap) */}
      <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Perataan Cepat:</span>
          <button
            type="button"
            onClick={() => applyPreset('center')}
            className="flex items-center gap-1 rounded bg-indigo-600/30 px-2 py-0.5 text-[10px] font-medium text-indigo-300 hover:bg-indigo-600/50 hover:text-white transition"
            title="Snap objek persis ke tengah foto"
          >
            <Crosshair className="h-3 w-3" />
            <span>Tengah Foto</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => applyPreset('top-left')}
            className="flex h-7 items-center justify-center rounded border border-slate-700/60 bg-slate-800/60 text-slate-300 hover:bg-slate-700 hover:text-white transition"
            title="Kiri Atas"
          >
            <AlignStartVertical className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => applyPreset('top-center')}
            className="flex h-7 items-center justify-center rounded border border-slate-700/60 bg-slate-800/60 text-slate-300 hover:bg-slate-700 hover:text-white transition"
            title="Tengah Atas"
          >
            <AlignCenterVertical className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => applyPreset('top-right')}
            className="flex h-7 items-center justify-center rounded border border-slate-700/60 bg-slate-800/60 text-slate-300 hover:bg-slate-700 hover:text-white transition"
            title="Kanan Atas"
          >
            <AlignEndVertical className="h-3 w-3" />
          </button>

          <button
            type="button"
            onClick={() => applyPreset('middle-left')}
            className="flex h-7 items-center justify-center rounded border border-slate-700/60 bg-slate-800/60 text-slate-300 hover:bg-slate-700 hover:text-white transition"
            title="Kiri Tengah"
          >
            <AlignStartHorizontal className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => applyPreset('center')}
            className="flex h-7 items-center justify-center rounded border border-indigo-500/40 bg-indigo-950/40 text-indigo-200 hover:bg-indigo-600 hover:text-white transition"
            title="Tengah Foto (Presisi)"
          >
            <Crosshair className="h-3.5 w-3.5 text-indigo-400" />
          </button>
          <button
            type="button"
            onClick={() => applyPreset('middle-right')}
            className="flex h-7 items-center justify-center rounded border border-slate-700/60 bg-slate-800/60 text-slate-300 hover:bg-slate-700 hover:text-white transition"
            title="Kanan Tengah"
          >
            <AlignEndHorizontal className="h-3 w-3" />
          </button>

          <button
            type="button"
            onClick={() => applyPreset('bottom-left')}
            className="flex h-7 items-center justify-center rounded border border-slate-700/60 bg-slate-800/60 text-slate-300 hover:bg-slate-700 hover:text-white transition"
            title="Kiri Bawah"
          >
            <span className="text-[10px] font-mono">↙</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('bottom-center')}
            className="flex h-7 items-center justify-center rounded border border-slate-700/60 bg-slate-800/60 text-slate-300 hover:bg-slate-700 hover:text-white transition"
            title="Tengah Bawah"
          >
            <span className="text-[10px] font-mono">↓</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset('bottom-right')}
            className="flex h-7 items-center justify-center rounded border border-slate-700/60 bg-slate-800/60 text-slate-300 hover:bg-slate-700 hover:text-white transition"
            title="Kanan Bawah (Watermark)"
          >
            <span className="text-[10px] font-mono">↘</span>
          </button>
        </div>
      </div>

      {/* Rotation */}
      <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
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
              value={layer.rotation || 0}
              onChange={(e) => onChange({ rotation: Number(e.target.value) || 0 })}
              className="w-14 rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-right font-mono text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
            <span className="text-slate-500">°</span>
          </div>
        </div>
        <input
          type="range"
          min={-180}
          max={180}
          value={layer.rotation || 0}
          onChange={(e) => onChange({ rotation: Number(e.target.value) || 0 })}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-indigo-500"
        />
      </div>
    </div>
  )
}

