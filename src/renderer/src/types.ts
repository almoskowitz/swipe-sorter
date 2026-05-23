export interface FileEntry {
  name: string
  fullPath: string
  ext: string
  size: number
}

export interface Stack {
  name: string
  color: string
}

export interface HistoryEntry {
  file: FileEntry
  originalPath: string
  movedTo: string
  stackName: string
}

export type Screen = 'picker' | 'configurator' | 'sorting' | 'done' | 'slicer'
