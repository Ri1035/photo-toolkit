import type { FilterSpec } from './types'

/** 应用 CSS filter（亮度/对比度/饱和度/模糊），需经过一次绘制（Worker 兼容） */
export function applyFilter(image: ImageData, spec: FilterSpec): ImageData {
  const { width, height } = image

  const src = new OffscreenCanvas(width, height)
  const srcCtx = src.getContext('2d')
  if (!srcCtx) throw new Error('无法创建 2D 上下文')
  srcCtx.putImageData(image, 0, 0)

  const parts: string[] = []
  if (spec.brightness !== 1) parts.push(`brightness(${spec.brightness})`)
  if (spec.contrast !== 1) parts.push(`contrast(${spec.contrast})`)
  if (spec.saturation !== 1) parts.push(`saturate(${spec.saturation})`)
  if (spec.blur > 0) parts.push(`blur(${spec.blur}px)`)
  const filter = parts.join(' ')
  if (!filter) return image

  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建 2D 上下文')
  ctx.filter = filter
  ctx.drawImage(src, 0, 0)
  return ctx.getImageData(0, 0, width, height)
}
