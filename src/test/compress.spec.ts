import { describe, expect, it } from 'vitest'
import { binarySearchQuality, encodeWithTarget } from '../core/compress'

function mockImage(w = 1000, h = 800): ImageData {
  return { width: w, height: h } as ImageData
}

/** size = quality*10 + 1000 的单调编码器 */
const linearEncode = (q: number) => (_img: ImageData, quality: number) =>
  Promise.resolve(new Uint8Array(quality * q / 100 * 10 + 1000))

describe('binarySearchQuality', () => {
  it('单调编码器下收敛到达标最高质量', async () => {
    // size = quality*0.5+1000 → 目标 1600 时 q 最大 100... 用 quality*10/… 简化：
    const encode = (_img: ImageData, quality: number) =>
      Promise.resolve(new Uint8Array(1000 + quality * 10))
    const r = await binarySearchQuality(mockImage(), 1600, encode)
    expect(r.best).not.toBeNull()
    expect(r.best!.byteLength).toBeLessThanOrEqual(1600)
    expect(r.bestQuality).toBe(60)
  })

  it('迭代次数不超过 7 次', async () => {
    let calls = 0
    const encode = (_img: ImageData, quality: number) => {
      calls++
      return Promise.resolve(new Uint8Array(1000 + quality * 10))
    }
    await binarySearchQuality(mockImage(), 1600, encode)
    expect(calls).toBeLessThanOrEqual(7)
  })

  it('完全不可达时返回最小结果', async () => {
    const encode = () => Promise.resolve(new Uint8Array(5000))
    const r = await binarySearchQuality(mockImage(), 100, encode)
    expect(r.best).toBeNull()
    expect(r.smallest.byteLength).toBe(5000)
  })

  it('质量-体积非单调时仍返回已评估过的最小值', async () => {
    const sizes: Record<number, number> = { 1: 3000, 25: 900, 50: 2000, 75: 800, 100: 5000 }
    const encode = (_img: ImageData, quality: number) =>
      Promise.resolve(new Uint8Array(sizes[quality] ?? 4000))
    const r = await binarySearchQuality(mockImage(), 100, encode)
    expect(r.best).toBeNull()
    // 二分只评估 mid 序列（50→25→12→…），800 对应的 q=75 不会被评估；见过最小为 q=25 的 900
    expect(r.smallest.byteLength).toBe(900)
  })
})

describe('encodeWithTarget', () => {
  it('质量二分可达时直接达标，不触发缩放', async () => {
    const encode = linearEncode(60) // size = quality*6 + 1000
    let resized = false
    const resize = (_img: ImageData, w: number, h: number) => {
      resized = true
      return Promise.resolve(mockImage(w, h))
    }
    const r = await encodeWithTarget(mockImage(), 1600, encode, resize)
    expect(r.reached).toBe(true)
    expect(resized).toBe(false)
    expect(r.data.byteLength).toBeLessThanOrEqual(1600)
  })

  it('质量触底仍超标时触发尺寸阶梯并最终兜底', async () => {
    const encode = () => Promise.resolve(new Uint8Array(8000))
    const resize = (_img: ImageData, w: number, h: number) => Promise.resolve(mockImage(w, h))
    const r = await encodeWithTarget(mockImage(), 1000, encode, resize, 3)
    expect(r.reached).toBe(false)
    expect(r.note).toContain('最小体积')
    expect(r.scale).toBeLessThan(1)
    expect(r.data.byteLength).toBe(8000)
  })

  it('缩小尺寸后可达成目标', async () => {
    // 体积与像素数成正比：base = w*h/1000 + quality*2
    const encode = (img: ImageData, quality: number) =>
      Promise.resolve(new Uint8Array(Math.round((img.width * img.height) / 1000) + quality * 2))
    const resize = (_img: ImageData, w: number, h: number) => Promise.resolve(mockImage(w, h))
    const r = await encodeWithTarget(mockImage(4000, 3000), 100 * 1024, encode, resize)
    expect(r.reached).toBe(true)
    expect(r.data.byteLength).toBeLessThanOrEqual(100 * 1024)
  })
})
