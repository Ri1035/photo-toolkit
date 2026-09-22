import { describe, expect, it } from 'vitest'
import { base64ToBytes, bytesToBase64, imageToDataUrl } from '../core/base64'

describe('base64 编解码', () => {
  it('bytes → base64 → bytes 往返一致', () => {
    const bytes = new Uint8Array([0x00, 0x01, 0xff, 0x10, 0x89, 0x50, 0x4e, 0x47])
    const b64 = bytesToBase64(bytes)
    expect(base64ToBytes(b64)).toEqual(bytes)
  })

  it('大输入（>32768 字节）分块编码不抛错', () => {
    const bytes = new Uint8Array(100_000)
    for (let i = 0; i < bytes.length; i++) bytes[i] = i % 251
    const b64 = bytesToBase64(bytes)
    expect(b64.length).toBeGreaterThan(100_000)
    expect(base64ToBytes(b64)).toEqual(bytes)
  })

  it('容忍 data URL 前缀', () => {
    const raw = new Uint8Array([1, 2, 3])
    const dataUrl = `data:image/png;base64,${bytesToBase64(raw)}`
    expect(base64ToBytes(dataUrl)).toEqual(raw)
  })

  it('imageToDataUrl 生成带 MIME 前缀的字符串', () => {
    const raw = new Uint8Array([1, 2, 3])
    const url = imageToDataUrl(raw.buffer as ArrayBuffer, 'image/jpeg')
    expect(url.startsWith('data:image/jpeg;base64,')).toBe(true)
    expect(base64ToBytes(url)).toEqual(raw)
  })

  it('非法 Base64 抛出异常', () => {
    expect(() => base64ToBytes('!!!not-base64!!!')).toThrow()
  })
})
