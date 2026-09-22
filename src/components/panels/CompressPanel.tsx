import { DpiOption, FormatSelect, QualitySlider, type PanelProps } from './common'

/** 图片压缩：质量滑杆 + 输出格式 */
export function CompressPanel({ settings, onChange }: PanelProps) {
  return (
    <div className="panel">
      <div className="field">
        <span className="field-label">压缩质量</span>
        <QualitySlider value={settings.quality} onChange={(quality) => onChange({ quality })} />
        <span className="field-note">数值越小体积越小（PNG 为无损压缩，忽略质量）</span>
      </div>
      <div className="field">
        <span className="field-label">输出格式</span>
        <FormatSelect
          value={settings.outputFormat}
          onChange={(outputFormat) => onChange({ outputFormat })}
        />
      </div>
      <DpiOption settings={settings} onChange={onChange} />
    </div>
  )
}
