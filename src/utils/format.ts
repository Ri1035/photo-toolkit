/** 字节数 → 人类可读 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

/** 压缩率描述，如 "-62%" */
export function formatRatio(original: number, next: number): string {
  if (original <= 0) return ''
  const r = (1 - next / original) * 100
  const sign = r > 0 ? '-' : '+'
  return `${sign}${Math.abs(r).toFixed(0)}%`
}

/** zip 内文件名去重：重名追加 -2、-3… */
export function dedupeNames(names: string[]): string[] {
  const seen = new Map<string, number>()
  return names.map((name) => {
    const count = seen.get(name)
    if (count === undefined) {
      seen.set(name, 1)
      return name
    }
    const dot = name.lastIndexOf('.')
    const base = dot > 0 ? name.slice(0, dot) : name
    const ext = dot > 0 ? name.slice(dot) : ''
    let n = count + 1
    let candidate = `${base}-${n}${ext}`
    while (seen.has(candidate)) {
      n += 1
      candidate = `${base}-${n}${ext}`
    }
    seen.set(name, n)
    seen.set(candidate, 1)
    return candidate
  })
}

/** 生成输出文件名：去原扩展名 + 新扩展名 */
export function outputName(originalName: string, ext: string): string {
  const dot = originalName.lastIndexOf('.')
  const base = dot > 0 ? originalName.slice(0, dot) : originalName
  return `${base}.${ext}`
}
