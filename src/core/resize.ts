import squooshResize from '@jsquash/resize'
import type { ResizeSpec } from './types'

/** 高质量缩放（lanczos3） */
export async function resizeImage(image: ImageData, width: number, height: number): Promise<ImageData> {
  return squooshResize(image, { width, height, method: 'lanczos3' })
}

/** 按 ResizeSpec 计算目标尺寸；返回 null 表示无需缩放 */
export function computeTargetSize(
  origW: number,
  origH: number,
  spec: ResizeSpec,
): { width: number; height: number } | null {
  if (!spec.enabled) return null

  if (spec.percent !== undefined && spec.percent > 0 && spec.percent !== 100) {
    const p = spec.percent / 100
    return {
      width: Math.max(1, Math.round(origW * p)),
      height: Math.max(1, Math.round(origH * p)),
    }
  }

  const { width, height, keepRatio } = spec
  if (!width && !height) return null

  if (keepRatio) {
    if (width && !height) {
      return { width, height: Math.max(1, Math.round((origH * width) / origW)) }
    }
    if (height && !width) {
      return { width: Math.max(1, Math.round((origW * height) / origH)), height }
    }
  }
  return {
    width: width ?? origW,
    height: height ?? origH,
  }
}
