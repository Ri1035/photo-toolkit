import { describe, expect, it } from 'vitest'
import { crc32 } from '../core/crc32'
import { isPng, patchPngDpi, readPngDpi } from '../core/dpi-png'

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

function makeChunk(type: string, data: number[]): number[] {
  const typeBytes = [...type].map((c) => c.charCodeAt(0))
  const len = data.length
  const crc = crc32(new Uint8Array([...typeBytes, ...data]))
  return [
    (len >>> 24) & 0xff, (len >>> 16) & 0xff, (len >>> 8) & 0xff, len & 0xff,
    ...typeBytes,
    ...data,
    (crc >>> 24) & 0xff, (crc >>> 16) & 0xff, (crc >>> 8) & 0xff, crc & 0xff,
  ]
}

/** 构造最小 PNG：签名 + IHDR(13B) + IDAT(1B) + IEND */
function makeMinimalPng(withPhys = false, physPpu = 2835): Uint8Array {
  const ihdr = makeChunk('IHDR', [0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0])
  const parts: number[][] = [PNG_SIG, ihdr]
  if (withPhys) {
    parts.push(
      makeChunk('pHYs', [
        (physPpu >>> 24) & 0xff, (physPpu >>> 16) & 0xff, (physPpu >>> 8) & 0xff, physPpu & 0xff,
        (physPpu >>> 24) & 0xff, (physPpu >>> 16) & 0xff, (physPpu >>> 8) & 0xff, physPpu & 0xff,
        1,
      ]),
    )
  }
  parts.push(makeChunk('IDAT', [0x00]))
  parts.push(makeChunk('IEND', []))
  return new Uint8Array(parts.flat())
}

describe('crc32', () => {
  it('已知测试向量：IEND 块 CRC = 0xAE426082', () => {
    expect(crc32(new Uint8Array([0x49, 0x45, 0x4e, 0x44]))).toBe(0xae426082)
  })
})

describe('patchPngDpi', () => {
  it('无 pHYs 时在 IHDR 后插入，回读正确', () => {
    const png = makeMinimalPng()
    const out = patchPngDpi(png, 300)
    expect(out.length).toBe(png.length + 21)
    expect(readPngDpi(out)).toBeCloseTo(300, 0)
    // pHYs 必须在 IDAT 之前
    const text = Array.from(out).map((b) => String.fromCharCode(b)).join('')
    expect(text.indexOf('pHYs')).toBeLessThan(text.indexOf('IDAT'))
  })

  it('已有 pHYs 时原地覆写，长度不变', () => {
    const png = makeMinimalPng(true, 2835) // ~72dpi
    const out = patchPngDpi(png, 150)
    expect(out.length).toBe(png.length)
    expect(readPngDpi(out)).toBeCloseTo(150, 0)
  })

  it('拒绝非 PNG 输入', () => {
    expect(() => patchPngDpi(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), 300)).toThrow()
    expect(isPng(makeMinimalPng())).toBe(true)
  })
})
