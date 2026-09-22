import type { WatermarkPosition } from '../../core/types'
import type { PanelProps } from './common'

const POSITIONS: { id: WatermarkPosition; label: string }[] = [
  { id: 'tl', label: '左上' },
  { id: 'tr', label: '右上' },
  { id: 'bl', label: '左下' },
  { id: 'br', label: '右下' },
  { id: 'center', label: '居中' },
]

/** 文字水印 */
export function WatermarkPanel({ settings, onChange }: PanelProps) {
  return (
    <div className="panel">
      <div className="field">
        <span className="field-label">水印文字</span>
        <input
          className="glass-input"
          style={{ width: 200 }}
          type="text"
          value={settings.wmText}
          onChange={(e) => onChange({ wmText: e.target.value })}
        />
      </div>
      <div className="field">
        <span className="field-label">位置</span>
        <div className="preset-row">
          {POSITIONS.map((p) => (
            <button
              key={p.id}
              className={`preset-chip${settings.wmPosition === p.id ? ' active' : ''}`}
              onClick={() => onChange({ wmPosition: p.id })}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span className="field-label">字号（占图片宽度）</span>
        <div className="input-row">
          <input
            className="glass-range"
            type="range"
            min={1}
            max={20}
            value={settings.wmSizeRatio}
            onChange={(e) => onChange({ wmSizeRatio: Number(e.target.value) })}
          />
          <span className="range-value">{settings.wmSizeRatio}%</span>
        </div>
      </div>
      <div className="field">
        <span className="field-label">透明度</span>
        <div className="input-row">
          <input
            className="glass-range"
            type="range"
            min={5}
            max={100}
            value={settings.wmOpacity}
            onChange={(e) => onChange({ wmOpacity: Number(e.target.value) })}
          />
          <span className="range-value">{settings.wmOpacity}%</span>
        </div>
      </div>
      <div className="field">
        <span className="field-label">文字颜色</span>
        <input
          className="glass-input"
          style={{ width: 60, padding: 4 }}
          type="color"
          value={settings.wmColor}
          onChange={(e) => onChange({ wmColor: e.target.value })}
        />
      </div>
      <div className="field">
        <span className="field-label">边距（占图片宽度）</span>
        <div className="input-row">
          <input
            className="glass-range"
            type="range"
            min={1}
            max={10}
            value={settings.wmMarginRatio}
            onChange={(e) => onChange({ wmMarginRatio: Number(e.target.value) })}
          />
          <span className="range-value">{settings.wmMarginRatio}%</span>
        </div>
      </div>
    </div>
  )
}
