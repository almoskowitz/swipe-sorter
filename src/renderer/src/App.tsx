import React, { useState } from 'react'
import { useSession, DEFAULT_STACKS } from './hooks/useSession'
import { FolderPicker } from './components/FolderPicker'
import { StackConfigurator } from './components/StackConfigurator'
import { SortingSession } from './components/SortingSession'
import { DoneScreen } from './components/DoneScreen'
import { PdfSlicer } from './components/PdfSlicer'
import type { Screen, Stack } from './types'

function TitleBar() {
  return <div className="title-bar" />
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('picker')
  const [pendingFolder, setPendingFolder] = useState<string>('')
  const session = useSession()

  const handleFolderChosen = (path: string) => {
    setPendingFolder(path)
    setScreen('configurator')
  }

  const handleStartSorting = async (stacks: Stack[]) => {
    await session.initSession(pendingFolder, stacks)
    setScreen('sorting')
  }

  const handleReset = () => {
    setPendingFolder('')
    setScreen('picker')
  }

  let content: React.ReactNode = null

  if (screen === 'picker') {
    content = <FolderPicker onFolderChosen={handleFolderChosen} onSlicePdf={() => setScreen('slicer')} />
  } else if (screen === 'slicer') {
    content = <PdfSlicer onBack={() => setScreen('picker')} />
  } else if (screen === 'configurator') {
    content = (
      <StackConfigurator
        folderPath={pendingFolder}
        initialStacks={session.stacks.length >= 2 ? session.stacks : DEFAULT_STACKS}
        onStart={handleStartSorting}
        onBack={() => setScreen('picker')}
      />
    )
  } else if (screen === 'sorting') {
    if (session.isDone) {
      content = (
        <DoneScreen
          folderPath={session.folderPath}
          totalFiles={session.files.length}
          skippedCount={session.skipped.size}
          stacks={session.stacks}
          onReset={handleReset}
        />
      )
    } else {
      content = (
        <SortingSession
          folderPath={session.folderPath}
          files={session.files}
          currentIndex={session.currentIndex}
          currentFile={session.currentFile}
          stacks={session.stacks}
          history={session.history}
          toast={session.toast}
          error={session.error}
          onSort={session.sortFile}
          onSkip={session.skip}
          onUndo={session.undo}
          onConfigureStacks={() => setScreen('configurator')}
        />
      )
    }
  }

  return (
    <>
      {screen !== 'sorting' && <TitleBar />}
      {content}
    </>
  )
}
