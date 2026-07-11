import { app } from 'electron'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { createDataSource, enableCrashSafeMode, type DataSourceHandle } from '../data/DataSource'
import { runMigrations } from '../database/migrationRunner'
import { createBackup, restoreLatestBackup, startBackupSchedule, stopBackupSchedule } from './backupService'
import type {
  OpenProjectInfo,
  ProjectMetadata,
  ProjectHealthCheck,
  RecentProjectEntry
} from '@shared-types/project'

const SCHEMA_VERSION = 1
const PROJECT_FILE = 'project.kgps.json'
const DB_FILE = 'data.sqlite'

function recentProjectsPath(): string {
  return path.join(app.getPath('userData'), 'recent-projects.json')
}

async function readRecent(): Promise<RecentProjectEntry[]> {
  try {
    const raw = await fs.readFile(recentProjectsPath(), 'utf-8')
    return JSON.parse(raw) as RecentProjectEntry[]
  } catch {
    return []
  }
}

async function touchRecent(projectPath: string, name: string): Promise<void> {
  const entries = await readRecent()
  const filtered = entries.filter((entry) => entry.path !== projectPath)
  filtered.unshift({ path: projectPath, name, lastOpenedAt: new Date().toISOString() })
  await fs.mkdir(path.dirname(recentProjectsPath()), { recursive: true })
  await fs.writeFile(recentProjectsPath(), JSON.stringify(filtered.slice(0, 10), null, 2), 'utf-8')
}

/**
 * Owns the single currently-open project (data source + metadata) and the
 * project lifecycle: create/open/close, crash recovery on open, and the
 * periodic backup schedule. Every IPC handler that touches game content goes
 * through `projectManager.getDb()` rather than opening its own connection.
 */
export class ProjectManager {
  private current: { info: OpenProjectInfo; dataSource: DataSourceHandle } | null = null

  getDb() {
    if (!this.current) throw new Error('No hay un proyecto abierto')
    return this.current.dataSource.db
  }

  getClient() {
    if (!this.current) throw new Error('No hay un proyecto abierto')
    return this.current.dataSource.client
  }

  getCurrentInfo(): OpenProjectInfo | null {
    return this.current?.info ?? null
  }

  async create(parentDir: string, name: string): Promise<OpenProjectInfo> {
    const projectPath = path.join(parentDir, name)
    await fs.mkdir(path.join(projectPath, 'assets', 'icons'), { recursive: true })
    await fs.mkdir(path.join(projectPath, 'export'), { recursive: true })
    await fs.mkdir(path.join(projectPath, 'backups'), { recursive: true })

    const metadata: ProjectMetadata = {
      name,
      version: '0.1.0',
      createdAt: new Date().toISOString(),
      schemaVersion: SCHEMA_VERSION
    }
    await fs.writeFile(path.join(projectPath, PROJECT_FILE), JSON.stringify(metadata, null, 2), 'utf-8')

    return this.open(projectPath)
  }

  /** Opens a project, restoring from the latest backup first if the db file fails PRAGMA integrity_check. */
  async open(projectPath: string): Promise<OpenProjectInfo> {
    if (this.current) {
      await this.close()
    }

    const metadataRaw = await fs.readFile(path.join(projectPath, PROJECT_FILE), 'utf-8')
    const metadata = JSON.parse(metadataRaw) as ProjectMetadata
    const dbPath = path.join(projectPath, DB_FILE)

    let dataSource = createDataSource(dbPath)
    await enableCrashSafeMode(dataSource.client)

    const integrity = await dataSource.client.execute('PRAGMA integrity_check')
    const integrityValue = integrity.rows[0]?.integrity_check as string | undefined
    if (integrityValue && integrityValue !== 'ok') {
      await dataSource.close()
      await restoreLatestBackup(projectPath)
      dataSource = createDataSource(dbPath)
      await enableCrashSafeMode(dataSource.client)
    }

    await runMigrations(dataSource.client)

    const info: OpenProjectInfo = { ...metadata, path: projectPath }
    this.current = { info, dataSource }

    await touchRecent(projectPath, metadata.name)
    startBackupSchedule(() => this.backupNow())

    return info
  }

  async close(): Promise<void> {
    if (!this.current) return
    stopBackupSchedule()
    await createBackup(this.current.info.path).catch(() => undefined)
    await this.current.dataSource.close()
    this.current = null
  }

  async listRecent(): Promise<RecentProjectEntry[]> {
    return readRecent()
  }

  async checkHealth(): Promise<ProjectHealthCheck> {
    if (!this.current) {
      return { ok: false, integrityCheck: 'failed', restoredFromBackup: false, message: 'No hay proyecto abierto' }
    }
    const result = await this.current.dataSource.client.execute('PRAGMA integrity_check')
    const value = result.rows[0]?.integrity_check as string
    const ok = value === 'ok'
    return { ok, integrityCheck: ok ? 'ok' : 'failed', restoredFromBackup: false, message: ok ? undefined : value }
  }

  async backupNow(): Promise<{ path: string }> {
    if (!this.current) throw new Error('No hay un proyecto abierto')
    const backupPath = await createBackup(this.current.info.path)
    return { path: backupPath }
  }
}

export const projectManager = new ProjectManager()
