/** HEIC/HEIF 输入支持：heic-to 体积大（约24MB），必须动态按需加载 */

export function isHeicFile(name: string, type: string): boolean {
  const ext = name.toLowerCase().split('.').pop() ?? ''
  return (
    type === 'image/heic' ||
    type === 'image/heif' ||
    ext === 'heic' ||
    ext === 'heif'
  )
}

/** HEIC → JPEG Blob（质量 0.92，供主流水线解码） */
export async function heicToJpegBlob(blob: Blob): Promise<Blob> {
  const { heicTo } = await import('heic-to')
  const result = await heicTo({ blob, type: 'image/jpeg', quality: 0.92 })
  return result as Blob
}
