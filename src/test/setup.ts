/**
 * vitest(node 环境)下的 DOM 最小 polyfill。
 * cropImage 只依赖 ImageData 的构造/读写，无需完整 DOM。
 */

class ImageDataPolyfill {
  readonly width: number
  readonly height: number
  readonly data: Uint8ClampedArray

  constructor(dataOrWidth: Uint8ClampedArray | number, widthOrHeight: number, height?: number) {
    if (typeof dataOrWidth === 'number') {
      this.width = dataOrWidth
      this.height = widthOrHeight
      this.data = new Uint8ClampedArray(dataOrWidth * widthOrHeight * 4)
    } else {
      this.data = dataOrWidth
      this.width = widthOrHeight
      this.height = height ?? Math.floor(dataOrWidth.length / (4 * widthOrHeight))
    }
  }
}

// @ts-expect-error 测试环境注入最小实现，类型以 DOM lib 为准
globalThis.ImageData = ImageDataPolyfill
