import { useState, useEffect, useRef } from 'react'

type SlicerState = 'idle' | 'loading' | 'slicing' | 'done' | 'error'

interface PdfSlicerProps {
  onBack: () => void
}

export function PdfSlicer({ onBack }: PdfSlicerProps) {
  const [state, setState] = useState<SlicerState>('idle')
  const [pdfPath, setPdfPath] = useState<string | null>(null)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [result, setResult] = useState<{ outputDir: string; pageCount: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const unlisten = window.api.onSliceProgress((p) => {
      setState('slicing')
      setProgress(p)
    })
    return unlisten
  }, [])

  useEffect(() => {
    if (state === 'loading' || state === 'slicing') {
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [state])

  const handlePickPdf = async () => {
    const path = await window.api.openPdf()
    if (path) setPdfPath(path)
  }

  const handleSlice = async () => {
    if (!pdfPath) return
    setState('loading')
    setProgress({ current: 0, total: 0 })
    const res = await window.api.slicePdf(pdfPath)
    if (res.success && res.outputDir && res.pageCount !== undefined) {
      setResult({ outputDir: res.outputDir, pageCount: res.pageCount })
      setState('done')
    } else {
      setError(res.error ?? 'Unknown error')
      setState('error')
    }
  }

  const handleReset = () => {
    setState('idle')
    setPdfPath(null)
    setProgress({ current: 0, total: 0 })
    setResult(null)
    setError(null)
    setElapsed(0)
  }

  const fileName = pdfPath ? pdfPath.split('/').pop() : null
  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0
  const elapsedStr = elapsed > 0 ? `${elapsed}s` : ''

  return (
    <div className="slicer-screen">
      <button className="config-back" onClick={onBack}>← Back</button>
      <div className="slicer-icon">✂</div>
      <h2 className="slicer-title">PDF Slicer</h2>
      <p className="slicer-sub">Split a PDF into one file per page</p>

      {state === 'idle' && (
        <div className="slicer-idle">
          <div className="slicer-pick-area" onClick={handlePickPdf}>
            {fileName ? (
              <>
                <span className="slicer-pick-icon">📄</span>
                <span className="slicer-pick-name">{fileName}</span>
                <span className="slicer-pick-change">Click to change</span>
              </>
            ) : (
              <>
                <span className="slicer-pick-icon">📄</span>
                <span>Click to choose a PDF</span>
              </>
            )}
          </div>
          <button className="config-start" onClick={handleSlice} disabled={!pdfPath}>
            Slice PDF →
          </button>
        </div>
      )}

      {state === 'loading' && (
        <div className="slicer-progress">
          <div className="slicer-spinner" />
          <p className="slicer-progress-label">Reading PDF… {elapsedStr}</p>
        </div>
      )}

      {state === 'slicing' && (
        <div className="slicer-progress">
          <div className="slicer-progress-bar">
            <div className="slicer-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="slicer-progress-label">
            Page {progress.current} of {progress.total} ({pct}%) — {elapsedStr}
          </p>
        </div>
      )}

      {state === 'done' && result && (
        <div className="slicer-done">
          <div className="done-icon" style={{ margin: '0 auto' }}>✓</div>
          <p className="slicer-done-msg">
            Split into <strong>{result.pageCount}</strong> pages
          </p>
          <div className="slicer-done-path">{result.outputDir}</div>
          <div className="done-actions">
            <button
              className="done-btn done-btn--primary"
              onClick={() => window.api.openPath(result.outputDir)}
            >
              Open in Finder
            </button>
            <button className="done-btn" onClick={handleReset}>
              Slice Another
            </button>
          </div>
        </div>
      )}

      {state === 'error' && (
        <div className="slicer-error">
          <p>Something went wrong:</p>
          <pre>{error}</pre>
          <button className="done-btn" onClick={handleReset}>Try Again</button>
        </div>
      )}
    </div>
  )
}
