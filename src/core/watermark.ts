import type { WatermarkSpec } from './types'

/** 用 OffscreenCanvas 在图片上绘制文字水印（Worker 兼容） */
export function applyWatermark(image: ImageData, spec: WatermarkSpec): ImageData {
  const { width, height } = image
  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建 2D 上下文')

  ctx.putImageData(image, 0, 0)
  ctx.globalAlpha = Math.max(0, Math.min(1, spec.opacity))

  const fontSize = Math.max(10, Math.round(width * spec.sizeRatio))
  const font = `600 ${fontSize}px system-ui, "PingFang SC", "Microsoft YaHei", sans-serif`
  ctx.font = font
  ctx.fillStyle = spec.color
  ctx.textBaseline = 'middle'

  const textWidth = ctx.measureText(spec.text).width
  const textHeight = fontSize
  const margin = Math.round(width * spec.marginRatio)

  let x: number
  let y: number
  switch (spec.position) {
    case 'tl':
      x = margin
      y = margin + textHeight / 2
      break
    case 'tr':
      x = width - margin - textWidth
      y = margin + textHeight / 2
      break
    case 'bl':
      x = margin
      y = height - margin - textHeight / 2
      break
    case 'br':
      x = width - margin - textWidth
      y = height - margin - textHeight / 2
      break
    case 'center':
    default:
      x = (width - textWidth) / 2
      y = height / 2
      break
  }

  ctx.fillText(spec.text, x, y)
  return ctx.getImageData(0, 0, width, height)
}
