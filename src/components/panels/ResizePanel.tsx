import { DpiOption, FormatSelect, type PanelProps } from './common'

/** 修改宽高 px / 分辨率（百分比） */
export function ResizePanel({ settings, onChange }: PanelProps) {
  const s = settings
  return (
    <div className="panel">
      <div className="field">
        <span className="field-label">缩放方式</span>
        <div className="preset-row">
          <button
            className={`preset-chip${s.resizeMode === 'percent' ? ' active' : ''}`}
            onClick={() => onChange({ resizeMode: 'percent' })}
          >
            按百分比
          </button>
          <button
            className={`preset-chip${s.resizeMode === 'px' ? ' active' : ''}`}
            onClick={() => onChange({ resizeMode: 'px' })}
          >
            按像素
          </button>
        </div>
      </div>

      {s.resizeMode === 'percent' ? (
        <div className="field">
          <span className="field-label">缩放比例</span>
          <div className="input-row">
            <input
              className="glass-range"
              type="range"
              min={1}
              max={200}
              value={s.percent}
              onChange={(e) => onChange({ percent: Number(e.target.value) })}
            />
            <span className="range-value">{s.percent}%</span>
          </div>
        </div>
      ) : (
        <>
          <div className="field">
            <span className="field-label">宽度 px</span>
            <input
              className="glass-input"
              type="number"
              min={1}
              placeholder="自动"
              value={s.width ?? ''}
              onChange={(e) =>
                onChange({ width: e.target.value ? Math.max(1, Number(e.target.value)) : undefined })
              }
            />
          </div>
          <div className="field">
            <span className="field-label">高度 px</span>
            <input
              className="glass-input"
              type="number"
              min={1}
              placeholder="自动"
              value={s.height ?? ''}
              onChange={(e) =>
                onChange({ height: e.target.value ? Math.max(1, Number(e.target.value)) : undefined })
              }
            />
          </div>
          <div className="field">
            <label className="check-row">
              <input
                type="checkbox"
                checked={s.keepRatio}
                onChange={(e) => onChange({ keepRatio: e.target.checked })}
              />
              锁定宽高比（仅填一边时按比例推算）
            </label>
          </div>
        </>
      )}

      <div className="field">
        <span className="field-label">输出格式</span>
        <FormatSelect value={s.outputFormat} onChange={(outputFormat) => onChange({ outputFormat })} />
      </div>
      <DpiOption settings={s} onChange={onChange} />
    </div>
  )
}
