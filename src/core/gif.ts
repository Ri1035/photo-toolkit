import gifsicle from 'gifsicle-wasm-browser'

export interface GifResult {
  data: Uint8Array
  reached: boolean
  note?: string
}

async function runGifsicle(input: Uint8Array, args: string): Promise<Uint8Array> {
  const file = new File([input.buffer as ArrayBuffer], 'in.gif', { type: 'image/gif' })
  const out = await gifsicle.run({
    input: [{ file, name: 'in.gif' }],
    command: [`${args} in.gif -o /out/out.gif`],
  })
  if (!out || out.length === 0) throw new Error('GIF 处理失败')
  const buf = await (out[0] as File).arrayBuffer()
  return new Uint8Array(buf)
}

/** 固定 lossy 档位压缩（1-200，数值越大体积越小画质越低） */
export async function compressGif(input: Uint8Array, lossy: number, scale?: number): Promise<Uint8Array> {
  const optLevel = input.byteLength > 10 * 1024 * 1024 ? '-O1' : '-O3'
  const scaleArg = scale !== undefined && scale < 1 ? `--scale ${scale.toFixed(2)}` : ''
  return runGifsicle(input, `${optLevel} --lossy=${Math.round(lossy)} ${scaleArg}`)
}

/**
 * GIF 压缩到目标字节数：--lossy 二分（20-200），仍超标则叠加 scale 阶梯。
 */
export async function compressGifToTarget(input: Uint8Array, targetBytes: number): Promise<GifResult> {
  if (input.byteLength <= targetBytes) {
    return { data: input, reached: true, note: '原图已小于目标大小，未做处理' }
  }

  let lo = 20
  let hi = 200
  let best: Uint8Array | null = null
  let smallest: Uint8Array | null = null
  let scale = 1

  for (let round = 0; round < 4; round++) {
    lo = 20
    hi = 200
    for (let i = 0; i < 6 && lo <= hi; i++) {
      const mid = (lo + hi) >> 1
      const buf = await compressGif(input, mid, scale < 1 ? scale : undefined)
      if (!smallest || buf.byteLength < smallest.byteLength) smallest = buf
      if (buf.byteLength <= targetBytes) {
        best = buf
        lo = mid + 1 // 达标则尝试更小 lossy 保留画质
      } else {
        hi = mid - 1
      }
    }
    if (best) return { data: best, reached: true }
    scale *= 0.85 // 尺寸阶梯
    if (scale < 0.3) break
  }

  return {
    data: smallest!,
    reached: false,
    note: '无法压到指定大小，已输出可做到的最小体积',
  }
}

/** GIF 修改尺寸（--resize / --scale） */
export async function resizeGif(
  input: Uint8Array,
  width?: number,
  height?: number,
  percent?: number,
): Promise<Uint8Array> {
  if (percent !== undefined && percent > 0 && percent !== 100) {
    return runGifsicle(input, `--scale ${(percent / 100).toFixed(3)}`)
  }
  const w = width ? String(width) : '_'
  const h = height ? String(height) : '_'
  return runGifsicle(input, `--resize ${w}x${h}`)
}
