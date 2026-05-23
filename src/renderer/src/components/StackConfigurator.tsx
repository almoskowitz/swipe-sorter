import { useState } from 'react'
import type { Stack } from '../types'

const COLORS = [
  '#e05555', '#4caf70', '#5a9ee0', '#e0a840', '#9b59b6',
  '#e07d55', '#55d4e0', '#c0e055', '#e055a8', '#55e09b'
]

interface StackConfiguratorProps {
  folderPath: string
  initialStacks: Stack[]
  onStart: (stacks: Stack[]) => void
  onBack: () => void
}

export function StackConfigurator({ folderPath, initialStacks, onStart, onBack }: StackConfiguratorProps) {
  const [stacks, setStacks] = useState<Stack[]>(initialStacks)

  const updateName = (i: number, name: string) => {
    setStacks((prev) => prev.map((s, idx) => (idx === i ? { ...s, name } : s)))
  }

  const addStack = () => {
    const color = COLORS[stacks.length % COLORS.length]
    setStacks((prev) => [...prev, { name: `Stack ${prev.length + 1}`, color }])
  }

  const removeStack = (i: number) => {
    if (stacks.length <= 2) return
    setStacks((prev) => prev.filter((_, idx) => idx !== i))
  }

  const folderName = folderPath.split('/').pop() ?? folderPath

  const keyHint = (i: number, total: number): string => {
    if (total === 2) {
      return i === 0 ? '← Left' : 'Right →'
    }
    return `Key ${i + 1}`
  }

  return (
    <div className="config-screen">
      <button className="config-back" onClick={onBack}>← Back</button>
      <h2 className="config-title">Set up your stacks</h2>
      <p className="config-folder">Sorting: <strong>{folderName}</strong></p>
      <div className="config-list">
        {stacks.map((stack, i) => (
          <div key={i} className="config-item">
            <div className="config-swatch" style={{ background: stack.color }} />
            <input
              className="config-input"
              value={stack.name}
              onChange={(e) => updateName(i, e.target.value)}
              placeholder="Stack name"
              maxLength={30}
            />
            <span className="config-key-hint">{keyHint(i, stacks.length)}</span>
            <button
              className="config-remove"
              onClick={() => removeStack(i)}
              disabled={stacks.length <= 2}
              title="Remove stack"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button className="config-add" onClick={addStack}>+ Add Stack</button>
      <button
        className="config-start"
        onClick={() => onStart(stacks.filter((s) => s.name.trim()))}
        disabled={stacks.filter((s) => s.name.trim()).length < 2}
      >
        Start Sorting →
      </button>
    </div>
  )
}
