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
  | 'clip' // 图片裁剪
  | 'watermark' // 图片水印
  | 'filter' // 图片滤镜
  | 'base64' // 图片 ↔ Base64
  | 'remove-bg' // AI 抠图 / 背景替换

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

/** 裁剪矩形（像素，基于原图坐标系，值域 0-1 比例或绝对像素） */
export interface ClipSpec {
  x: number
  y: number
  width: number
  height: number
}

export type WatermarkPosition = 'tl' | 'tr' | 'bl' | 'br' | 'center'

export interface WatermarkSpec {
  text: string
  /** 字号（基于图片宽度比例 0.01-0.2） */
  sizeRatio: number
  /** 透明度 0-1 */
  opacity: number
  position: WatermarkPosition
  /** 边距（基于图片宽度比例） */
  marginRatio: number
  color: string
}

export interface FilterSpec {
  /** 亮度 0-2，1 为原图 */
  brightness: number
  /** 对比度 0-2，1 为原图 */
  contrast: number
  /** 饱和度 0-2，1 为原图 */
  saturation: number
  /** 模糊半径 px，0 为不模糊 */
  blur: number
}

export interface RemoveBgSpec {
  /** 抠图后动作：cutout 输出透明 PNG；replace 合成新背景 */
  action: 'cutout' | 'replace'
  /** replace 时的新背景色（纯色） */
  bgColor?: string
  /** replace 时的渐变背景（起点/终点色，二选一与 bgColor 互斥） */
  bgGradient?: [string, string]
  /** replace 时背景方向：vertical / horizontal */
  bgDirection?: 'vertical' | 'horizontal'
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
  /** 裁剪矩形 */
  clip?: ClipSpec
  /** 文字水印 */
  watermark?: WatermarkSpec
  /** 滤镜参数 */
  filter?: FilterSpec
  /** AI 抠图 / 背景替换 */
  removeBg?: RemoveBgSpec
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
