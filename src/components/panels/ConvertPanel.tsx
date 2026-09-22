import { DpiOption, FormatSelect, QualitySlider, type PanelProps } from './common'

/** 格式转换 */
export function ConvertPanel({ settings, onChange }: PanelProps) {
  return (
    <div className="panel">
      <div className="field">
        <span className="field-label">转换为</span>
        <FormatSelect
          value={settings.outputFormat === 'original' ? 'webp' : settings.outputFormat}
          onChange={(outputFormat) => onChange({ outputFormat })}
          allowOriginal={false}
        />
        <span className="field-note">透明 PNG/WebP 转 JPG 时自动填充白色背景</span>
      </div>
      <div className="field">
        <span className="field-label">画质</span>
        <QualitySlider value={settings.quality} onChange={(quality) => onChange({ quality })} />
      </div>
      <DpiOption settings={settings} onChange={onChange} />
    </div>
  )
}
