import { useEffect, useState } from 'react'
import type { Stack } from '../types'
import { join } from '../utils'

interface DoneScreenProps {
  folderPath: string
  totalFiles: number
  skippedCount: number
  stacks: Stack[]
  onReset: () => void
}

export function DoneScreen({ folderPath, totalFiles, skippedCount, stacks, onReset }: DoneScreenProps) {
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    Promise.all(
      stacks.map(async (s) => {
        const count = await window.api.countFiles(join(folderPath, s.name))
        return [s.name, count] as const
      })
    ).then((pairs) => setCounts(Object.fromEntries(pairs)))
  }, [folderPath, stacks])

  return (
    <div className="done-screen">
      <div className="done-icon">✓</div>
      <h2 className="done-title">All done!</h2>
      <p className="done-sub">{totalFiles} files processed</p>

      <div className="done-counts">
        {stacks.map((s) => (
          <div key={s.name} className="done-count-item">
            <div className="done-count-swatch" style={{ background: s.color }} />
            <span className="done-count-name">{s.name}</span>
            <span className="done-count-num">{counts[s.name] ?? '…'}</span>
          </div>
        ))}
        {skippedCount > 0 && (
          <div className="done-count-item">
            <div className="done-count-swatch" style={{ background: '#888' }} />
            <span className="done-count-name">Skipped</span>
            <span className="done-count-num">{skippedCount}</span>
          </div>
        )}
      </div>

      <div className="done-actions">
        <button className="done-btn done-btn--primary" onClick={onReset}>
          Sort Another Folder
        </button>
        <button className="done-btn" onClick={() => window.api.openPath(folderPath)}>
          Open in Finder
        </button>
      </div>
    </div>
  )
}
