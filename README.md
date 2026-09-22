# 泡泡图片工坊（Pingtu）

纯本地的图片处理工具箱：压缩到指定 KB、格式转换、修改尺寸与 DPI、GIF 动图压缩。
所有处理均基于 WebAssembly 在浏览器内完成，**图片不上传任何服务器**，无付费功能。

## 功能

| 功能 | 说明 |
| --- | --- |
| 图片压缩 | 固定质量滑杆，MozJPEG / OxiPNG / libwebp / AVIF 编解码器 |
| 指定大小 | 质量二分搜索 + 尺寸阶梯兜底，精确压到目标 KB/MB |
| 格式转换 | JPG / PNG / WebP / AVIF 互转，透明像素自动填白底 |
| 修改尺寸 | 像素 / 百分比模式，支持锁定纵横比 |
| 修改 DPI | 纯字节补丁不重编码；JPEG（JFIF + EXIF 双写）、PNG（pHYs 块） |
| GIF 压缩 | gifsicle lossy 二分 + 尺寸阶梯，支持指定目标大小 |
| 批量处理 | 最多 100 张并行（Web Worker 池），单张下载或 ZIP 打包 |

支持导入 JPG / PNG / WebP / AVIF / GIF / BMP / HEIC（HEIC 自动转 JPEG）。

## 本地开发

```bash
npm install
npm run dev       # 开发服务器
npm run test      # 单元测试（Vitest）
npm run build     # 生产构建 → dist/
npm run preview   # 预览构建产物
```

## 技术栈

Vite + React 19 + TypeScript + Zustand + Web Workers

- 编解码：[@jsquash/*](https://github.com/GoogleChromeLabs/squoosh/tree/dev/codecs)（Apache-2.0）
- GIF：[gifsicle-wasm-browser](https://github.com/renzhezhilu/gifsicle-wasm-browser)（MIT）
- HEIC：[heic-to](https://github.com/hoppergee/heic-to)（LGPL-3.0）
- ZIP：[JSZip](https://github.com/Stuk/jszip)（MIT）

## 版本

当前版本见 `package.json`，变更历史见 [CHANGELOG.md](./CHANGELOG.md)。

## 部署

静态站点，`npm run build` 产物在 `dist/`，可托管到 Cloudflare Pages 等任意静态服务器。
