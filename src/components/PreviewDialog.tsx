import { useEffect, useRef, useState } from 'react'
import { saveBlob } from '../utils/download'
import { formatBytes } from '../utils/format'
import type { TaskItem } from '../store/useTaskStore'

interface Props {
  task: TaskItem
  onClose: () => void
}

type CompareMode = 'after' | 'before' | 'split'
type Zoom = 'fit' | 'actual'

/** 处理好的图片大图预览：原图/处理后对比 + 缩放 + 下载 */
export function PreviewDialog({ task, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [compare, setCompare] = useState<CompareMode>('after')
  const [zoom, setZoom] = useState<Zoom>('fit')
  const r = task.result

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  // dialog 打开期间锁定背景滚动
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const hasBefore = Boolean(task.previewUrl)
  // 宽高比发生变化时（如拉伸改尺寸），左右对比会错位，故隐藏该选项
  const aspectChanged =
    r && r.meta.originalWidth > 0 && r.meta.originalHeight > 0 && r.meta.width > 0
      ? Math.abs(r.meta.originalWidth / r.meta.originalHeight - r.meta.width / r.meta.height) >
        0.01
      : false
  const canSplit = hasBefore && Boolean(r?.url) && !aspectChanged
  const canCompare = hasBefore && Boolean(r?.url)

  return (
    <dialog
      ref={ref}
      className="preview-dialog"
      onClose={onClose}
      onClick={(e) => {
        // 点击遮罩区域关闭
        if (e.target === ref.current) onClose()
      }}
    >
      <div className="preview-header">
        <div className="preview-title">
          <span className="preview-name">{task.name}</span>
          {r && (
            <span className="preview-meta">
              {r.meta.format.toUpperCase()} · {r.meta.width}×{r.meta.height} · {formatBytes(r.size)}
            </span>
          )}
        </div>
        <div className="preview-controls">
          {canCompare && (
            <div className="compare-tabs" role="tablist" aria-label="预览对比">
              <button
                className={`compare-tab${compare === 'after' ? ' active' : ''}`}
                onClick={() => setCompare('after')}
              >
                处理后
              </button>
              <button
                className={`compare-tab${compare === 'before' ? ' active' : ''}`}
                onClick={() => setCompare('before')}
              >
                原图
              </button>
              {canSplit && (
                <button
                  className={`compare-tab${compare === 'split' ? ' active' : ''}`}
                  onClick={() => setCompare('split')}
                >
                  左右对比
                </button>
              )}
            </div>
          )}
          {r?.url && (
            <div className="compare-tabs" role="group" aria-label="缩放">
              <button
                className={`compare-tab${zoom === 'fit' ? ' active' : ''}`}
                onClick={() => setZoom('fit')}
              >
                适应
              </button>
              <button
                className={`compare-tab${zoom === 'actual' ? ' active' : ''}`}
                onClick={() => setZoom('actual')}
              >
                100%
              </button>
            </div>
          )}
          {r && (
            <button className="preview-btn" onClick={() => saveBlob(r.blob, r.outName)}>
              ⬇ 下载
            </button>
          )}
          <button className="preview-btn ghost" onClick={onClose}>
            ✕ 关闭
          </button>
        </div>
      </div>

      <div className={`preview-stage${zoom === 'actual' ? ' actual' : ''}`}>
        {r?.url ? (
          compare === 'split' && task.previewUrl ? (
            <SplitView beforeSrc={task.previewUrl} afterSrc={r.url} name={task.name} />
          ) : (
            <img
              className="preview-img"
              src={compare === 'before' && task.previewUrl ? task.previewUrl : r.url}
              alt={task.name}
            />
          )
        ) : task.previewUrl ? (
          <img className="preview-img" src={task.previewUrl} alt={task.name} />
        ) : (
          <div className="preview-empty">
            <span className="preview-empty-icon">🖼️</span>
            <p>该图片格式无法在浏览器内预览</p>
            {r && (
              <button className="glossy-btn" onClick={() => saveBlob(r.blob, r.outName)}>
                下载文件
              </button>
            )}
          </div>
        )}
      </div>

      <span className="preview-hint">
        {zoom === 'actual' ? '已按原始像素显示，可滚动查看 · ' : ''}
        点击弹窗外或按 ESC 关闭
      </span>
    </dialog>
  )
}

/** 左右对比：原图裁切左半 + 处理后右半，中缝分割线 */
function SplitView({
  beforeSrc,
  afterSrc,
  name,
}: {
  beforeSrc: string
  afterSrc: string
  name: string
}) {
  return (
    <div className="compare-handle">
      <img className="preview-img" src={afterSrc} alt={`${name} 处理后`} />
      <div className="compare-before">
        <img className="preview-img" src={beforeSrc} alt={`${name} 原图`} />
      </div>
      <span className="split-line" />
      <span className="split-label left">原图</span>
      <span className="split-label right">处理后</span>
    </div>
  )
}