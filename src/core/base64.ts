const CHUNK = 0x8000

/** Uint8Array → Base64（分块避免调用栈溢出） */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

/** Base64 → Uint8Array（容忍 data URL 前缀） */
export function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const clean = b64.includes(',') ? b64.slice(b64.indexOf(',') + 1) : b64
  const binary = atob(clean.trim())
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

/** 图片 ArrayBuffer → DataURL 字符串（含 MIME 前缀） */
export function imageToDataUrl(buffer: ArrayBuffer, mime: string): string {
  return `data:${mime || 'application/octet-stream'};base64,${bytesToBase64(new Uint8Array(buffer))}`
}

/** 生成 data URL 前缀（供 UI 展示） */
export function dataUrlPrefix(mime: string): string {
  return `data:${mime || 'application/octet-stream'};base64,`
}
