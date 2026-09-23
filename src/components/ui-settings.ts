import type {
  FormatId,
  ModeId,
  TaskSpec,
  WatermarkPosition,
} from '../core/types'

export interface UiSettings {
  /** 固定质量 1-100 */
  quality: number
  /** 输出格式 */
  outputFormat: FormatId | 'original'
  /** 指定大小 */
  targetValue: number
  targetUnit: 'KB' | 'MB'
  /** 修改尺寸 */
  resizeMode: 'px' | 'percent'
  width?: number
  height?: number
  keepRatio: boolean
  percent: number
  /** DPI */
  dpiEnabled: boolean
  dpi: number
  /** GIF */
  gifMode: 'lossy' | 'target'
  gifLossy: number
  gifTargetValue: number
  gifTargetUnit: 'KB' | 'MB'
  /** 裁剪（比例 0-100%） */
  clipRatio: 'free' | '1:1' | '4:3' | '3:4' | '16:9' | '9:16'
  clipW: number
  clipH: number
  clipX: number
  clipY: number
  /** 水印 */
  wmText: string
  wmSizeRatio: number
  wmOpacity: number
  wmPosition: WatermarkPosition
  wmMarginRatio: number
  wmColor: string
  /** 滤镜（50-150 为 50%-150%，100 为原图） */
  ftBrightness: number
  ftContrast: number
  ftSaturation: number
  ftBlur: number
  /** AI 抠图 / 背景替换 */
  rbAction: 'cutout' | 'replace'
  rbBgType: 'color' | 'gradient'
  rbColor: string
  rbGradient1: string
  rbGradient2: string
  rbDirection: 'vertical' | 'horizontal'
}

export const defaultSettings: UiSettings = {
  quality: 75,
  outputFormat: 'original',
  targetValue: 200,
  targetUnit: 'KB',
  resizeMode: 'percent',
  width: undefined,
  height: undefined,
  keepRatio: true,
  percent: 50,
  dpiEnabled: false,
  dpi: 300,
  gifMode: 'lossy',
  gifLossy: 80,
  gifTargetValue: 500,
  gifTargetUnit: 'KB',
  clipRatio: 'free',
  clipW: 80,
  clipH: 80,
  clipX: 10,
  clipY: 10,
  wmText: 'KOKA-PhotoKit',
  wmSizeRatio: 5,
  wmOpacity: 60,
  wmPosition: 'br',
  wmMarginRatio: 3,
  wmColor: '#ffffff',
  ftBrightness: 100,
  ftContrast: 100,
  ftSaturation: 100,
  ftBlur: 0,
  rbAction: 'cutout',
  rbBgType: 'color',
  rbColor: '#ffffff',
  rbGradient1: '#6ec9f7',
  rbGradient2: '#8fd96a',
  rbDirection: 'vertical',
}

function targetBytes(value: number, unit: 'KB' | 'MB'): number {
  return Math.round(value * (unit === 'MB' ? 1024 * 1024 : 1024))
}

/** 由 UI 设置构建处理任务参数 */
export function buildSpec(mode: ModeId, s: UiSettings): TaskSpec {
  const dpi = s.dpiEnabled ? s.dpi : undefined
  switch (mode) {
    case 'compress':
      return {
        mode,
        outputFormat: s.outputFormat,
        compress: { kind: 'quality', quality: s.quality },
        resize: { enabled: false, keepRatio: true },
        dpi,
        gif: { lossy: s.gifLossy },
      }
    case 'target-size':
      return {
        mode,
        outputFormat: s.outputFormat,
        compress: { kind: 'target', targetBytes: targetBytes(s.targetValue, s.targetUnit) },
        resize: { enabled: false, keepRatio: true },
        dpi,
        gif: { lossy: s.gifLossy, targetBytes: targetBytes(s.targetValue, s.targetUnit) },
      }
    case 'convert':
      return {
        mode,
        outputFormat: s.outputFormat === 'original' ? 'webp' : s.outputFormat,
        compress: { kind: 'quality', quality: s.quality },
        resize: { enabled: false, keepRatio: true },
        dpi,
        gif: { lossy: s.gifLossy },
      }
    case 'resize':
      return {
        mode,
        outputFormat: s.outputFormat,
        compress: { kind: 'quality', quality: Math.max(s.quality, 85) },
        resize: {
          enabled: true,
          width: s.resizeMode === 'px' ? s.width : undefined,
          height: s.resizeMode === 'px' ? s.height : undefined,
          keepRatio: s.keepRatio,
          percent: s.resizeMode === 'percent' ? s.percent : undefined,
        },
        dpi,
        gif: { lossy: s.gifLossy },
      }
    case 'dpi':
      return {
        mode,
        outputFormat: 'original',
        compress: { kind: 'quality', quality: 100 },
        resize: { enabled: false, keepRatio: true },
        dpi: s.dpi,
        gif: { lossy: s.gifLossy },
      }
    case 'gif':
      return {
        mode,
        outputFormat: 'gif',
        compress:
          s.gifMode === 'target'
            ? { kind: 'target', targetBytes: targetBytes(s.gifTargetValue, s.gifTargetUnit) }
            : { kind: 'quality', quality: s.quality },
        resize: { enabled: false, keepRatio: true },
        gif: {
          lossy: s.gifLossy,
          targetBytes:
            s.gifMode === 'target' ? targetBytes(s.gifTargetValue, s.gifTargetUnit) : undefined,
        },
      }
    case 'clip':
      return {
        mode,
        outputFormat: 'original',
        compress: { kind: 'quality', quality: 100 },
        resize: { enabled: false, keepRatio: true },
        gif: { lossy: s.gifLossy },
        clip: {
          x: s.clipX / 100,
          y: s.clipY / 100,
          width: s.clipW / 100,
          height: s.clipH / 100,
        },
      }
    case 'watermark':
      return {
        mode,
        outputFormat: 'original',
        compress: { kind: 'quality', quality: 100 },
        resize: { enabled: false, keepRatio: true },
        gif: { lossy: s.gifLossy },
        watermark: {
          text: s.wmText || ' ',
          sizeRatio: Math.max(0.01, s.wmSizeRatio / 100),
          opacity: s.wmOpacity / 100,
          position: s.wmPosition,
          marginRatio: Math.max(0.005, s.wmMarginRatio / 100),
          color: s.wmColor,
        },
      }
    case 'filter':
      return {
        mode,
        outputFormat: 'original',
        compress: { kind: 'quality', quality: 100 },
        resize: { enabled: false, keepRatio: true },
        gif: { lossy: s.gifLossy },
        filter: {
          brightness: s.ftBrightness / 100,
          contrast: s.ftContrast / 100,
          saturation: s.ftSaturation / 100,
          blur: s.ftBlur,
        },
      }
    case 'remove-bg':
      return {
        mode,
        outputFormat: 'png',
        compress: { kind: 'quality', quality: 100 },
        resize: { enabled: false, keepRatio: true },
        gif: { lossy: s.gifLossy },
        removeBg: {
          action: s.rbAction,
          bgColor: s.rbAction === 'replace' && s.rbBgType === 'color' ? s.rbColor : undefined,
          bgGradient:
            s.rbAction === 'replace' && s.rbBgType === 'gradient'
              ? [s.rbGradient1, s.rbGradient2]
              : undefined,
          bgDirection: s.rbDirection,
        },
      }
    case 'base64':
      // Base64 模式由独立面板处理（不进入批量管线），此分支仅满足类型穷尽
      return {
        mode,
        outputFormat: 'original',
        compress: { kind: 'quality', quality: 100 },
        resize: { enabled: false, keepRatio: true },
        gif: { lossy: s.gifLossy },
      }
  }
}
