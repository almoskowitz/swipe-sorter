import { useEffect } from 'react'
import type { Stack } from '../types'

interface KeyboardOptions {
  stacks: Stack[]
  onSort: (stackName: string) => void
  onSkip: () => void
  onUndo: () => void
  enabled: boolean
}

export function useKeyboard({ stacks, onSort, onSkip, onUndo, enabled }: KeyboardOptions): void {
  useEffect(() => {
    if (!enabled) return

    const handler = (e: KeyboardEvent): void => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          onSort(stacks[0].name)
          break
        case 'ArrowRight':
          e.preventDefault()
          onSort(stacks[stacks.length > 1 ? 1 : 0].name)
          break
        case ' ':
          e.preventDefault()
          onSkip()
          break
        case 'z':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault()
            onUndo()
          }
          break
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6': {
          const idx = parseInt(e.key) - 1
          if (stacks[idx]) {
            e.preventDefault()
            onSort(stacks[idx].name)
          }
          break
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [stacks, onSort, onSkip, onUndo, enabled])
}
