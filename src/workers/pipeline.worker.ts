/// <reference lib="webworker" />
import { processImage } from '../core/pipeline'
import type { WorkerRequest, WorkerResponse } from '../core/types'

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, fileName, fileType, buffer, spec } = event.data
  try {
    const out = await processImage(buffer, fileName, fileType, spec)
    const res: WorkerResponse = { id, ok: true, buffer: out.buffer, mime: out.mime, meta: out.meta }
    // 结果 buffer 用 transfer 零拷贝回传
    self.postMessage(res, { transfer: [out.buffer] })
  } catch (err) {
    const res: WorkerResponse = {
      id,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
    self.postMessage(res)
  }
}
