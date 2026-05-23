import { contextBridge, ipcRenderer } from 'electron'
import type { FileEntry } from '../main/ipc'

export type { FileEntry }

const api = {
  openFolder: (): Promise<string | null> => ipcRenderer.invoke('dialog:openFolder'),

  listFiles: (folderPath: string): Promise<FileEntry[]> =>
    ipcRenderer.invoke('fs:listFiles', folderPath),

  moveFile: (args: {
    srcPath: string
    destFolder: string
  }): Promise<{ success: boolean; destPath?: string; error?: string }> =>
    ipcRenderer.invoke('fs:moveFile', args),

  readText: (fullPath: string): Promise<string> => ipcRenderer.invoke('fs:readText', fullPath),

  countFiles: (folderPath: string): Promise<number> =>
    ipcRenderer.invoke('fs:countFiles', folderPath),

  openPath: (fullPath: string): Promise<void> => ipcRenderer.invoke('shell:openPath', fullPath),

  readConfig: (): Promise<Record<string, unknown>> => ipcRenderer.invoke('config:read'),
  writeConfig: (data: Record<string, unknown>): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('config:write', data),
  getConfigPath: (): Promise<string> => ipcRenderer.invoke('config:getPath'),

  openPdf: (): Promise<string | null> => ipcRenderer.invoke('dialog:openPdf'),
  slicePdf: (
    pdfPath: string
  ): Promise<{ success: boolean; outputDir?: string; pageCount?: number; error?: string }> =>
    ipcRenderer.invoke('pdf:slicePages', pdfPath),
  onSliceProgress: (
    cb: (progress: { current: number; total: number }) => void
  ): (() => void) => {
    const handler = (_: unknown, data: { current: number; total: number }) => cb(data)
    ipcRenderer.on('pdf:sliceProgress', handler)
    return () => ipcRenderer.removeListener('pdf:sliceProgress', handler)
  }
}

contextBridge.exposeInMainWorld('api', api)

declare global {
  interface Window {
    api: typeof api
  }
}
