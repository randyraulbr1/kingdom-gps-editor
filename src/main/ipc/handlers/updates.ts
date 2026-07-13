/**
 * Actualización automática de la app (electron-updater + GitHub Releases).
 *
 * IPC sencillo (invoke/response) para el botón "Buscar actualizaciones" de
 * Configuración: comprobar si hay versión nueva y descargar+instalar.
 *
 * Requisitos para que funcione de verdad:
 *  - La app debe estar INSTALADA (empaquetada); en `npm run dev` se informa de
 *    que no aplica.
 *  - Debe existir una Release en GitHub con el instalador y su `latest.yml`
 *    (los genera electron-builder; el workflow de CI los adjunta al publicar un tag).
 */

import { app, ipcMain } from 'electron'
import electronUpdater from 'electron-updater'
import type { UpdateCheckResult } from '@shared-types/updates'

const { autoUpdater } = electronUpdater

/** Compara versiones "a.b.c"; devuelve 1 si a>b, -1 si a<b, 0 si iguales. */
function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0)
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const x = pa[i] ?? 0
    const y = pb[i] ?? 0
    if (x > y) return 1
    if (x < y) return -1
  }
  return 0
}

export function registerUpdateHandlers(): void {
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  ipcMain.handle('updates:getVersion', () => app.getVersion())

  ipcMain.handle('updates:check', async (): Promise<UpdateCheckResult> => {
    const currentVersion = app.getVersion()
    if (!app.isPackaged) {
      return {
        supported: false,
        currentVersion,
        message: 'Las actualizaciones automáticas solo funcionan en la app instalada (.exe), no en modo desarrollo.'
      }
    }
    try {
      const result = await autoUpdater.checkForUpdates()
      const latestVersion = result?.updateInfo?.version ?? currentVersion
      return {
        supported: true,
        available: compareVersions(latestVersion, currentVersion) > 0,
        currentVersion,
        latestVersion
      }
    } catch (error) {
      return {
        supported: true,
        available: false,
        currentVersion,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  })

  ipcMain.handle('updates:downloadAndInstall', async (): Promise<{ ok: boolean; message?: string }> => {
    if (!app.isPackaged) {
      return { ok: false, message: 'Solo disponible en la app instalada.' }
    }
    try {
      await autoUpdater.downloadUpdate()
      // Cerrar y reinstalar en el siguiente tick para que el IPC pueda responder.
      setImmediate(() => autoUpdater.quitAndInstall())
      return { ok: true }
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : String(error) }
    }
  })
}
