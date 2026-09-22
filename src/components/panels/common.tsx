import type { FormatId } from '../../core/types'
import type { UiSettings } from '../ui-settings'

export interface PanelProps {
  settings: UiSettings
  onChange: (patch: Partial<UiSettings>) => void
}

const FORMAT_OPTIONS: { value: FormatId | 'original'; label: string }[] = [
  { value: 'original', label: '保持原格式' },
  { value: 'jpeg', label: 'JPG' },
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WebP' },
  { value: 'avif', label: 'AVIF' },
]

export function FormatSelect({
  value,
  onChange,
  allowOriginal = true,
}: {
  value: FormatId | 'original'
  onChange: (v: FormatId | 'original') => void
  allowOriginal?: boolean
}) {
  return (
    <select
      className="glass-select"
      value={value}
      onChange={(e) => onChange(e.target.value as FormatId | 'original')}
    >
      {FORMAT_OPTIONS.filter((o) => allowOriginal || o.value !== 'original').map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function QualitySlider({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="input-row">
      <input
        className="glass-range"
        type="range"
        min={1}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="range-value">{value}</span>
    </div>
  )
}

export function SizeInput({
  value,
  unit,
  onValue,
  onUnit,
}: {
  value: number
  unit: 'KB' | 'MB'
  onValue: (v: number) => void
  onUnit: (u: 'KB' | 'MB') => void
}) {
  return (
    <div className="input-row">
      <input
        className="glass-input"
        type="number"
        min={1}
        value={value}
        onChange={(e) => onValue(Math.max(1, Number(e.target.value) || 1))}
      />
      <select
        className="glass-select"
        value={unit}
        onChange={(e) => onUnit(e.target.value as 'KB' | 'MB')}
      >
        <option value="KB">KB</option>
        <option value="MB">MB</option>
      </select>
    </div>
  )
}

/** DPI 附带选项（压缩/转换/尺寸模式共用） */
export function DpiOption({ settings, onChange }: PanelProps) {
  return (
    <div className="field">
      <label className="check-row">
        <input
          type="checkbox"
          checked={settings.dpiEnabled}
          onChange={(e) => onChange({ dpiEnabled: e.target.checked })}
        />
        同时修改 DPI
      </label>
      {settings.dpiEnabled && (
        <div className="input-row">
          <input
            className="glass-input"
            type="number"
            min={1}
            max={1200}
            value={settings.dpi}
            onChange={(e) => onChange({ dpi: Math.max(1, Number(e.target.value) || 72) })}
          />
          <span className="input-suffix">仅 JPG/PNG 生效</span>
        </div>
      )}
    </div>
  )
}
