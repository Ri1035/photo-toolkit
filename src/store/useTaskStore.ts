import { create } from 'zustand'
import { runTask } from '../workers/workerPool'
import { FORMAT_EXT, type ProcessMeta, type TaskSpec } from '../core/types'
import { outputName } from '../utils/format'

export type TaskStatus = 'pending' | 'running' | 'done' | 'error'

export interface TaskItem {
  id: string
  file: File
  name: string
  size: number
  /** 原图预览 URL（gif 动图可直接预览；heic 等无法预览时为空） */
  previewUrl: string | null
  status: TaskStatus
  result?: {
    blob: Blob
    url: string
    size: number
    outName: string
    meta: ProcessMeta
  }
  error?: string
}

const MAX_FILES = 100

/** 可预览的 MIME */
function makePreview(file: File): string | null {
  if (file.type.startsWith('image/') && !/heic|heif/i.test(file.type)) {
    return URL.createObjectURL(file)
  }
  return null
}

interface TaskState {
  tasks: TaskItem[]
  running: boolean
  addFiles: (files: File[]) => number // 返回实际添加数量
  removeTask: (id: string) => void
  clearAll: () => void
  startAll: (spec: TaskSpec) => Promise<void>
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  running: false,

  addFiles: (files) => {
    const { tasks } = get()
    const room = MAX_FILES - tasks.length
    const accepted = files.slice(0, Math.max(0, room))
    if (accepted.length === 0) return 0
    const items: TaskItem[] = accepted.map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      previewUrl: makePreview(file),
      status: 'pending',
    }))
    set({ tasks: [...tasks, ...items] })
    return accepted.length
  },

  removeTask: (id) => {
    const { tasks } = get()
    const target = tasks.find((t) => t.id === id)
    if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
    if (target?.result) URL.revokeObjectURL(target.result.url)
    set({ tasks: tasks.filter((t) => t.id !== id) })
  },

  clearAll: () => {
    for (const t of get().tasks) {
      if (t.previewUrl) URL.revokeObjectURL(t.previewUrl)
      if (t.result) URL.revokeObjectURL(t.result.url)
    }
    set({ tasks: [] })
  },

  startAll: async (spec) => {
    const { tasks } = get()
    const pending = tasks.filter((t) => t.status !== 'running')
    if (pending.length === 0) return
    set({ running: true })

    const patch = (id: string, p: Partial<TaskItem>) =>
      set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...p } : t)) }))

    await Promise.all(
      pending.map(async (task) => {
        patch(task.id, { status: 'running', error: undefined })
        try {
          const { blob, meta } = await runTask(task.file, spec)
          const outName = outputName(task.name, FORMAT_EXT[meta.format])
          patch(task.id, {
            status: 'done',
            result: {
              blob,
              url: URL.createObjectURL(blob),
              size: blob.size,
              outName,
              meta,
            },
          })
        } catch (err) {
          patch(task.id, {
            status: 'error',
            error: err instanceof Error ? err.message : String(err),
          })
        }
      }),
    )
    set({ running: false })
  },
}))
