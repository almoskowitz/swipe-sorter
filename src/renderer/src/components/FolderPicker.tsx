import { useState } from 'react'

interface FolderPickerProps {
  onFolderChosen: (path: string) => void
  onSlicePdf: () => void
}

export function FolderPicker({ onFolderChosen, onSlicePdf }: FolderPickerProps) {
  const [dragging, setDragging] = useState(false)

  const handleChoose = async () => {
    const path = await window.api.openFolder()
    if (path) onFolderChosen(path)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = () => setDragging(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const item = e.dataTransfer.items[0]
    if (item?.kind === 'file') {
      const file = item.getAsFile()
      if (file) {
        // webkitRelativePath or path — Electron provides the real path
        const path = (file as unknown as { path: string }).path
        if (path) onFolderChosen(path)
      }
    }
  }

  return (
    <div className="picker-screen">
      <div className="picker-logo">⇄</div>
      <h1 className="picker-title">Swipe Sorter</h1>
      <p className="picker-sub">Choose a folder to sort its files one by one</p>
      <div
        className={`picker-dropzone${dragging ? ' picker-dropzone--active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleChoose}
      >
        <span className="picker-dropzone-icon">📁</span>
        <span>Drop a folder here or click to browse</span>
      </div>
      <div className="picker-tools">
        <button className="picker-tool-btn" onClick={onSlicePdf}>
          <span>✂</span> PDF Slicer
        </button>
      </div>
    </div>
  )
}
