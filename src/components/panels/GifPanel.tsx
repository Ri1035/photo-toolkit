import { SizeInput, type PanelProps } from './common'

/** GIF 动图压缩 */
export function GifPanel({ settings, onChange }: PanelProps) {
  const s = settings
  return (
    <div className="panel">
      <div className="field">
        <span className="field-label">压缩方式</span>
        <div className="preset-row">
          <button
            className={`preset-chip${s.gifMode === 'lossy' ? ' active' : ''}`}
            onClick={() => onChange({ gifMode: 'lossy' })}
          >
            按压缩强度
          </button>
          <button
            className={`preset-chip${s.gifMode === 'target' ? ' active' : ''}`}
            onClick={() => onChange({ gifMode: 'target' })}
          >
            指定大小
          </button>
        </div>
      </div>

      {s.gifMode === 'lossy' ? (
        <div className="field">
          <span className="field-label">压缩强度</span>
          <div className="input-row">
            <input
              className="glass-range"
              type="range"
              min={1}
              max={200}
              value={s.gifLossy}
              onChange={(e) => onChange({ gifLossy: Number(e.target.value) })}
            />
            <span className="range-value">{s.gifLossy}</span>
          </div>
          <span className="field-note">推荐 30–80，数值越大体积越小、画质越低</span>
        </div>
      ) : (
        <div className="field">
          <span className="field-label">目标大小</span>
          <SizeInput
            value={s.gifTargetValue}
            unit={s.gifTargetUnit}
            onValue={(gifTargetValue) => onChange({ gifTargetValue })}
            onUnit={(gifTargetUnit) => onChange({ gifTargetUnit })}
          />
          <span className="field-note">自动调节强度与尺寸逼近目标；帧数与循环保持不变</span>
        </div>
      )}
    </div>
  )
}
