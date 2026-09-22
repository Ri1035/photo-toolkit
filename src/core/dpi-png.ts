import { crc32 } from './crc32'

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const CHUNK_PHYS = 0x70485973 // 'pHYs'
const CHUNK_IHDR = 0x49484452 // 'IHDR'
const CHUNK_IDAT = 0x49444154 // 'IDAT'

function readU32(view: DataView, offset: number): number {
  return view.getUint32(offset, false)
}

function chunkType(view: DataView, offset: number): number {
  return readU32(view, offset)
}

/** 是否为合法 PNG */
export function isPng(bytes: Uint8Array): boolean {
  if (bytes.length < 8) return false
  return PNG_SIG.every((b, i) => bytes[i] === b)
}

/**
 * 修改 PNG 的 DPI（pHYs 块），纯字节补丁，不解码像素。
 * - 已有 pHYs：原地覆写并重算 CRC
 * - 无 pHYs：在 IHDR 之后插入（必须在 IDAT 之前）
 */
export function patchPngDpi(bytes: Uint8Array, dpi: number): Uint8Array {
  if (!isPng(bytes)) throw new Error('不是有效的 PNG 文件')
  const ppu = Math.round(dpi / 0.0254) // 像素/米
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)

  let offset = 8
  let ihdrEnd = -1
  while (offset + 12 <= bytes.length) {
    const len = readU32(view, offset)
    const type = chunkType(view, offset + 4)
    const chunkEnd = offset + 12 + len
    if (chunkEnd > bytes.length) throw new Error('PNG 块长度越界，文件可能损坏')

    if (type === CHUNK_IHDR) ihdrEnd = chunkEnd

    if (type === CHUNK_PHYS && len === 9) {
      // 原地覆写
      const out = new Uint8Array(bytes)
      const ov = new DataView(out.buffer)
      ov.setUint32(offset + 8, ppu, false)
      ov.setUint32(offset + 12, ppu, false)
      out[offset + 16] = 1 // 单位：米
      const crc = crc32(out.subarray(offset + 4, offset + 8 + 9))
      ov.setUint32(offset + 8 + 9, crc, false)
      return out
    }

    if (type === CHUNK_IDAT) break // pHYs 必须位于 IDAT 前，停止扫描
    offset = chunkEnd
  }

  if (ihdrEnd < 0) throw new Error('PNG 缺少 IHDR 块')

  // 构造 pHYs 块并插入到 IHDR 之后
  const chunk = new Uint8Array(21)
  const cv = new DataView(chunk.buffer)
  cv.setUint32(0, 9, false) // 数据长度
  cv.setUint32(4, CHUNK_PHYS, false)
  cv.setUint32(8, ppu, false)
  cv.setUint32(12, ppu, false)
  chunk[16] = 1
  cv.setUint32(17, crc32(chunk.subarray(4, 17)), false)

  const out = new Uint8Array(bytes.length + 21)
  out.set(bytes.subarray(0, ihdrEnd), 0)
  out.set(chunk, ihdrEnd)
  out.set(bytes.subarray(ihdrEnd), ihdrEnd + 21)
  return out
}

/** 回读 PNG 的 DPI（无 pHYs 或未按米计时返回 null） */
export function readPngDpi(bytes: Uint8Array): number | null {
  if (!isPng(bytes)) return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let offset = 8
  while (offset + 12 <= bytes.length) {
    const len = readU32(view, offset)
    const type = chunkType(view, offset + 4)
    if (type === CHUNK_PHYS && len === 9) {
      const unit = view.getUint8(offset + 16)
      if (unit !== 1) return null
      const ppu = readU32(view, offset + 8)
      return ppu * 0.0254
    }
    if (type === CHUNK_IDAT) return null
    offset += 12 + len
  }
  return null
}
