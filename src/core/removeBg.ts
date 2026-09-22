import type { RemoveBgSpec } from './types'

export interface RemoveBgResult {
  blob: Blob
  mime: string
}

export type BgProgress = (key: string, current: number, total: number) => void

/** 动态加载 @imgly/background-removal（首次使用时才下载 JS） */
async function loadRemoveBg() {
  const mod = await import('@imgly/background-removal')
  return mod.removeBackground
}

/**
 * AI 抠图 / 背景替换。
 * 完全浏览器本地推理（WASM + ONNX），模型从 imgly CDN 加载并缓存，图片不上传。
 * @imgly/background-removal 需要 DOM 环境（onnxruntime 资源加载），故在主线程调用。
 */
export async function removeBackground(
  blob: Blob,
  spec: RemoveBgSpec,
  onProgress?: BgProgress,
): Promise<RemoveBgResult> {
  const removeBg = await loadRemoveBg()
  const cutoutBlob: Blob = await removeBg(blob, {
    model: 'isnet_quint8', // ~40MB 量化模型，速度快、体积小
    progress: onProgress,
  })

  if (spec.action === 'cutout') return { blob: cutoutBlob, mime: 'image/png' }
  return composeBackground(cutoutBlob, spec)
}

/** 抠图结果与纯色/渐变背景合成 */
async function composeBackground(cutout: Blob, spec: RemoveBgSpec): Promise<RemoveBgResult> {
  const bitmap = await createImageBitmap(cutout)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('无法创建 2D 上下文')

    if (spec.bgGradient) {
      const [c1, c2] = spec.bgGradient
      const grad =
        spec.bgDirection === 'horizontal'
          ? ctx.createLinearGradient(0, 0, canvas.width, 0)
          : ctx.createLinearGradient(0, 0, 0, canvas.height)
      grad.addColorStop(0, c1)
      grad.addColorStop(1, c2)
      ctx.fillStyle = grad
    } else {
      ctx.fillStyle = spec.bgColor || '#ffffff'
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0)

    const out = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('背景合成导出失败'))), 'image/png')
    })
    return { blob: out, mime: 'image/png' }
  } finally {
    bitmap.close()
  }
}
