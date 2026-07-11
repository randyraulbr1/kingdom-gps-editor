export interface ProjectMetadata {
  name: string
  version: string
  createdAt: string
  schemaVersion: number
}

export interface OpenProjectInfo extends ProjectMetadata {
  /** Absolute path to the project's root folder */
  path: string
}

export interface RecentProjectEntry {
  path: string
  name: string
  lastOpenedAt: string
}

export interface ProjectHealthCheck {
  ok: boolean
  integrityCheck: 'ok' | 'failed'
  restoredFromBackup: boolean
  message?: string
}
