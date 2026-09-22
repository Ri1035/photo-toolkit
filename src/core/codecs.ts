import { decode as decodeJpeg, encode as encodeJpeg } from '@jsquash/jpeg'
import { decode as decodePng, encode as encodePng } from '@jsquash/png'
import { decode as decodeWebp, encode as encodeWebp } from '@jsquash/webp'
import { optimise as oxipngOptimise } from '@jsquash/oxipng'
import { FORMAT_MIME, type FormatId } from './types'
import { isHeicFile, heicToJpegBlob } from './heic'

/** 从文件名/MIME 推断格式 */
export function detectFormat(name: string, mime: string): FormatId | 'heic' | 'unknown' {
  if (isHeicFile(name, mime)) return 'heic'
  const ext = name.toLowerCase().split('.').pop() ?? ''
  if (['jpg', 'jpeg', 'jpe', 'jfif'].includes(ext) || mime === 'image/jpeg') return 'jpeg'
  if (ext === 'png' || mime === 'image/png') return 'png'
  if (ext === 'webp' || mime === 'image/webp') return 'webp'
  if (ext === 'avif' || mime === 'image/avif') return 'avif'
  if (ext === 'gif' || mime === 'image/gif') return 'gif'
  if (ext === 'bmp' || mime === 'image/bmp') return 'unknown' // 走原生解码回退
  return 'unknown'
}

/** 编码为指定格式（quality 1-100，PNG 忽略 quality） */
export async function encodeImage(
  image: ImageData,
  format: FormatId,
  quality: number,
): Promise<Uint8Array> {
  switch (format) {
    case 'jpeg':
      return new Uint8Array(await encodeJpeg(flattenAlpha(image), { quality }))
    case 'png':
      return new Uint8Array(await encodePng(image))
    case 'webp':
      return new Uint8Array(await encodeWebp(image, { quality }))
    case 'avif': {
      const { encode } = await import('@jsquash/avif')
      return new Uint8Array(await encode(image, { quality }))
    }
    case 'gif':
      throw new Error('GIF 请走 gifsicle 管线')
  }
}

/** PNG 无损优化（oxipng），失败时回退原编码 */
export async function optimisePng(image: ImageData): Promise<Uint8Array> {
  try {
    const png = await encodePng(image)
    const out = await oxipngOptimise(new Uint8Array(png).buffer as ArrayBuffer, { level: 2 })
    return new Uint8Array(out)
  } catch {
    return new Uint8Array(await encodePng(image))
  }
}

/** 浏览器原生解码（自动处理 EXIF 方向），经 OffscreenCanvas 转 ImageData */
async function decodeNative(blob: Blob): Promise<ImageData> {
  const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' })
  try {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('无法创建 2D 上下文')
    ctx.drawImage(bitmap, 0, 0)
    return ctx.getImageData(0, 0, bitmap.width, bitmap.height)
  } finally {
    bitmap.close()
  }
}

/** jSquash 解码回退（浏览器不支持的格式，或原生解码失败时） */
async function decodeJsquash(buffer: ArrayBuffer, format: FormatId): Promise<ImageData> {
  switch (format) {
    case 'jpeg':
      return decodeJpeg(buffer)
    case 'png':
      return decodePng(buffer)
    case 'webp':
      return decodeWebp(buffer)
    case 'avif': {
      const { decode } = await import('@jsquash/avif')
      const img = await decode(buffer)
      if (!img) throw new Error('AVIF 解码失败')
      return img
    }
    default:
      throw new Error(`不支持解码的格式: ${format}`)
  }
}

/** 统一解码入口：HEIC 预转 → 原生解码优先 → jSquash 回退 */
export async function decodeImage(
  buffer: ArrayBuffer,
  mime: string,
  name: string,
): Promise<ImageData> {
  let blob = new Blob([buffer], { type: mime || 'application/octet-stream' })
  let format = detectFormat(name, mime)

  if (format === 'heic') {
    blob = await heicToJpegBlob(blob)
    format = 'jpeg'
  }

  if (format !== 'gif') {
    try {
      return await decodeNative(blob)
    } catch {
      // 原生解码失败（如 Safari 解 AVIF），回退 jSquash
    }
  }
  if (format === 'unknown' || format === 'gif') {
    throw new Error('当前浏览器无法解码该图片格式')
  }
  const buf = await blob.arrayBuffer()
  return decodeJsquash(buf, format)
}

/** 透明像素填白底（PNG/WebP/AVIF → JPEG 时） */
export function flattenAlpha(image: ImageData): ImageData {
  const { data, width, height } = image
  let hasAlpha = false
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) {
      hasAlpha = true
      break
    }
  }
  if (!hasAlpha) return image
  const out = new ImageData(width, height)
  const d = out.data
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3] / 255
    d[i] = Math.round(data[i] * a + 255 * (1 - a))
    d[i + 1] = Math.round(data[i + 1] * a + 255 * (1 - a))
    d[i + 2] = Math.round(data[i + 2] * a + 255 * (1 - a))
    d[i + 3] = 255
  }
  return out
}

export function mimeOf(format: FormatId): string {
  return FORMAT_MIME[format]
}
