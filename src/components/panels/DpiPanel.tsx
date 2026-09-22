import type { PanelProps } from './common'

const PRESETS = [72, 96, 150, 300, 600]

/** 修改 DPI（无损字节补丁，不重压缩） */
export function DpiPanel({ settings, onChange }: PanelProps) {
  return (
    <div className="panel">
      <div className="field">
        <span className="field-label">DPI 预设</span>
        <div className="preset-row">
          {PRESETS.map((d) => (
            <button
              key={d}
              className={`preset-chip${settings.dpi === d ? ' active' : ''}`}
              onClick={() => onChange({ dpi: d })}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span className="field-label">自定义 DPI</span>
        <div className="input-row">
          <input
            className="glass-input"
            type="number"
            min={1}
            max={1200}
            value={settings.dpi}
            onChange={(e) => onChange({ dpi: Math.max(1, Number(e.target.value) || 72) })}
          />
          <span className="input-suffix">DPI</span>
        </div>
        <span className="field-note">
          仅支持 JPG / PNG；直接修改文件元数据，不重新压缩、零画质损失
        </span>
      </div>
    </div>
  )
}
