import { useRef, useState } from 'react'
import { base64ToBytes, bytesToBase64 } from '../../core/base64'
import { formatBytes } from '../../utils/format'
import { saveBlob } from '../../utils/download'

type B64Status = 'idle' | 'ready' | 'decoded' | 'error'

/** 图片 ↔ Base64（独立工具，不走批量管线） */
export function Base64Panel() {
  const [status, setStatus] = useState<B64Status>('idle')
  const [result, setResult] = useState('')
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [decodeInput, setDecodeInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    const buf = await file.arrayBuffer()
    const b64 = bytesToBase64(new Uint8Array(buf))
    const prefix = `data:${file.type || 'application/octet-stream'};base64,`
    setStatus('ready')
    setResult(prefix + b64)
    setFileName(file.name)
    setFileSize(file.size)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleDecode = () => {
    try {
      const bytes = base64ToBytes(decodeInput)
      const blob = new Blob([bytes], { type: 'image/png' })
      setStatus('decoded')
      setResult(`${bytes.byteLength} 字节`)
      setPreviewUrl(URL.createObjectURL(blob))
      setFileName('decoded-image')
      setFileSize(bytes.byteLength)
    } catch {
      setStatus('error')
      setResult('Base64 解码失败，请检查输入内容')
    }
  }

  const copyResult = async () => {
    if (status !== 'ready') return
    try {
      await navigator.clipboard.writeText(result)
      alert('Base64 已复制到剪贴板')
    } catch {
      const ta = document.createElement('textarea')
      ta.value = result
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
      alert('Base64 已复制到剪贴板')
    }
  }

  const downloadTxt = () => {
    if (status !== 'ready') return
    const dot = fileName.lastIndexOf('.')
    const base = dot > 0 ? fileName.slice(0, dot) : fileName
    saveBlob(new Blob([result], { type: 'text/plain' }), `${base || 'image'}.base64.txt`)
  }

  return (
    <div className="panel" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <div className="field" style={{ minWidth: 0 }}>
        <span className="field-label">图片 → Base64</span>
        <div className="input-row">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button className="glossy-btn blue small" onClick={() => inputRef.current?.click()}>
            选择图片
          </button>
          {status === 'ready' && (
            <>
              <span className="input-suffix">
                {fileName} · {formatBytes(fileSize)} · {result.length.toLocaleString()} 字符
              </span>
            </>
          )}
        </div>
      </div>

      <div className="field" style={{ minWidth: 0 }}>
        <span className="field-label">Base64 → 图片（粘贴解码预览）</span>
        <textarea
          className="glass-input"
          style={{ width: '100%', height: 90, resize: 'vertical' }}
          placeholder="粘贴 data:image/...;base64,xxxx 或纯 Base64 字符串"
          value={decodeInput}
          onChange={(e) => setDecodeInput(e.target.value)}
        />
        <div className="input-row">
          <button className="glossy-btn small" onClick={handleDecode}>
            解码预览
          </button>
          {status === 'decoded' && <span className="input-suffix">解码成功 · {result}</span>}
          {status === 'error' && <span className="input-suffix task-error">{result}</span>}
        </div>
      </div>

      {status === 'ready' && (
        <div className="field" style={{ minWidth: 0 }}>
          <div className="input-row">
            <button className="glossy-btn small" onClick={copyResult}>
              复制 Base64
            </button>
            <button className="glossy-btn blue small" onClick={downloadTxt}>
              下载 .txt
            </button>
          </div>
          <textarea
            className="glass-input"
            style={{ width: '100%', height: 110, resize: 'vertical' }}
            readOnly
            value={result.slice(0, 4000) + (result.length > 4000 ? '\n…（已截断，请复制/下载完整内容）' : '')}
          />
        </div>
      )}

      {previewUrl && (
        <div className="field" style={{ minWidth: 0 }}>
          <span className="field-label">预览</span>
          <img
            src={previewUrl}
            alt="base64 预览"
            style={{ maxWidth: 240, maxHeight: 180, borderRadius: 8, border: '1px solid rgba(255,255,255,0.6)' }}
          />
        </div>
      )}
    </div>
  )
}
