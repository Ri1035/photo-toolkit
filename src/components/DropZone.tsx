import { useRef, useState, type DragEvent } from 'react'
import type { ModeId } from '../core/types'

const ACCEPT_STATIC = '.jpg,.jpeg,.jpe,.jfif,.png,.webp,.avif,.gif,.bmp,.heic,.heif'

interface Props {
  mode: ModeId
  onFiles: (files: File[]) => void
  onReject: (message: string) => void
}

const MODE_HINT: Record<ModeId, string> = {
  compress: '支持 JPG / PNG / WebP / AVIF / GIF / BMP / HEIC，最多 100 张',
  'target-size': '支持 JPG / PNG / WebP / AVIF / GIF / BMP / HEIC，最多 100 张',
  convert: '支持 JPG / PNG / WebP / AVIF / GIF / BMP / HEIC，最多 100 张',
  resize: '支持 JPG / PNG / WebP / AVIF / GIF / BMP / HEIC，最多 100 张',
  dpi: '修改 DPI 仅支持 JPG / PNG（无损处理，不重压缩）',
  gif: 'GIF 压缩仅支持 GIF 动图',
}

export function DropZone({ mode, onFiles, onReject }: Props) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const accept = mode === 'gif' ? '.gif' : mode === 'dpi' ? '.jpg,.jpeg,.png' : ACCEPT_STATIC

  const filterFiles = (list: FileList | File[]): File[] => {
    const files = Array.from(list)
    if (mode === 'gif') {
      const ok = files.filter((f) => /\.gif$/i.test(f.name) || f.type === 'image/gif')
      if (ok.length < files.length) onReject('GIF 压缩模式仅接受 GIF 文件，其余已忽略')
      return ok
    }
    if (mode === 'dpi') {
      const ok = files.filter((f) => /\.(jpe?g|png)$/i.test(f.name) || /image\/(jpeg|png)/.test(f.type))
      if (ok.length < files.length) onReject('修改 DPI 仅支持 JPG / PNG，其余已忽略')
      return ok
    }
    return files
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const files = filterFiles(e.dataTransfer.files)
    if (files.length) onFiles(files)
  }

  return (
    <div
      className={`dropzone${dragging ? ' dragging' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <div className="dropzone-icon">💧</div>
      <div className="dropzone-title">将图片文件拖拽至此处，或点击选择图片</div>
      <div className="dropzone-hint">
        {MODE_HINT[mode]}
        <br />
        所有处理均在本地浏览器完成，图片不上传、不联网
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        hidden
        onChange={(e) => {
          const files = e.target.files ? filterFiles(e.target.files) : []
          if (files.length) onFiles(files)
          e.target.value = ''
        }}
      />
    </div>
  )
}
