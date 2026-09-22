import type { PanelProps } from './common'

function Tune({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  const mark = value < 100 ? '调暗' : value > 100 ? '调亮' : '原图'
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="input-row">
        <input
          className="glass-range"
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className="range-value">
          {value}% {value !== 100 && <small style={{ fontWeight: 400 }}>{mark}</small>}
        </span>
      </div>
    </div>
  )
}

/** 图片滤镜：亮度/对比度/饱和度/模糊 */
export function FilterPanel({ settings, onChange }: PanelProps) {
  return (
    <div className="panel">
      <Tune
        label="亮度"
        value={settings.ftBrightness}
        min={50}
        max={150}
        onChange={(ftBrightness) => onChange({ ftBrightness })}
      />
      <Tune
        label="对比度"
        value={settings.ftContrast}
        min={50}
        max={150}
        onChange={(ftContrast) => onChange({ ftContrast })}
      />
      <Tune
        label="饱和度"
        value={settings.ftSaturation}
        min={0}
        max={200}
        onChange={(ftSaturation) => onChange({ ftSaturation })}
      />
      <div className="field">
        <span className="field-label">模糊半径</span>
        <div className="input-row">
          <input
            className="glass-range"
            type="range"
            min={0}
            max={20}
            value={settings.ftBlur}
            onChange={(e) => onChange({ ftBlur: Number(e.target.value) })}
          />
          <span className="range-value">{settings.ftBlur}px</span>
        </div>
      </div>
      <div className="field">
        <span className="field-note">亮度/对比度/饱和度 100% 为原图效果。</span>
      </div>
    </div>
  )
}
