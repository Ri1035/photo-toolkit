import { decodeImage, detectFormat, encodeImage, optimisePng, mimeOf } from './codecs'
import { encodeWithTarget, type CompressOutcome } from './compress'
import { computeTargetSize, resizeImage } from './resize'
import { patchJpegDpi } from './dpi-jpeg'
import { patchPngDpi } from './dpi-png'
import { compressGif, compressGifToTarget, resizeGif } from './gif'
import { FORMAT_MIME, type ProcessMeta, type TaskSpec } from './types'

export interface ProcessOutput {
  buffer: ArrayBuffer
  mime: string
  meta: ProcessMeta
}

function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer
}

/** 末端 DPI 补丁（仅 jpeg/png） */
function applyDpi(u8: Uint8Array, format: string, dpi?: number): Uint8Array {
  if (!dpi) return u8
  if (format === 'jpeg') return patchJpegDpi(u8, dpi)
  if (format === 'png') return patchPngDpi(u8, dpi)
  return u8
}

/**
 * 统一处理入口（纯逻辑，无 DOM 依赖）。
 * 主线程与 Web Worker 调用同一实现，避免行为漂移。
 */
export async function processImage(
  buffer: ArrayBuffer,
  fileName: string,
  fileType: string,
  spec: TaskSpec,
): Promise<ProcessOutput> {
  const inputFormat = detectFormat(fileName, fileType)
  const inputBytes = new Uint8Array(buffer)

  // ── GIF 专用管线 ─────────────────────────────
  if (inputFormat === 'gif' && (spec.mode === 'gif' || spec.mode === 'resize' || spec.mode === 'compress' || spec.mode === 'target-size')) {
    let out: Uint8Array
    let reached = true
    let note: string | undefined
    if (spec.mode === 'resize') {
      out = await resizeGif(inputBytes, spec.resize.width, spec.resize.height, spec.resize.percent)
    } else if (spec.gif.targetBytes && (spec.mode === 'target-size' || spec.mode === 'gif')) {
      const r = await compressGifToTarget(inputBytes, spec.gif.targetBytes)
      out = r.data
      reached = r.reached
      note = r.note
    } else {
      out = await compressGif(inputBytes, spec.gif.lossy)
    }
    return {
      buffer: toArrayBuffer(out),
      mime: 'image/gif',
      meta: { width: 0, height: 0, originalWidth: 0, originalHeight: 0, reached, note, format: 'gif' },
    }
  }

  // ── 独立 DPI 模式：无损字节补丁，不解码像素 ──
  if (spec.mode === 'dpi') {
    const fmt = inputFormat === 'jpeg' || inputFormat === 'png' ? inputFormat : null
    if (!fmt || !spec.dpi) throw new Error('修改 DPI 仅支持 JPG 和 PNG 格式')
    const out = fmt === 'jpeg' ? patchJpegDpi(inputBytes, spec.dpi) : patchPngDpi(inputBytes, spec.dpi)
    return {
      buffer: toArrayBuffer(out),
      mime: FORMAT_MIME[fmt],
      meta: { width: 0, height: 0, originalWidth: 0, originalHeight: 0, reached: true, format: fmt },
    }
  }

  // ── 静态图主流水线：解码 → 缩放 → 编码 → DPI ──
  const image = await decodeImage(buffer, fileType, fileName)
  const originalWidth = image.width
  const originalHeight = image.height

  // 输出格式解析：'original' 保持每张图片的原格式（heic/bmp 等回退 jpeg）
  const outputFormat =
    spec.outputFormat === 'original'
      ? inputFormat === 'png' || inputFormat === 'webp' || inputFormat === 'avif'
        ? inputFormat
        : 'jpeg'
      : spec.outputFormat
  if (outputFormat === 'gif') throw new Error('静态图片不支持输出 GIF，请选择其他格式')

  // 缩放
  let working = image
  const targetSize = computeTargetSize(image.width, image.height, spec.resize)
  if (targetSize && (targetSize.width !== image.width || targetSize.height !== image.height)) {
    working = await resizeImage(image, targetSize.width, targetSize.height)
  }

  // 编码
  let outcome: CompressOutcome
  const encode = (img: ImageData, q: number) => encodeImage(img, outputFormat, q)

  if (spec.compress.kind === 'target') {
    const target = spec.compress.targetBytes
    if (outputFormat === 'png') {
      // PNG 无损：oxipng + 尺寸阶梯，不保证精确
      let current = working
      let data = await optimisePng(current)
      let scale = 1
      let rounds = 0
      while (data.byteLength > target && rounds < 4) {
        const ratio = Math.sqrt((target / data.byteLength) * 0.9)
        const w = Math.max(16, Math.round(current.width * Math.min(0.9, ratio)))
        const h = Math.max(16, Math.round(current.height * Math.min(0.9, ratio)))
        if (w >= current.width) break
        current = await resizeImage(current, w, h)
        scale = current.width / working.width
        data = await optimisePng(current)
        rounds++
      }
      outcome = {
        data,
        reached: data.byteLength <= target,
        scale,
        width: current.width,
        height: current.height,
        note: data.byteLength <= target ? undefined : 'PNG 为无损格式，无法精确控制体积，建议改用 JPG/WebP 输出',
      }
    } else {
      outcome = await encodeWithTarget(working, target, encode, resizeImage)
    }
  } else {
    const q = spec.compress.quality
    const data =
      outputFormat === 'png' ? await optimisePng(working) : await encode(working, q)
    outcome = {
      data,
      reached: true,
      quality: q,
      scale: 1,
      width: working.width,
      height: working.height,
    }
  }

  const finalBytes = applyDpi(outcome.data, outputFormat, spec.dpi)
  return {
    buffer: toArrayBuffer(finalBytes),
    mime: mimeOf(outputFormat),
    meta: {
      width: outcome.width,
      height: outcome.height,
      originalWidth,
      originalHeight,
      reached: outcome.reached,
      note: outcome.note,
      format: outputFormat,
    },
  }
}
