/** 按像素矩形裁剪 ImageData，越界自动收敛到图片范围 */
export function cropImage(
  image: ImageData,
  x: number,
  y: number,
  width: number,
  height: number,
): ImageData {
  const srcW = image.width
  const srcH = image.height

  // 收敛到合法范围
  const cx = Math.max(0, Math.min(Math.round(x), srcW - 1))
  const cy = Math.max(0, Math.min(Math.round(y), srcH - 1))
  const cw = Math.max(1, Math.min(Math.round(width), srcW - cx))
  const ch = Math.max(1, Math.min(Math.round(height), srcH - cy))

  const out = new ImageData(cw, ch)
  const src = image.data
  const dst = out.data
  for (let row = 0; row < ch; row++) {
    const srcStart = ((cy + row) * srcW + cx) * 4
    const dstStart = row * cw * 4
    dst.set(src.subarray(srcStart, srcStart + cw * 4), dstStart)
  }
  return out
}
