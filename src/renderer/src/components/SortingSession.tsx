import { useCallback } from 'react'
import { useKeyboard } from '../hooks/useKeyboard'
import { FilePreview } from './FilePreview'
import { ProgressBar } from './ProgressBar'
import { StackBar } from './StackBar'
import { UndoToast } from './UndoToast'
import { formatSize } from '../utils'
import type { FileEntry, Stack, HistoryEntry } from '../types'

interface SortingSessionProps {
  folderPath: string
  files: FileEntry[]
  currentIndex: number
  currentFile: FileEntry | null
  stacks: Stack[]
  history: HistoryEntry[]
  toast: string | null
  error: string | null
  onSort: (stackName: string) => void
  onSkip: () => void
  onUndo: () => void
  onConfigureStacks: () => void
}

export function SortingSession({
  folderPath,
  files,
  currentIndex,
  currentFile,
  stacks,
  toast,
  error,
  onSort,
  onSkip,
  onUndo,
  onConfigureStacks
}: SortingSessionProps) {
  const handleSort = useCallback((name: string) => onSort(name), [onSort])
  const handleSkip = useCallback(() => onSkip(), [onSkip])
  const handleUndo = useCallback(() => onUndo(), [onUndo])

  useKeyboard({
    stacks,
    onSort: handleSort,
    onSkip: handleSkip,
    onUndo: handleUndo,
    enabled: true
  })

  const folderName = folderPath.split('/').pop() ?? folderPath

  return (
    <div className="sorting-screen">
      <div className="sorting-header">
        <span className="sorting-folder" title={folderPath}>{folderName}</span>
        <ProgressBar current={currentIndex} total={files.length} />
        <button className="sorting-config-btn" onClick={onConfigureStacks} title="Configure stacks">
          ⚙
        </button>
      </div>

      <div className="sorting-preview">
        {currentFile ? (
          <FilePreview file={currentFile} />
        ) : (
          <div className="preview-loading">Loading…</div>
        )}
      </div>

      {currentFile && (
        <div className="sorting-info">
          <span className="sorting-filename">{currentFile.name}</span>
          <span className="sorting-meta">
            {formatSize(currentFile.size)} • {currentFile.ext.toUpperCase() || 'file'}
          </span>
        </div>
      )}

      <StackBar stacks={stacks} onSort={handleSort} onSkip={handleSkip} />

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => {}}>✕</button>
        </div>
      )}

      <UndoToast message={toast} onUndo={handleUndo} />
    </div>
  )
}
