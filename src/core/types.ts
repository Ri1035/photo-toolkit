/** 输出/处理的图片格式标识 */
export type FormatId = 'jpeg' | 'png' | 'webp' | 'avif' | 'gif'

/** 功能模式 */
export type ModeId =
  | 'compress' // 图片压缩（质量滑杆）
  | 'target-size' // 压缩到指定 KB/MB
  | 'convert' // 格式转换
  | 'resize' // 修改宽高/分辨率
  | 'dpi' // 修改 DPI（无损字节补丁）
  | 'gif' // GIF 压缩

export type CompressOptions =
  | { kind: 'quality'; quality: number } // quality: 1-100
  | { kind: 'target'; targetBytes: number }

export interface ResizeSpec {
  enabled: boolean
  /** 目标宽度 px（与 height 二选一或同时给） */
  width?: number
  height?: number
  /** 是否锁定宽高比（仅给单边时生效） */
  keepRatio: boolean
  /** 百分比缩放 1-100，设置时优先于像素值 */
  percent?: number
}

export interface GifSpec {
  /** 固定 lossy 档位 1-200 */
  lossy: number
  /** 指定大小时的目标字节数，设置后忽略 lossy */
  targetBytes?: number
}

export interface TaskSpec {
  mode: ModeId
  /** 输出格式；'original' 表示保持每张图片的原格式（heic/bmp 等回退为 jpeg） */
  outputFormat: FormatId | 'original'
  compress: CompressOptions
  resize: ResizeSpec
  /** 输出图片 DPI（仅 jpeg/png 生效） */
  dpi?: number
  gif: GifSpec
}

export interface ProcessMeta {
  width: number
  height: number
  originalWidth: number
  originalHeight: number
  /** 指定大小模式是否达标 */
  reached: boolean
  /** 附加提示，如「无法压到指定大小，已输出最小体积」 */
  note?: string
  format: FormatId
}

export interface WorkerRequest {
  id: string
  fileName: string
  fileType: string
  buffer: ArrayBuffer
  spec: TaskSpec
}

export interface WorkerOkResponse {
  id: string
  ok: true
  buffer: ArrayBuffer
  mime: string
  meta: ProcessMeta
}

export interface WorkerErrResponse {
  id: string
  ok: false
  error: string
}

export type WorkerResponse = WorkerOkResponse | WorkerErrResponse

export const FORMAT_MIME: Record<FormatId, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
}

export const FORMAT_EXT: Record<FormatId, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
  avif: 'avif',
  gif: 'gif',
}
