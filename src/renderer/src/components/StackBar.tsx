import type { Stack } from '../types'

interface StackBarProps {
  stacks: Stack[]
  onSort: (name: string) => void
  onSkip: () => void
}

function keyLabel(i: number, total: number): string {
  if (total === 2) return i === 0 ? '←' : '→'
  return String(i + 1)
}

export function StackBar({ stacks, onSort, onSkip }: StackBarProps) {
  return (
    <div className="stack-bar">
      {stacks.map((stack, i) => (
        <button
          key={stack.name}
          className="stack-btn"
          style={{ '--stack-color': stack.color } as React.CSSProperties}
          onClick={() => onSort(stack.name)}
          title={`Sort into "${stack.name}"`}
        >
          <span className="stack-btn-key">{keyLabel(i, stacks.length)}</span>
          <span className="stack-btn-name">{stack.name}</span>
        </button>
      ))}
      <button className="stack-btn stack-btn--skip" onClick={onSkip}>
        <span className="stack-btn-key">Space</span>
        <span className="stack-btn-name">Skip</span>
      </button>
    </div>
  )
}
