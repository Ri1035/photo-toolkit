import JSZip from 'jszip'
import { dedupeNames } from './format'

export interface ZipEntry {
  name: string
  blob: Blob
}

/**
 * 打包为 zip。图片已压缩，使用 STORE（不二次压缩），省 CPU。
 */
export async function zipBlobs(
  entries: ZipEntry[],
  onProgress?: (percent: number) => void,
): Promise<Blob> {
  const zip = new JSZip()
  const names = dedupeNames(entries.map((e) => e.name))
  entries.forEach((entry, i) => {
    zip.file(names[i], entry.blob, { compression: 'STORE' })
  })
  return zip.generateAsync(
    { type: 'blob', compression: 'STORE' },
    (meta) => onProgress?.(meta.percent),
  )
}
