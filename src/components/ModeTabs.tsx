import type { ModeId } from '../core/types'

interface ModeDef {
  id: ModeId
  label: string
}

/** 功能按用途分组，便于用户快速定位 */
const GROUPS: { label: string; modes: ModeDef[] }[] = [
  {
    label: '压缩',
    modes: [
      { id: 'compress', label: '图片压缩' },
      { id: 'target-size', label: '指定大小' },
      { id: 'gif', label: 'GIF 压缩' },
    ],
  },
  {
    label: '尺寸',
    modes: [
      { id: 'resize', label: '修改尺寸' },
      { id: 'dpi', label: '修改 DPI' },
      { id: 'clip', label: '图片裁剪' },
    ],
  },
  {
    label: '格式',
    modes: [
      { id: 'convert', label: '格式转换' },
      { id: 'base64', label: 'Base64' },
    ],
  },
  {
    label: '美化',
    modes: [
      { id: 'watermark', label: '图片水印' },
      { id: 'filter', label: '图片滤镜' },
    ],
  },
  {
    label: 'AI',
    modes: [{ id: 'remove-bg', label: 'AI 抠图' }],
  },
]

interface Props {
  mode: ModeId
  onChange: (mode: ModeId) => void
}

export function ModeTabs({ mode, onChange }: Props) {
  return (
    <nav className="mode-nav" aria-label="图片工具">
      {GROUPS.map((group) => (
        <div key={group.label} className="mode-group">
          <span className="mode-group-label">{group.label}</span>
          <div className="mode-tabs">
            {group.modes.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`mode-tab${mode === m.id ? ' active' : ''}`}
                onClick={() => onChange(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}
