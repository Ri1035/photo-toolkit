import type { PanelProps } from './common'

/** AI 抠图 / 背景替换 */
export function RemoveBgPanel({ settings, onChange }: PanelProps) {
  const replace = settings.rbAction === 'replace'
  return (
    <div className="panel">
      <div className="field">
        <span className="field-label">处理方式</span>
        <div className="preset-row">
          <button
            className={`preset-chip${!replace ? ' active' : ''}`}
            onClick={() => onChange({ rbAction: 'cutout' })}
          >
            自动抠图（透明背景）
          </button>
          <button
            className={`preset-chip${replace ? ' active' : ''}`}
            onClick={() => onChange({ rbAction: 'replace' })}
          >
            背景替换
          </button>
        </div>
      </div>

      {replace && (
        <>
          <div className="field">
            <span className="field-label">背景类型</span>
            <div className="preset-row">
              <button
                className={`preset-chip${settings.rbBgType === 'color' ? ' active' : ''}`}
                onClick={() => onChange({ rbBgType: 'color' })}
              >
                纯色
              </button>
              <button
                className={`preset-chip${settings.rbBgType === 'gradient' ? ' active' : ''}`}
                onClick={() => onChange({ rbBgType: 'gradient' })}
              >
                渐变
              </button>
            </div>
          </div>

          {settings.rbBgType === 'color' ? (
            <div className="field">
              <span className="field-label">背景颜色</span>
              <input
                className="glass-input"
                style={{ width: 60, padding: 4 }}
                type="color"
                value={settings.rbColor}
                onChange={(e) => onChange({ rbColor: e.target.value })}
              />
            </div>
          ) : (
            <>
              <div className="field">
                <span className="field-label">渐变起点</span>
                <input
                  className="glass-input"
                  style={{ width: 60, padding: 4 }}
                  type="color"
                  value={settings.rbGradient1}
                  onChange={(e) => onChange({ rbGradient1: e.target.value })}
                />
              </div>
              <div className="field">
                <span className="field-label">渐变终点</span>
                <input
                  className="glass-input"
                  style={{ width: 60, padding: 4 }}
                  type="color"
                  value={settings.rbGradient2}
                  onChange={(e) => onChange({ rbGradient2: e.target.value })}
                />
              </div>
              <div className="field">
                <span className="field-label">渐变方向</span>
                <div className="preset-row">
                  <button
                    className={`preset-chip${settings.rbDirection === 'vertical' ? ' active' : ''}`}
                    onClick={() => onChange({ rbDirection: 'vertical' })}
                  >
                    上下
                  </button>
                  <button
                    className={`preset-chip${settings.rbDirection === 'horizontal' ? ' active' : ''}`}
                    onClick={() => onChange({ rbDirection: 'horizontal' })}
                  >
                    左右
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      <div className="field">
        <span className="field-note">
          基于 @imgly/background-removal（AGPL-3.0），WASM + ONNX 在浏览器本地推理。首次使用需下载
          ~40MB 模型（之后走浏览器缓存），图片始终不上传。
        </span>
      </div>
    </div>
  )
}
