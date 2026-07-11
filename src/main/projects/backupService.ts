import { promises as fs } from 'node:fs'
import path from 'node:path'

const MAX_BACKUPS = 10
const BACKUP_INTERVAL_MS = 10 * 60 * 1000

let intervalHandle: NodeJS.Timeout | null = null

function timestampSlug(): string {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

async function rotateBackups(backupsDir: string): Promise<void> {
  const entries = (await fs.readdir(backupsDir)).filter((f) => f.endsWith('.sqlite')).sort()
  const excess = entries.length - MAX_BACKUPS
  if (excess > 0) {
    for (const file of entries.slice(0, excess)) {
      await fs.unlink(path.join(backupsDir, file)).catch(() => undefined)
    }
  }
}

/** Copies data.sqlite into backups/ with a timestamped name and rotates old ones out (keeps the last 10). */
export async function createBackup(projectPath: string): Promise<string> {
  const dbPath = path.join(projectPath, 'data.sqlite')
  const backupsDir = path.join(projectPath, 'backups')
  await fs.mkdir(backupsDir, { recursive: true })

  const backupPath = path.join(backupsDir, `data-${timestampSlug()}.sqlite`)
  try {
    await fs.copyFile(dbPath, backupPath)
  } catch {
    return backupPath
  }
  await rotateBackups(backupsDir)
  return backupPath
}

export async function listBackups(projectPath: string): Promise<string[]> {
  const backupsDir = path.join(projectPath, 'backups')
  try {
    const entries = await fs.readdir(backupsDir)
    return entries.filter((f) => f.endsWith('.sqlite')).sort()
  } catch {
    return []
  }
}

/** Overwrites data.sqlite with the most recent backup. Used by ProjectManager.open() when integrity_check fails. */
export async function restoreLatestBackup(projectPath: string): Promise<boolean> {
  const backups = await listBackups(projectPath)
  if (backups.length === 0) return false
  const latest = backups[backups.length - 1]
  const dbPath = path.join(projectPath, 'data.sqlite')
  await fs.copyFile(path.join(projectPath, 'backups', latest), dbPath)
  return true
}

export function startBackupSchedule(onBackup: () => Promise<unknown>): void {
  stopBackupSchedule()
  intervalHandle = setInterval(() => {
    onBackup().catch(() => undefined)
  }, BACKUP_INTERVAL_MS)
}

export function stopBackupSchedule(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle)
    intervalHandle = null
  }
}
