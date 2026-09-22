import piexif from 'piexifjs'

/**
 * 修改 JPEG 的 DPI，纯字节补丁，不重编码、无画质损失。
 * 1) JFIF APP0 段：单位=1（点/英寸），Xdensity/Ydensity=dpi；无 APP0 时在 SOI 后插入
 * 2) 若存在 EXIF（APP1）：同步修改 XResolution/YResolution/ResolutionUnit（Photoshop 等优先读此处）
 */
export function patchJpegDpi(bytes: Uint8Array, dpi: number): Uint8Array {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new Error('不是有效的 JPEG 文件')
  }
  let out = patchJfif(bytes, dpi)
  out = patchExif(out, dpi)
  return out
}

/**
 * 在 JPEG 头部段区域查找指定标记段，返回段起始偏移（FF 处）；未找到返回 -1。
 * 扫描到 SOS（FFDA）或段结构异常时停止。
 */
function findSegment(bytes: Uint8Array, marker: number, signature?: number[]): number {
  let pos = 2 // 跳过 SOI
  while (pos + 4 <= bytes.length && bytes[pos] === 0xff) {
    const m = bytes[pos + 1]
    if (m === 0xda || m === 0xd9) break // SOS / EOI
    if (m === 0x01 || (m >= 0xd0 && m <= 0xd7)) {
      pos += 2 // 无长度独立标记
      continue
    }
    const len = (bytes[pos + 2] << 8) | bytes[pos + 3]
    if (len < 2 || pos + 2 + len > bytes.length) break
    if (m === marker) {
      const sigOk = !signature || signature.every((b, i) => bytes[pos + 4 + i] === b)
      if (sigOk) return pos
    }
    pos += 2 + len
  }
  return -1
}

const SIG_JFIF = [0x4a, 0x46, 0x49, 0x46, 0x00] // 'JFIF\0'
const SIG_EXIF = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00] // 'Exif\0\0'

function patchJfif(bytes: Uint8Array, dpi: number): Uint8Array {
  const pos = findSegment(bytes, 0xe0, SIG_JFIF)
  if (pos >= 0) {
    // APP0 布局：标记2 + 长度2 + 'JFIF\0'5 + 版本2 + 单位1 + X密度2 + Y密度2 + 缩略图2
    const out = new Uint8Array(bytes)
    out[pos + 11] = 1 // 单位：点/英寸
    const view = new DataView(out.buffer)
    view.setUint16(pos + 12, dpi, false)
    view.setUint16(pos + 14, dpi, false)
    return out
  }

  // 无 APP0：在 SOI 后插入 18 字节最小 JFIF 段
  const app0 = new Uint8Array(18)
  const av = new DataView(app0.buffer)
  app0[0] = 0xff
  app0[1] = 0xe0
  av.setUint16(2, 16, false) // 段长度（不含标记）
  app0.set(SIG_JFIF, 4)
  app0[9] = 1
  app0[10] = 2 // 版本 1.02
  app0[11] = 1 // 单位：点/英寸
  av.setUint16(12, dpi, false)
  av.setUint16(14, dpi, false)
  // 缩略图 0x0 保持 0

  const out = new Uint8Array(bytes.length + 18)
  out.set(bytes.subarray(0, 2), 0)
  out.set(app0, 2)
  out.set(bytes.subarray(2), 20)
  return out
}

/** Uint8Array → latin1 二进制字符串（piexifjs 的输入格式） */
function bytesToBinaryString(bytes: Uint8Array): string {
  const CHUNK = 0x8000
  const parts: string[] = []
  for (let i = 0; i < bytes.length; i += CHUNK) {
    parts.push(String.fromCharCode(...bytes.subarray(i, i + CHUNK)))
  }
  return parts.join('')
}

function binaryStringToBytes(s: string): Uint8Array {
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff
  return out
}

function patchExif(bytes: Uint8Array, dpi: number): Uint8Array {
  if (findSegment(bytes, 0xe1, SIG_EXIF) < 0) return bytes

  try {
    const bin = bytesToBinaryString(bytes)
    const exifObj = piexif.load(bin)
    const zeroth = exifObj['0th'] ?? {}
    zeroth[piexif.ImageIFD.XResolution] = [dpi, 1]
    zeroth[piexif.ImageIFD.YResolution] = [dpi, 1]
    zeroth[piexif.ImageIFD.ResolutionUnit] = 2 // 英寸
    exifObj['0th'] = zeroth
    const exifBytes = piexif.dump(exifObj)
    const inserted = piexif.insert(exifBytes, bin)
    return binaryStringToBytes(inserted)
  } catch {
    // EXIF 损坏等异常：保留 JFIF 补丁结果
    return bytes
  }
}

/** 回读 JPEG 的 DPI（JFIF APP0，单位非英寸时返回 null） */
export function readJpegDpi(bytes: Uint8Array): number | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null
  const pos = findSegment(bytes, 0xe0, SIG_JFIF)
  if (pos < 0 || pos + 16 > bytes.length) return null
  if (bytes[pos + 11] !== 1) return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  return view.getUint16(pos + 12, false)
}
