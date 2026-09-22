import type { ModeId } from '../core/types'

const MODES: { id: ModeId; label: string }[] = [
  { id: 'compress', label: '图片压缩' },
  { id: 'target-size', label: '指定大小' },
  { id: 'convert', label: '格式转换' },
  { id: 'resize', label: '修改尺寸' },
  { id: 'dpi', label: '修改 DPI' },
  { id: 'gif', label: 'GIF 压缩' },
]

interface Props {
  mode: ModeId
  onChange: (mode: ModeId) => void
}

export function ModeTabs({ mode, onChange }: Props) {
  return (
    <div className="mode-tabs">
      {MODES.map((m) => (
        <button
          key={m.id}
          className={`mode-tab${mode === m.id ? ' active' : ''}`}
          onClick={() => onChange(m.id)}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
