import { describe, expect, it } from 'vitest'
import { cropImage } from '../core/crop'

function makeImage(width: number, height: number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      // 用 R 通道编码像素位置便于断言
      data[i] = x
      data[i + 1] = y
      data[i + 2] = 0
      data[i + 3] = 255
    }
  }
  return new ImageData(data, width, height)
}

describe('cropImage', () => {
  it('裁剪中间区域：尺寸与像素正确', () => {
    const img = makeImage(10, 8)
    const out = cropImage(img, 2, 2, 4, 4)
    expect(out.width).toBe(4)
    expect(out.height).toBe(4)
    // 左上角应为原图 (2,2)
    expect(out.data[0]).toBe(2)
    expect(out.data[1]).toBe(2)
  })

  it('越界区域自动收敛到图片范围', () => {
    const img = makeImage(10, 8)
    const out = cropImage(img, 8, 6, 10, 10)
    expect(out.width).toBe(2)
    expect(out.height).toBe(2)
    expect(out.data[0]).toBe(8)
    expect(out.data[1]).toBe(6)
  })

  it('负坐标收敛到 0', () => {
    const img = makeImage(10, 8)
    const out = cropImage(img, -5, -5, 3, 3)
    expect(out.width).toBe(3)
    expect(out.height).toBe(3)
    expect(out.data[0]).toBe(0)
    expect(out.data[1]).toBe(0)
  })

  it('最小裁剪尺寸为 1x1', () => {
    const img = makeImage(10, 8)
    const out = cropImage(img, 5, 4, 0, 0)
    expect(out.width).toBe(1)
    expect(out.height).toBe(1)
  })
})
