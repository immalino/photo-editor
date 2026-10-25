import { useState } from 'react'
import { BoxSelect, Link, Unlink, Paintbrush } from 'lucide-react'
import type { TextLayer, LayerSpacing, SizeUnit, DimensionReference } from '../../types/layer'
import { ColorPickerRow } from './ColorPickerRow'
import { pxToPercent, percentToPx } from '../../utils/unitMath'

interface BackgroundPropertyProps {
  layer: TextLayer
  photoWidth?: number
  photoHeight?: number
  onChange: (updates: Partial<TextLayer>) => void
}

const DEFAULT_PADDING: LayerSpacing = {
  unit: 'px',
  ref: 'width',
  uniform: true,
  value: 8,
  top: 8,
  right: 8,
  bottom: 8,
  left: 8,
}

export function BackgroundProperty({
  layer,
  photoWidth = 1920,
  photoHeight = 1080,
  onChange,
}: BackgroundPropertyProps) {
  const bg = layer.style.background

  // Resolved padding configuration
  const paddingConfig: LayerSpacing = layer.style.padding ?? {
    ...DEFAULT_PADDING,
    value: bg.padding ?? 8,
    valuePercent: bg.paddingPercent,
    top: bg.padding ?? 8,
    right: bg.padding ?? 8,
    bottom: bg.padding ?? 8,
    left: bg.padding ?? 8,
    unit: bg.unit ?? 'px',
    ref: bg.ref ?? 'width',
  }

  const [paddingUnlinked, setPaddingUnlinked] = useState(!paddingConfig.uniform)

  const padBasis = paddingConfig.ref === 'height' ? photoHeight : photoWidth
  const currentPadVal =
    paddingConfig.unit === '%'
      ? paddingConfig.valuePercent ?? pxToPercent(paddingConfig.value, padBasis)
      : paddingConfig.value

  const radiusBasis = (bg.ref || 'width') === 'height' ? photoHeight : photoWidth
  const currentRadiusPct =
    typeof bg.borderRadiusPercent === 'number'
      ? bg.borderRadiusPercent
      : pxToPercent(bg.borderRadius, radiusBasis)

  // Update Background properties
  const updateBg = (updates: Partial<typeof bg>) => {
    const nextBg = { ...bg, ...updates }
    onChange({
      style: {
        ...layer.style,
        background: nextBg,
      },
    })
  }

  // Update Padding properties
  const updatePadding = (updates: Partial<LayerSpacing>) => {
    const updated: LayerSpacing = {
      ...paddingConfig,
      ...updates,
    }

    const avgPad = updated.uniform
      ? updated.value
      : Math.round((updated.top + updated.bottom + updated.left + updated.right) / 4)

    onChange({
      style: {
        ...layer.style,
        background: {
          ...layer.style.background,
          padding: avgPad,
          paddingPercent: updated.uniform ? updated.valuePercent : undefined,
          unit: updated.unit,
          ref: updated.ref,
        },
        padding: updated,
      },
    })
  }

  const handlePadUnitToggle = (unit: SizeUnit) => {
    if (unit === paddingConfig.unit) return
    if (unit === '%') {
      const valPct = pxToPercent(paddingConfig.value, padBasis)
      updatePadding({
        unit: '%',
        valuePercent: valPct,
        topPercent: pxToPercent(paddingConfig.top, padBasis),
        rightPercent: pxToPercent(paddingConfig.right, padBasis),
        bottomPercent: pxToPercent(paddingConfig.bottom, padBasis),
        leftPercent: pxToPercent(paddingConfig.left, padBasis),
      })
    } else {
      const valPx = percentToPx(currentPadVal, padBasis)
      updatePadding({
        unit: 'px',
        value: valPx,
        top: percentToPx(paddingConfig.topPercent ?? currentPadVal, padBasis),
        right: percentToPx(paddingConfig.rightPercent ?? currentPadVal, padBasis),
        bottom: percentToPx(paddingConfig.bottomPercent ?? currentPadVal, padBasis),
        left: percentToPx(paddingConfig.leftPercent ?? currentPadVal, padBasis),
      })
    }
  }

  const handlePadRefChange = (ref: DimensionReference) => {
    const newBasis = ref === 'height' ? photoHeight : photoWidth
    const currentPx = percentToPx(currentPadVal, padBasis)
    const recomputedPct = pxToPercent(currentPx, newBasis)
    updatePadding({
      ref,
      valuePercent: recomputedPct,
    })
  }

  const handlePadValueChange = (val: number) => {
    if (paddingConfig.unit === '%') {
      const clamped = Math.max(0, Math.min(25, val))
      updatePadding({
        valuePercent: clamped,
        topPercent: clamped,
        rightPercent: clamped,
        bottomPercent: clamped,
        leftPercent: clamped,
        value: percentToPx(clamped, padBasis),
        top: percentToPx(clamped, padBasis),
        right: percentToPx(clamped, padBasis),
        bottom: percentToPx(clamped, padBasis),
        left: percentToPx(clamped, padBasis),
      })
    } else {
      const clamped = Math.max(0, Math.min(200, val))
      updatePadding({
        value: clamped,
        top: clamped,
        right: clamped,
        bottom: clamped,
        left: clamped,
        valuePercent: pxToPercent(clamped, padBasis),
        topPercent: pxToPercent(clamped, padBasis),
        rightPercent: pxToPercent(clamped, padBasis),
        bottomPercent: pxToPercent(clamped, padBasis),
        leftPercent: pxToPercent(clamped, padBasis),
      })
    }
  }

  const handlePadSideChange = (side: 'top' | 'right' | 'bottom' | 'left', val: number) => {
    if (paddingConfig.unit === '%') {
      const clamped = Math.max(0, Math.min(25, val))
      const keyPct = `${side}Percent` as const
      updatePadding({
        [keyPct]: clamped,
        [side]: percentToPx(clamped, padBasis),
      })
    } else {
      const clamped = Math.max(0, Math.min(200, val))
      const keyPct = `${side}Percent` as const
      updatePadding({
        [side]: clamped,
        [keyPct]: pxToPercent(clamped, padBasis),
      })
    }
  }

  const togglePaddingUniform = () => {
    const nextUnlinked = !paddingUnlinked
    setPaddingUnlinked(nextUnlinked)
    updatePadding({
      uniform: !nextUnlinked,
      ...(nextUnlinked
        ? {}
        : {
            top: paddingConfig.value,
            right: paddingConfig.value,
            bottom: paddingConfig.value,
            left: paddingConfig.value,
            topPercent: paddingConfig.valuePercent,
            rightPercent: paddingConfig.valuePercent,
            bottomPercent: paddingConfig.valuePercent,
            leftPercent: paddingConfig.valuePercent,
          }),
    })
  }

  const getSidePadVal = (side: 'top' | 'right' | 'bottom' | 'left') => {
    if (paddingConfig.unit === '%') {
      const keyPct = `${side}Percent` as const
      return paddingConfig[keyPct] ?? pxToPercent(paddingConfig[side], padBasis)
    }
    return paddingConfig[side]
  }

  return (
    <div className="space-y-3.5 rounded-lg border border-slate-800 bg-slate-900/60 p-3 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <BoxSelect className="h-3.5 w-3.5 text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Kotak & Latar Belakang
          </span>
        </div>

        {/* Padding Unit Selector (px vs %) */}
        <div className="flex items-center gap-1">
          {paddingConfig.unit === '%' && (
            <div className="flex rounded border border-slate-800 bg-slate-950 p-0.5 text-[10px]">
              <button
                type="button"
                onClick={() => handlePadRefChange('width')}
                className={`px-1.5 py-0.5 rounded transition ${
                  paddingConfig.ref === 'width'
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Persentase terhadap Lebar Foto"
              >
                W
              </button>
              <button
                type="button"
                onClick={() => handlePadRefChange('height')}
                className={`px-1.5 py-0.5 rounded transition ${
                  paddingConfig.ref === 'height'
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Persentase terhadap Tinggi Foto"
              >
                H
              </button>
            </div>
          )}

          <div className="flex rounded border border-slate-800 bg-slate-950 p-0.5">
            <button
              type="button"
              onClick={() => handlePadUnitToggle('px')}
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold transition ${
                paddingConfig.unit === 'px'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              px
            </button>
            <button
              type="button"
              onClick={() => handlePadUnitToggle('%')}
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold transition ${
                paddingConfig.unit === '%'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              %
            </button>
          </div>

          <button
            type="button"
            onClick={togglePaddingUniform}
            className={`flex h-6 w-6 items-center justify-center rounded border transition ${
              paddingUnlinked
                ? 'border-indigo-500/50 bg-indigo-950/60 text-indigo-300'
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
            }`}
            title={paddingUnlinked ? 'Mode 4 Sisi Terpisah' : 'Mode Serentak (Semua Sisi Sama)'}
          >
            {paddingUnlinked ? <Unlink className="h-3 w-3" /> : <Link className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Box Model Visual Diagram */}
      <div className="flex justify-center py-0.5">
        <div className="relative w-full max-w-[240px] rounded border border-indigo-500/40 bg-indigo-950/20 px-3 py-2 text-center transition">
          <div className="text-[10px] font-mono font-medium text-indigo-300">
            KOTAK OBJEK {bg.enabled ? '(Latar Aktif)' : '(Transparan)'}
          </div>
          <div className="my-1 rounded border border-dashed border-indigo-400/50 bg-indigo-900/30 py-1 text-[10px] text-indigo-200">
            Padding:{' '}
            {paddingUnlinked
              ? `${getSidePadVal('top')}/${getSidePadVal('right')}/${getSidePadVal('bottom')}/${getSidePadVal('left')}`
              : currentPadVal}{' '}
            {paddingConfig.unit}
            <div className="mx-auto mt-0.5 max-w-[120px] rounded bg-slate-950/70 py-0.5 text-[9px] font-semibold text-slate-300">
              Teks
            </div>
          </div>
        </div>
      </div>

      {/* Padding Controls */}
      {!paddingUnlinked ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="text-slate-400">Padding (Jarak Dalam)</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={paddingConfig.unit === '%' ? 25 : 200}
                step={paddingConfig.unit === '%' ? 0.5 : 1}
                value={currentPadVal}
                onChange={(e) => handlePadValueChange(Number(e.target.value) || 0)}
                className="w-14 rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-right font-mono text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-slate-500 font-mono text-xs">{paddingConfig.unit}</span>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={paddingConfig.unit === '%' ? 20 : 120}
            step={paddingConfig.unit === '%' ? 0.2 : 1}
            value={currentPadVal}
            onChange={(e) => handlePadValueChange(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-indigo-500"
          />
        </div>
      ) : (
        /* 4 Individual Sides */
        <div className="grid grid-cols-2 gap-2 text-xs">
          {(['top', 'right', 'bottom', 'left'] as const).map((side) => {
            const sideLabel =
              side === 'top' ? 'Atas' : side === 'right' ? 'Kanan' : side === 'bottom' ? 'Bawah' : 'Kiri'
            return (
              <div key={side} className="flex items-center justify-between rounded border border-slate-800 bg-slate-950/70 px-2 py-1">
                <span className="text-[11px] text-slate-400">{sideLabel}</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={paddingConfig.unit === '%' ? 25 : 200}
                    step={paddingConfig.unit === '%' ? 0.5 : 1}
                    value={getSidePadVal(side)}
                    onChange={(e) => handlePadSideChange(side, Number(e.target.value) || 0)}
                    className="w-12 rounded border border-slate-800 bg-slate-900 px-1 py-0.5 text-right font-mono text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">{paddingConfig.unit}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Background Color Toggle Section */}
      <div className="border-t border-slate-800/80 pt-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-slate-300">
            <Paintbrush className="h-3 w-3 text-slate-400" />
            Warna Latar Belakang
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
          <div className="space-y-3 pt-1">
            <ColorPickerRow
              label="Warna Background"
              value={bg.color}
              onChange={(color) => updateBg({ color })}
              showPresets
            />

            {/* Background Opacity */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="text-slate-400">Opasitas Latar</span>
                <span className="font-mono text-slate-300">
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

            {/* Corner Radius */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="text-slate-400">Radius Sudut</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step={paddingConfig.unit === '%' ? 0.2 : 1}
                    min={0}
                    max={paddingConfig.unit === '%' ? 20 : 60}
                    value={paddingConfig.unit === '%' ? currentRadiusPct : bg.borderRadius}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0
                      if (paddingConfig.unit === '%') {
                        updateBg({ borderRadiusPercent: val })
                      } else {
                        updateBg({ borderRadius: Math.max(0, Math.min(60, val)) })
                      }
                    }}
                    className="w-14 rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-right font-mono text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-slate-500 font-mono text-xs">{paddingConfig.unit}</span>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={paddingConfig.unit === '%' ? 15 : 50}
                step={paddingConfig.unit === '%' ? 0.1 : 1}
                value={paddingConfig.unit === '%' ? currentRadiusPct : bg.borderRadius}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  if (paddingConfig.unit === '%') {
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
    </div>
  )
}
