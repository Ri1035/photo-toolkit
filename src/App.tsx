import { useState } from 'react'
import { DropZone } from './components/DropZone'
import { ModeTabs } from './components/ModeTabs'
import { CompressPanel } from './components/panels/CompressPanel'
import { TargetSizePanel } from './components/panels/TargetSizePanel'
import { ConvertPanel } from './components/panels/ConvertPanel'
import { ResizePanel } from './components/panels/ResizePanel'
import { DpiPanel } from './components/panels/DpiPanel'
import { GifPanel } from './components/panels/GifPanel'
import { TaskList } from './components/TaskList'
import { buildSpec, defaultSettings, type UiSettings } from './components/ui-settings'
import { useTaskStore } from './store/useTaskStore'
import { formatBytes, formatRatio } from './utils/format'
import { saveBlob } from './utils/download'
import { zipBlobs } from './utils/zip'
import type { ModeId } from './core/types'

export default function App() {
  const [mode, setMode] = useState<ModeId>('compress')
  const [settings, setSettings] = useState<UiSettings>(defaultSettings)
  const [notice, setNotice] = useState('')
  const [zipPercent, setZipPercent] = useState<number | null>(null)

  const { tasks, running, addFiles, removeTask, clearAll, startAll } = useTaskStore()

  const patch = (p: Partial<UiSettings>) => setSettings((s) => ({ ...s, ...p }))

  const doneTasks = tasks.filter((t) => t.status === 'done' && t.result)
  const totalIn = tasks.reduce((acc, t) => acc + t.size, 0)
  const totalOut = doneTasks.reduce((acc, t) => acc + (t.result?.size ?? 0), 0)

  const handleFiles = (files: File[]) => {
    const added = addFiles(files)
    if (added < files.length) setNotice('一次最多处理 100 张，超出部分已忽略')
    else if (added > 0) setNotice('')
  }

  const handleStart = () => startAll(buildSpec(mode, settings))

  const handleZip = async () => {
    if (doneTasks.length === 0) return
    setZipPercent(0)
    try {
      const blob = await zipBlobs(
        doneTasks.map((t) => ({ name: t.result!.outName, blob: t.result!.blob })),
        (p) => setZipPercent(Math.round(p)),
      )
      saveBlob(blob, '泡泡图片工坊-打包.zip')
    } finally {
      setZipPercent(null)
    }
  }

  return (
    <>
      <div className="app-shell">
        <header className="site-header glass-card">
          <div className="logo-bubble" />
          <div>
            <div className="site-title">泡泡图片工坊</div>
            <div className="site-tagline">本地图片压缩 · 格式转换 · 尺寸与 DPI 修改</div>
          </div>
          <div className="privacy-pill">🔒 纯本地处理 · 图片不上传</div>
        </header>

        <main className="main-card glass-card">
          <ModeTabs mode={mode} onChange={setMode} />

          <DropZone mode={mode} onFiles={handleFiles} onReject={setNotice} />
          {notice && <p className="task-note" style={{ marginTop: -12, marginBottom: 14 }}>⚠ {notice}</p>}

          {mode === 'compress' && <CompressPanel settings={settings} onChange={patch} />}
          {mode === 'target-size' && <TargetSizePanel settings={settings} onChange={patch} />}
          {mode === 'convert' && <ConvertPanel settings={settings} onChange={patch} />}
          {mode === 'resize' && <ResizePanel settings={settings} onChange={patch} />}
          {mode === 'dpi' && <DpiPanel settings={settings} onChange={patch} />}
          {mode === 'gif' && <GifPanel settings={settings} onChange={patch} />}

          {tasks.length > 0 && (
            <div className="batch-bar glass-card">
              <div className="batch-stats">
                共 <strong>{tasks.length}</strong> 张 · 原始合计 {formatBytes(totalIn)}
                {doneTasks.length > 0 && (
                  <>
                    {' '}→ 输出 {formatBytes(totalOut)}{' '}
                    <strong>{formatRatio(totalIn, totalOut)}</strong>（已完成 {doneTasks.length} 张）
                  </>
                )}
              </div>
              {zipPercent !== null && <span className="zip-progress">打包中 {zipPercent}%</span>}
              <button className="glossy-btn" disabled={running} onClick={handleStart}>
                {running ? '处理中…' : '开始处理'}
              </button>
              <button
                className="glossy-btn blue"
                disabled={doneTasks.length === 0 || zipPercent !== null}
                onClick={handleZip}
              >
                打包下载 ZIP
              </button>
              <button className="glossy-btn ghost small" disabled={running} onClick={clearAll}>
                清空
              </button>
            </div>
          )}

          <TaskList tasks={tasks} onRemove={removeTask} />

          {tasks.length === 0 && (
            <div className="empty-state">
              支持批量处理 100 张图片 · 压缩到指定 KB · 格式互转 · 修改宽高/分辨率/DPI · GIF 动图压缩
              <br />
              基于 WebAssembly 编解码器（MozJPEG / OxiPNG / libwebp / gifsicle）在浏览器内运行
            </div>
          )}
        </main>

        <footer className="site-footer">
          所有处理均在你的设备上完成，没有任何图片会被上传到服务器。
          <br />
          开源组件：jSquash（Apache-2.0）· gifsicle-wasm-browser（MIT）· heic-to（LGPL-3.0）· JSZip（MIT）
        </footer>
      </div>
    </>
  )
}
