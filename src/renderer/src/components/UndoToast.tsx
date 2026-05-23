interface UndoToastProps {
  message: string | null
  onUndo: () => void
}

export function UndoToast({ message, onUndo }: UndoToastProps) {
  if (!message) return null
  return (
    <div className="toast">
      <span>{message}</span>
      <button className="toast-undo" onClick={onUndo}>Undo (⌘Z)</button>
    </div>
  )
}
