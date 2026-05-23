import { ipcMain, dialog, shell, app } from 'electron'
import { readdirSync, statSync, mkdirSync, renameSync, readFileSync, writeFileSync, existsSync } from 'fs'
import { join, basename, extname, parse } from 'path'
import { spawn } from 'child_process'
import { PDFDocument } from 'pdf-lib'

// Python script that uses macOS native PDFKit — orders of magnitude faster than pdf-lib
// for large files, and non-blocking (runs in a child process).
const QUARTZ_SCRIPT = `
import sys, os
pdf_path = sys.argv[1]
output_dir = sys.argv[2]
try:
    from Quartz import PDFDocument
    from Foundation import NSURL
except ImportError:
    print("FALLBACK", flush=True)
    sys.exit(2)
os.makedirs(output_dir, exist_ok=True)
url = NSURL.fileURLWithPath_(pdf_path)
pdf = PDFDocument.alloc().initWithURL_(url)
if pdf is None:
    print("ERROR:Could not open PDF", flush=True)
    sys.exit(1)
page_count = pdf.pageCount()
digits = max(3, len(str(page_count)))
for i in range(page_count):
    new_doc = PDFDocument.alloc().init()
    new_doc.insertPage_atIndex_(pdf.pageAtIndex_(i), 0)
    page_num = str(i + 1).zfill(digits)
    new_doc.writeToFile_(os.path.join(output_dir, f"page-{page_num}.pdf"))
    print(f"PROGRESS:{i+1}:{page_count}", flush=True)
print("DONE", flush=True)
`

function sliceWithPython(
  pdfPath: string,
  outputDir: string,
  onProgress: (current: number, total: number) => void
): Promise<'ok' | 'fallback'> {
  return new Promise((resolve, reject) => {
    const py = spawn('python3', ['-', pdfPath, outputDir], { stdio: ['pipe', 'pipe', 'pipe'] })
    py.stdin.write(QUARTZ_SCRIPT)
    py.stdin.end()

    let stderr = ''
    py.stderr.on('data', (d: Buffer) => { stderr += d.toString() })

    py.stdout.on('data', (data: Buffer) => {
      for (const line of data.toString().split('\n')) {
        if (line.startsWith('PROGRESS:')) {
          const [, cur, tot] = line.split(':')
          onProgress(parseInt(cur), parseInt(tot))
        } else if (line === 'FALLBACK') {
          resolve('fallback')
        }
      }
    })

    py.on('close', (code) => {
      if (code === 0) resolve('ok')
      else if (code === 2) resolve('fallback')
      else reject(new Error(stderr || `python3 exited with code ${code}`))
    })

    py.on('error', () => resolve('fallback'))
  })
}

async function sliceWithPdfLib(
  pdfPath: string,
  outputDir: string,
  onProgress: (current: number, total: number) => void
): Promise<void> {
  const pdfBytes = readFileSync(pdfPath)
  const srcDoc = await PDFDocument.load(pdfBytes)
  const pageCount = srcDoc.getPageCount()
  mkdirSync(outputDir, { recursive: true })
  const digits = Math.max(3, String(pageCount).length)
  for (let i = 0; i < pageCount; i++) {
    const pageDoc = await PDFDocument.create()
    const [copied] = await pageDoc.copyPages(srcDoc, [i])
    pageDoc.addPage(copied)
    const pageNum = String(i + 1).padStart(digits, '0')
    writeFileSync(join(outputDir, `page-${pageNum}.pdf`), await pageDoc.save())
    onProgress(i + 1, pageCount)
  }
}

const CONFIG_PATH = join(app.getPath('userData'), 'config.json')

export interface FileEntry {
  name: string
  fullPath: string
  ext: string
  size: number
}

export function registerIpcHandlers(): void {
  ipcMain.handle('dialog:openFolder', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    if (result.canceled) return null
    return result.filePaths[0]
  })

  ipcMain.handle('fs:listFiles', (_, folderPath: string): FileEntry[] => {
    const entries = readdirSync(folderPath)
    return entries
      .filter((name) => !name.startsWith('.'))
      .map((name) => {
        const fullPath = join(folderPath, name)
        try {
          const stat = statSync(fullPath)
          if (stat.isDirectory()) return null
          return {
            name,
            fullPath,
            ext: extname(name).toLowerCase().slice(1),
            size: stat.size
          }
        } catch {
          return null
        }
      })
      .filter((e): e is FileEntry => e !== null)
  })

  ipcMain.handle(
    'fs:moveFile',
    (_, { srcPath, destFolder }: { srcPath: string; destFolder: string }) => {
      try {
        mkdirSync(destFolder, { recursive: true })
        const fileName = basename(srcPath)
        let destPath = join(destFolder, fileName)

        if (existsSync(destPath)) {
          const { name, ext } = parse(fileName)
          let counter = 2
          while (existsSync(join(destFolder, `${name}_${counter}${ext}`))) counter++
          destPath = join(destFolder, `${name}_${counter}${ext}`)
        }

        renameSync(srcPath, destPath)
        return { success: true, destPath }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  )

  ipcMain.handle('fs:readText', (_, fullPath: string): string => {
    const content = readFileSync(fullPath, 'utf-8')
    return content.slice(0, 50000)
  })

  ipcMain.handle('fs:countFiles', (_, folderPath: string): number => {
    try {
      return readdirSync(folderPath).filter((n) => !n.startsWith('.')).length
    } catch {
      return 0
    }
  })

  ipcMain.handle('shell:openPath', (_, fullPath: string) => {
    shell.openPath(fullPath)
  })

  ipcMain.handle('config:read', (): Record<string, unknown> => {
    try {
      if (!existsSync(CONFIG_PATH)) return {}
      return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'))
    } catch {
      return {}
    }
  })

  ipcMain.handle('config:write', (_, data: Record<string, unknown>) => {
    try {
      mkdirSync(app.getPath('userData'), { recursive: true })
      writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf-8')
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle('config:getPath', (): string => CONFIG_PATH)

  ipcMain.handle('dialog:openPdf', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    })
    if (result.canceled) return null
    return result.filePaths[0]
  })

  ipcMain.handle('pdf:slicePages', async (event, pdfPath: string) => {
    const { name } = parse(pdfPath)
    const outputDir = join(parse(pdfPath).dir, name)
    const sendProgress = (current: number, total: number) =>
      event.sender.send('pdf:sliceProgress', { current, total })

    try {
      const result = await sliceWithPython(pdfPath, outputDir, sendProgress)
      if (result === 'fallback') {
        // python3/Quartz not available — fall back to pdf-lib
        event.sender.send('pdf:sliceProgress', { current: 0, total: 0 })
        await sliceWithPdfLib(pdfPath, outputDir, sendProgress)
      }
      const pageCount = readdirSync(outputDir).filter((f) => f.endsWith('.pdf')).length
      return { success: true, outputDir, pageCount }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })
}
