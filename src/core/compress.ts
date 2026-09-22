/**
 * 指定大小压缩引擎：质量二分搜索 + 尺寸阶梯降级。
 * encode/resize 以依赖注入方式传入，纯逻辑可在 Node（vitest）中测试。
 */

export interface CompressOutcome {
  data: Uint8Array
  /** 是否达到目标大小 */
  reached: boolean
  /** 最终质量（有损编码） */
  quality?: number
  /** 相对原图的最终缩放比例 */
  scale: number
  width: number
  height: number
  note?: string
}

export type EncodeFn = (image: ImageData, quality: number) => Promise<Uint8Array>
export type ResizeFn = (image: ImageData, width: number, height: number) => Promise<ImageData>

interface BinaryResult {
  best: Uint8Array | null
  smallest: Uint8Array
  bestQuality: number | null
}

/** 质量二分：7 次迭代收敛，记录达标的最高质量与见过的最小结果 */
export async function binarySearchQuality(
  image: ImageData,
  targetBytes: number,
  encode: EncodeFn,
  maxIterations = 7,
): Promise<BinaryResult> {
  let lo = 1
  let hi = 100
  let best: Uint8Array | null = null
  let bestQuality: number | null = null
  let smallest: Uint8Array | null = null

  for (let i = 0; i < maxIterations && lo <= hi; i++) {
    const mid = (lo + hi) >> 1
    const buf = await encode(image, mid)
    if (!smallest || buf.byteLength < smallest.byteLength) smallest = buf
    if (buf.byteLength <= targetBytes) {
      best = buf
      bestQuality = mid
      lo = mid + 1 // 已达标题高质量更优
    } else {
      hi = mid - 1
    }
  }
  return { best, smallest: smallest!, bestQuality }
}

/**
 * 压缩到目标字节数。
 * 质量二分不达标时按 sqrt(target/current) 缩小尺寸重试，最多 maxRounds 轮。
 */
export async function encodeWithTarget(
  image: ImageData,
  targetBytes: number,
  encode: EncodeFn,
  resize: ResizeFn,
  maxRounds = 5,
): Promise<CompressOutcome> {
  let current = image
  let scale = 1
  let lastSmallest: Uint8Array | null = null
  let lastQuality: number | undefined

  for (let round = 0; round < maxRounds; round++) {
    const { best, smallest, bestQuality } = await binarySearchQuality(current, targetBytes, encode)
    lastSmallest = smallest
    lastQuality = bestQuality ?? undefined
    if (best) {
      return {
        data: best,
        reached: true,
        quality: bestQuality ?? undefined,
        scale,
        width: current.width,
        height: current.height,
      }
    }
    // 质量触底仍超标 → 尺寸阶梯降级
    const ratio = Math.sqrt((targetBytes / smallest.byteLength) * 0.9)
    const nextScale = Math.min(0.9, ratio) // 至少缩 10%，避免无效迭代
    const w = Math.max(16, Math.round(current.width * nextScale))
    const h = Math.max(16, Math.round(current.height * nextScale))
    if (w >= current.width && h >= current.height) break // 无法再缩
    current = await resize(current, w, h)
    scale = current.width / image.width
  }

  return {
    data: lastSmallest!,
    reached: false,
    quality: lastQuality,
    scale,
    width: current.width,
    height: current.height,
    note: '无法压到指定大小，已输出可做到的最小体积',
  }
}

/** 固定质量编码 */
export async function encodeWithQuality(
  image: ImageData,
  quality: number,
  encode: EncodeFn,
): Promise<Uint8Array> {
  return encode(image, quality)
}
