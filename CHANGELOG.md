# 更新日志

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2026-09-22

首次发布。

### 新增
- 图片压缩：固定质量滑杆（MozJPEG / OxiPNG / libwebp / AVIF）
- 指定大小压缩：质量二分搜索 + 尺寸阶梯兜底，支持 KB/MB 目标
- 格式转换：JPG / PNG / WebP / AVIF 互转，透明像素自动填白底
- 修改尺寸：像素 / 百分比两种模式，支持锁定纵横比
- 修改 DPI：纯字节补丁不重编码，JPEG（JFIF + EXIF 双写）与 PNG（pHYs 块）均支持
- GIF 压缩：gifsicle lossy 二分 + 尺寸阶梯，支持指定目标大小
- HEIC/HEIF 导入（自动转 JPEG）、BMP 回退解码
- 批量处理：最多 100 张，Web Worker 并行，单张下载与 ZIP 打包
- Frutiger Aero 界面：静态三段渐变背景 + 玻璃拟态卡片（无循环动画，低渲染开销）
- 纯本地处理：全部基于 WebAssembly 在浏览器内完成，图片不上传

### 质量保障
- 19 个单元测试（压缩二分、DPI 补丁、格式推断），Vitest 全绿
