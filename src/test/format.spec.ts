import { describe, expect, it } from 'vitest'
import { dedupeNames, formatBytes, formatRatio, outputName } from '../utils/format'

describe('formatBytes', () => {
  it('各量级格式化', () => {
    expect(formatBytes(500)).toBe('500 B')
    expect(formatBytes(2048)).toBe('2.0 KB')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.00 MB')
  })
})

describe('formatRatio', () => {
  it('压缩率符号', () => {
    expect(formatRatio(1000, 400)).toBe('-60%')
    expect(formatRatio(1000, 1500)).toBe('+50%')
  })
})

describe('dedupeNames', () => {
  it('重名追加序号且不与已有名冲突', () => {
    expect(dedupeNames(['a.jpg', 'a.jpg', 'a-2.jpg', 'a.jpg'])).toEqual([
      'a.jpg',
      'a-2.jpg',
      'a-2-2.jpg',
      'a-3.jpg',
    ])
    expect(dedupeNames(['x.png', 'y.png'])).toEqual(['x.png', 'y.png'])
  })
})

describe('outputName', () => {
  it('替换扩展名', () => {
    expect(outputName('photo.jpeg', 'webp')).toBe('photo.webp')
    expect(outputName('noext', 'png')).toBe('noext.png')
  })
})
