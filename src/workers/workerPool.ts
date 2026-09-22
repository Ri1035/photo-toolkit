import { processImage } from '../core/pipeline'
import type { ProcessMeta, TaskSpec, WorkerRequest, WorkerResponse } from '../core/types'

export interface PoolResult {
  blob: Blob
  meta: ProcessMeta
}

interface PendingJob {
  req: WorkerRequest
  resolve: (r: PoolResult) => void
  reject: (e: Error) => void
}

const POOL_SIZE = Math.min(3, Math.max(1, (navigator.hardwareConcurrency || 4) - 1))

let workers: Worker[] | null = null
const idle: Worker[] = []
const queue: PendingJob[] = []

function getWorkers(): Worker[] | null {
  if (workers !== null) return workers
  try {
    workers = Array.from(
      { length: POOL_SIZE },
      () => new Worker(new URL('./pipeline.worker.ts', import.meta.url), { type: 'module' }),
    )
    idle.push(...workers)
    return workers
  } catch {
    workers = []
    return null
  }
}

function dispatch() {
  while (idle.length > 0 && queue.length > 0) {
    const worker = idle.shift()!
    const job = queue.shift()!
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      idle.push(worker)
      const res = event.data
      if (res.ok) {
        job.resolve({ blob: new Blob([res.buffer], { type: res.mime }), meta: res.meta })
      } else {
        job.reject(new Error(res.error))
      }
      dispatch()
    }
    worker.onerror = (e) => {
      idle.push(worker)
      job.reject(new Error(e.message || 'Worker 执行失败'))
      dispatch()
    }
    // 不使用 transfer：Worker 内解码失败时主线程仍持有完整数据
    worker.postMessage(job.req)
  }
}

/**
 * 提交一个图片处理任务。
 * Worker 不可用（构造失败/运行报错）时回退主线程同步执行。
 */
export async function runTask(
  file: File,
  spec: TaskSpec,
): Promise<PoolResult> {
  const buffer = await file.arrayBuffer()
  const req: WorkerRequest = {
    id: crypto.randomUUID(),
    fileName: file.name,
    fileType: file.type,
    buffer,
    spec,
  }

  if (getWorkers()) {
    return new Promise<PoolResult>((resolve, reject) => {
      queue.push({ req, resolve, reject })
      dispatch()
    })
  }

  // 主线程回退
  const out = await processImage(buffer, file.name, file.type, spec)
  return { blob: new Blob([out.buffer], { type: out.mime }), meta: out.meta }
}
