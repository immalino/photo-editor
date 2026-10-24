import { useState, useEffect, type ChangeEvent } from 'react'
import { normalizeHex, isValidHex, PRESET_COLORS } from '../../utils/colorUtils'

interface ColorPickerRowProps {
  label: string
  value: string
  onChange: (hex: string) => void
  showPresets?: boolean
}

export function ColorPickerRow({
  label,
  value,
  onChange,
  showPresets = false,
}: ColorPickerRowProps) {
  const [localHex, setLocalHex] = useState(value)

  useEffect(() => {
    setLocalHex(value)
  }, [value])

  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setLocalHex(val)
    if (isValidHex(val)) {
      onChange(normalizeHex(val))
    }
  }

  const handleBlur = () => {
    if (isValidHex(localHex)) {
      const normalized = normalizeHex(localHex)
      setLocalHex(normalized)
      onChange(normalized)
    } else {
      setLocalHex(value)
    }
  }

  // Ensure 6-character hex for color input
  const pickerValue = isValidHex(value) ? normalizeHex(value) : '#ffffff'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-slate-300">
        <span>{label}</span>
        <div className="flex items-center gap-2">
          <div className="relative h-6 w-6 overflow-hidden rounded border border-slate-600 shadow-sm">
            <input
              type="color"
              value={pickerValue}
              onChange={(e) => {
                setLocalHex(e.target.value)
                onChange(e.target.value)
              }}
              className="absolute -top-2 -left-2 h-10 w-10 cursor-pointer border-0 bg-transparent p-0"
              title={label}
            />
          </div>
          <input
            type="text"
            value={localHex}
            onChange={handleTextChange}
            onBlur={handleBlur}
            maxLength={7}
            className="w-20 rounded border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-200 uppercase focus:border-blue-500 focus:outline-none"
            placeholder="#FFFFFF"
          />
        </div>
      </div>

      {showPresets && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => {
                setLocalHex(color)
                onChange(color)
              }}
              style={{ backgroundColor: color }}
              title={color}
              className={`h-4 w-4 rounded-full border transition-transform hover:scale-110 ${
                normalizeHex(value) === normalizeHex(color)
                  ? 'border-white ring-2 ring-blue-500 ring-offset-1 ring-offset-slate-900'
                  : 'border-slate-700'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
