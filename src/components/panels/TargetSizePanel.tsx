import { DpiOption, FormatSelect, SizeInput, type PanelProps } from './common'

/** 压缩到指定 KB / MB */
export function TargetSizePanel({ settings, onChange }: PanelProps) {
  return (
    <div className="panel">
      <div className="field">
        <span className="field-label">目标大小</span>
        <SizeInput
          value={settings.targetValue}
          unit={settings.targetUnit}
          onValue={(targetValue) => onChange({ targetValue })}
          onUnit={(targetUnit) => onChange({ targetUnit })}
        />
        <span className="field-note">
          自动调节质量与尺寸逼近目标；PNG 为无损格式无法精确控制，建议输出 JPG/WebP
        </span>
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
