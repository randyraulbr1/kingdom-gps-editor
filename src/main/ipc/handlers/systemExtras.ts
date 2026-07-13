/**
 * Utilidades del sistema del editor:
 *  - Captura de pantalla de la ventana (guardada con nombre único).
 *  - Configuración del servidor del juego (URL + credenciales de admin) y su
 *    estado de conexión. La autenticación es automática (ver server/gameServer).
 *  - Administración de jugadores contra el servidor del juego.
 */

import { ipcMain, app, BrowserWindow, shell } from 'electron'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type {
  ServerConfig,
  CaptureResult,
  ServerAuthStatus,
  GamePlayer,
  CreatePlayerInput,
  PlayerAdminResult
} from '@shared-types/system'
import {
  readServerConfig,
  writeServerConfig,
  checkAuth,
  apiFetch,
  ServerError
} from '../../server/gameServer'

const CAPTURES_DIR = (): string => path.join(app.getPath('userData'), 'capturas')

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

/** Convierte cualquier error en un mensaje claro para la UI. */
function friendly(error: unknown, fallback: string): string {
  if (error instanceof ServerError) return error.message
  return error instanceof Error ? error.message : fallback
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
    shell.showItemInFolder(filePath)
    return { path: filePath, name }
  })

  // ===== Configuración del servidor (URL + credenciales de admin) =====

  ipcMain.handle('server:get', (): Promise<ServerConfig> => readServerConfig())

  ipcMain.handle('server:set', async (_event, config: ServerConfig): Promise<void> => {
    await writeServerConfig(config)
  })

  ipcMain.handle('server:checkAuth', async (): Promise<ServerAuthStatus> => checkAuth())

  // ===== Administración de jugadores (panel adm en el editor) =====

  /** Lista de jugadores del mundo (desde el snapshot del servidor). */
  ipcMain.handle('players:list', async (): Promise<GamePlayer[]> => {
    const data = await apiFetch<{ ok: boolean; jugadores?: GamePlayer[] }>('/api/player/admin-jugadores')
    return Array.isArray(data.jugadores) ? data.jugadores : []
  })

  /** Crea una cuenta de jugador de prueba (registro público, no requiere admin). */
  ipcMain.handle('players:create', async (_event, input: CreatePlayerInput): Promise<PlayerAdminResult> => {
    try {
      await apiFetch('/api/register', {
        method: 'POST',
        auth: false,
        body: { username: input.usuario, password: input.password, telefono: input.telefono ?? '' }
      })
      return { ok: true, message: `Jugador "${input.usuario}" creado.` }
    } catch (error) {
      return { ok: false, message: friendly(error, 'No se pudo crear el jugador.') }
    }
  })

  /** Limpia todas las cuentas del juego dejando solo la de admin (el servidor respalda antes). */
  ipcMain.handle('players:clearAll', async (): Promise<PlayerAdminResult> => {
    try {
      await apiFetch('/api/player/limpiar-cuentas', { method: 'POST', body: {} })
      return { ok: true, message: 'Cuentas limpiadas (se conservó la de admin y se respaldó antes).' }
    } catch (error) {
      return { ok: false, message: friendly(error, 'No se pudieron limpiar las cuentas.') }
    }
  })
}
