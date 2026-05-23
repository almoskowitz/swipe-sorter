import { useEffect, useState } from 'react'
import type { FileEntry } from '../types'

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'bmp', 'tiff', 'svg'])
const VIDEO_EXTS = new Set(['mp4', 'mov', 'm4v', 'webm', 'avi'])
const TEXT_EXTS = new Set(['txt', 'md', 'csv', 'json', 'xml', 'yaml', 'yml', 'log', 'sh'])

interface FilePreviewProps {
  file: FileEntry
}

function fileUrl(path: string): string {
  return `localfile://${path}`
}

function ImagePreview({ file }: { file: FileEntry }) {
  return (
    <img
      src={fileUrl(file.fullPath)}
      alt={file.name}
      style={{
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
        display: 'block',
        margin: 'auto'
      }}
    />
  )
}

function PdfPreview({ file }: { file: FileEntry }) {
  return (
    <iframe
      src={`${fileUrl(file.fullPath)}#toolbar=0&navpanes=0&zoom=page-fit`}
      style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
      title={file.name}
    />
  )
}

function VideoPreview({ file }: { file: FileEntry }) {
  return (
    <video
      src={fileUrl(file.fullPath)}
      controls
      style={{ maxWidth: '100%', maxHeight: '100%', display: 'block', margin: 'auto' }}
    />
  )
}

function TextPreview({ file }: { file: FileEntry }) {
  const [content, setContent] = useState<string | null>(null)

  useEffect(() => {
    setContent(null)
    window.api.readText(file.fullPath).then(setContent)
  }, [file.fullPath])

  if (content === null) {
    return <div className="preview-loading">Loading…</div>
  }

  if (file.ext === 'md') {
    return (
      <div
        className="preview-markdown"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      />
    )
  }

  return (
    <pre className="preview-text">{content}</pre>
  )
}

function renderMarkdown(text: string): string {
  // Simple inline markdown — avoids async import complexity
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}

function HtmlPreview({ file }: { file: FileEntry }) {
  return (
    <webview
      src={fileUrl(file.fullPath)}
      style={{ width: '100%', height: '100%' }}
    />
  )
}

function HeicUnsupported({ file }: { file: FileEntry }) {
  return (
    <div className="preview-unsupported">
      <div className="preview-unsupported-icon">🖼</div>
      <div className="preview-unsupported-name">{file.name}</div>
      <div className="preview-unsupported-msg">HEIC preview unavailable</div>
      <button className="preview-open-btn" onClick={() => window.api.openPath(file.fullPath)}>
        Open in Preview
      </button>
    </div>
  )
}

function Unknown({ file }: { file: FileEntry }) {
  return (
    <div className="preview-unsupported">
      <div className="preview-unsupported-icon">📄</div>
      <div className="preview-unsupported-name">{file.name}</div>
      <div className="preview-unsupported-msg">No preview available — press a key to sort</div>
      <button className="preview-open-btn" onClick={() => window.api.openPath(file.fullPath)}>
        Open File
      </button>
    </div>
  )
}

export function FilePreview({ file }: FilePreviewProps) {
  const ext = file.ext.toLowerCase()

  if (IMAGE_EXTS.has(ext)) return <ImagePreview file={file} />
  if (ext === 'pdf') return <PdfPreview file={file} />
  if (VIDEO_EXTS.has(ext)) return <VideoPreview file={file} />
  if (TEXT_EXTS.has(ext)) return <TextPreview file={file} />
  if (ext === 'html' || ext === 'htm') return <HtmlPreview file={file} />
  if (ext === 'heic') return <HeicUnsupported file={file} />
  return <Unknown file={file} />
}
