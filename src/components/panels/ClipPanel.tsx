import type { PanelProps } from './common'

const RATIOS: { id: 'free' | '1:1' | '4:3' | '3:4' | '16:9' | '9:16'; label: string; w: number; h: number }[] = [
  { id: 'free', label: '自由', w: 80, h: 80 },
  { id: '1:1', label: '1:1 方形', w: 70, h: 70 },
  { id: '4:3', label: '4:3 横版', w: 80, h: 60 },
  { id: '3:4', label: '3:4 竖版', w: 60, h: 80 },
  { id: '16:9', label: '16:9 宽屏', w: 90, h: 50 },
  { id: '9:16', label: '9:16 手机', w: 50, h: 90 },
]

function Slider({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  suffix: string
  onChange: (v: number) => void
}) {
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
          {value}
          {suffix}
        </span>
      </div>
    </div>
  )
}

/** 图片裁剪：比例预设 + 裁剪区域大小/位置（百分比） */
export function ClipPanel({ settings, onChange }: PanelProps) {
  const pickRatio = (id: (typeof RATIOS)[number]['id']) => {
    const r = RATIOS.find((x) => x.id === id)
    if (!r) return
    onChange({ clipRatio: id, clipW: r.w, clipH: r.h })
  }

  return (
    <div className="panel">
      <div className="field">
        <span className="field-label">裁剪比例</span>
        <div className="preset-row">
          {RATIOS.map((r) => (
            <button
              key={r.id}
              className={`preset-chip${settings.clipRatio === r.id ? ' active' : ''}`}
              onClick={() => pickRatio(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <Slider
        label="裁剪宽度"
        value={settings.clipW}
        min={10}
        max={100}
        suffix="%"
        onChange={(clipW) => onChange({ clipW, clipRatio: 'free' })}
      />
      <Slider
        label="裁剪高度"
        value={settings.clipH}
        min={10}
        max={100}
        suffix="%"
        onChange={(clipH) => onChange({ clipH, clipRatio: 'free' })}
      />
      <Slider
        label="水平位置"
        value={settings.clipX}
        min={0}
        max={100}
        suffix="%"
        onChange={(clipX) => onChange({ clipX })}
      />
      <Slider
        label="垂直位置"
        value={settings.clipY}
        min={0}
        max={100}
        suffix="%"
        onChange={(clipY) => onChange({ clipY })}
      />
      <div className="field">
        <span className="field-note">
          宽高/位置为相对原图的百分比。调整大小后位置超出边界会自动收敛到图片范围内。
        </span>
      </div>
    </div>
  )
}
