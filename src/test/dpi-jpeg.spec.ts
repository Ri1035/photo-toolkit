import { describe, expect, it } from 'vitest'
import piexif from 'piexifjs'
import { patchJpegDpi, readJpegDpi } from '../core/dpi-jpeg'

/** 最小 JPEG：SOI + JFIF APP0(单位0/密度1) + EOI */
function makeJpegWithJfif(): Uint8Array {
  return new Uint8Array([
    0xff, 0xd8,
    0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x02, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
    0xff, 0xd9,
  ])
}

/** 最小 JPEG：SOI + EOI（无 APP0） */
function makeJpegBare(): Uint8Array {
  return new Uint8Array([0xff, 0xd8, 0xff, 0xd9])
}

/** 带 SOS 的最小 JPEG：piexif 段扫描依赖 SOS 终止（纯 EOI 结尾会被当作段头解析而报错） */
function makeJpegWithSos(): Uint8Array {
  return new Uint8Array([
    0xff, 0xd8,
    0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x02, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
    0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, // SOS 段头
    0x11, 0x22, 0x33, 0x44, // 假图像数据
    0xff, 0xd9,
  ])
}

function toBin(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => String.fromCharCode(b)).join('')
}

function toBytes(s: string): Uint8Array {
  return new Uint8Array([...s].map((c) => c.charCodeAt(0) & 0xff))
}

describe('patchJpegDpi', () => {
  it('有 JFIF APP0：原地覆写单位与密度', () => {
    const out = patchJpegDpi(makeJpegWithJfif(), 300)
    expect(out.length).toBe(makeJpegWithJfif().length)
    expect(out[13]).toBe(1)
    expect(readJpegDpi(out)).toBe(300)
  })

  it('无 APP0：SOI 后插入最小 JFIF 段', () => {
    const bare = makeJpegBare()
    const out = patchJpegDpi(bare, 96)
    expect(out.length).toBe(bare.length + 18)
    expect(out[2]).toBe(0xff)
    expect(out[3]).toBe(0xe0)
    expect(readJpegDpi(out)).toBe(96)
  })

  it('含 EXIF：同步修改 XResolution/YResolution/ResolutionUnit', () => {
    // 用 piexif 构造带 EXIF 的 JPEG（必须含 SOS，piexif 才能正确切段）
    const base = toBin(makeJpegWithSos())
    const exifBytes = piexif.dump({ '0th': { [piexif.ImageIFD.XResolution]: [72, 1] } })
    const withExif = toBytes(piexif.insert(exifBytes, base))

    const out = patchJpegDpi(withExif, 300)
    const exifObj = piexif.load(toBin(out))
    expect(exifObj['0th']?.[piexif.ImageIFD.XResolution]).toEqual([300, 1])
    expect(exifObj['0th']?.[piexif.ImageIFD.YResolution]).toEqual([300, 1])
    expect(exifObj['0th']?.[piexif.ImageIFD.ResolutionUnit]).toBe(2)
    // JFIF 也应已更新
    expect(readJpegDpi(out)).toBe(300)
  })

  it('拒绝非 JPEG 输入', () => {
    expect(() => patchJpegDpi(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), 300)).toThrow()
  })
})
