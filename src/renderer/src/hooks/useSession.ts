import { useState, useCallback, useEffect } from 'react'
import type { FileEntry, Stack, HistoryEntry } from '../types'
import { join } from '../utils'

export const DEFAULT_STACKS: Stack[] = [
  { name: 'No', color: '#e05555' },
  { name: 'Yes', color: '#4caf70' }
]

async function loadSavedStacks(): Promise<Stack[]> {
  try {
    const config = await window.api.readConfig()
    const stacks = config.stacks
    if (Array.isArray(stacks) && stacks.length >= 2) return stacks as Stack[]
  } catch {
    // ignore
  }
  return DEFAULT_STACKS
}

async function saveStacks(stacks: Stack[]): Promise<void> {
  try {
    const config = await window.api.readConfig()
    await window.api.writeConfig({ ...config, stacks })
  } catch {
    // ignore
  }
}

export function useSession() {
  const [folderPath, setFolderPath] = useState<string>('')
  const [files, setFiles] = useState<FileEntry[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [stacks, setStacks] = useState<Stack[]>(DEFAULT_STACKS)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [skipped, setSkipped] = useState<Set<number>>(new Set())
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSavedStacks().then(setStacks)
  }, [])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  const initSession = useCallback(async (path: string, sessionStacks: Stack[]) => {
    const fileList = await window.api.listFiles(path)
    setFolderPath(path)
    setFiles(fileList)
    setCurrentIndex(0)
    setStacks(sessionStacks)
    setHistory([])
    setSkipped(new Set())
    setError(null)
    saveStacks(sessionStacks)
  }, [])

  const sortFile = useCallback(
    async (stackName: string) => {
      if (currentIndex >= files.length) return
      const file = files[currentIndex]
      const destFolder = join(folderPath, stackName)
      const result = await window.api.moveFile({ srcPath: file.fullPath, destFolder })
      if (!result.success) {
        setError(`Failed to move file: ${result.error}`)
        return
      }
      setHistory((h) => [
        ...h,
        {
          file,
          originalPath: file.fullPath,
          movedTo: result.destPath!,
          stackName
        }
      ])
      setCurrentIndex((i) => i + 1)
      showToast(`Moved to "${stackName}"`)
    },
    [currentIndex, files, folderPath, showToast]
  )

  const skip = useCallback(() => {
    if (currentIndex >= files.length) return
    setSkipped((s) => new Set([...s, currentIndex]))
    setCurrentIndex((i) => i + 1)
    showToast('Skipped')
  }, [currentIndex, files.length, showToast])

  const undo = useCallback(async () => {
    if (history.length === 0) return
    const last = history[history.length - 1]
    const result = await window.api.moveFile({
      srcPath: last.movedTo,
      destFolder: folderPath
    })
    if (!result.success) {
      setError(`Undo failed: ${result.error}`)
      return
    }
    // Update the file's fullPath to reflect it's back in the root folder
    const restoredFile = { ...last.file, fullPath: result.destPath! }
    setFiles((prev) => {
      const next = [...prev]
      next[currentIndex - 1] = restoredFile
      return next
    })
    setHistory((h) => h.slice(0, -1))
    setCurrentIndex((i) => Math.max(0, i - 1))
    showToast('Undone')
  }, [history, folderPath, currentIndex, showToast])

  const updateStacks = useCallback((newStacks: Stack[]) => {
    setStacks(newStacks)
    saveStacks(newStacks)
  }, [])

  const currentFile = files[currentIndex] ?? null
  const isDone = files.length > 0 && currentIndex >= files.length

  return {
    folderPath,
    files,
    currentIndex,
    stacks,
    history,
    skipped,
    currentFile,
    isDone,
    toast,
    error,
    initSession,
    sortFile,
    skip,
    undo,
    updateStacks,
    setError
  }
}
