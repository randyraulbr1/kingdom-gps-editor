/**
 * Utilidades del sistema del editor:
 *  - Captura de pantalla de la ventana (guardada con nombre único).
 *  - Configuración del servidor del juego (URL + token) para "Subir al mundo".
 *
 * La captura y la config viven en la carpeta userData del editor.
 */

import { ipcMain, app, BrowserWindow, shell } from 'electron'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { ServerConfig, CaptureResult } from '@shared-types/system'

const CAPTURES_DIR = (): string => path.join(app.getPath('userData'), 'capturas')
const SERVER_CONFIG_PATH = (): string => path.join(app.getPath('userData'), 'server.json')

/** Siguiente nombre libre captura-N.png que no exista ya. */
async function nextCaptureName(dir: string): Promise<string> {
  let existing: string[] = []
  try {
    existing = await fs.readdir(dir)
  } catch {
    existing = []
  }
  const used = new Set(existing)
  let i = 1
  while (used.has(`captura-${i}.png`)) i++
  return `captura-${i}.png`
}

export function registerSystemExtraHandlers(): void {
  ipcMain.handle('capture:window', async (): Promise<CaptureResult> => {
    const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
    if (!win) throw new Error('No hay ventana para capturar')
    const image = await win.webContents.capturePage()
    const dir = CAPTURES_DIR()
    await fs.mkdir(dir, { recursive: true })
    const name = await nextCaptureName(dir)
    const filePath = path.join(dir, name)
    await fs.writeFile(filePath, image.toPNG())
    // Abre el explorador con el archivo seleccionado para poder enviarlo fácil.
    shell.showItemInFolder(filePath)
    return { path: filePath, name }
  })

  ipcMain.handle('server:get', async (): Promise<ServerConfig> => {
    try {
      const raw = await fs.readFile(SERVER_CONFIG_PATH(), 'utf-8')
      const parsed = JSON.parse(raw) as Partial<ServerConfig>
      return { url: typeof parsed.url === 'string' ? parsed.url : '', token: typeof parsed.token === 'string' ? parsed.token : '' }
    } catch {
      return { url: '', token: '' }
    }
  })

  ipcMain.handle('server:set', async (_event, config: ServerConfig): Promise<void> => {
    const clean: ServerConfig = { url: (config.url ?? '').trim(), token: (config.token ?? '').trim() }
    await fs.writeFile(SERVER_CONFIG_PATH(), JSON.stringify(clean, null, 2), 'utf-8')
  })
}

/** Lee la config de servidor (usado por el handler de "Subir al mundo"). */
export async function readServerConfig(): Promise<ServerConfig> {
  try {
    const raw = await fs.readFile(SERVER_CONFIG_PATH(), 'utf-8')
    const parsed = JSON.parse(raw) as Partial<ServerConfig>
    return { url: typeof parsed.url === 'string' ? parsed.url : '', token: typeof parsed.token === 'string' ? parsed.token : '' }
  } catch {
    return { url: '', token: '' }
  }
}
