/** 原生 saveAs：Blob + <a download>，无需 file-saver 依赖 */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // 延迟回收，确保下载已开始
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
