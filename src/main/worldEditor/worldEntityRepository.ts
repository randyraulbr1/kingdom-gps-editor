import type { Kysely } from 'kysely'
import type { Database } from '../database/schema'
import { generateULID } from '../utils/idGenerator'
import {
  WorldSyncStatus,
  type WorldEntity,
  type CreateWorldEntityRequest,
  type UpdateWorldEntityRequest,
  type WorldEntityQuery,
  type Position,
  type PublishWorldSummary,
  type WorldSyncStatus_Response
} from '@shared-types/world'

interface WorldEntityRow {
  world_id: string
  entity_type: string
  entity_id: number | null
  name: string
  lat: number
  lng: number
  rotation: number
  enabled: number
  sync_status: string
  server_version: number
  local_version: number
  properties: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  last_sync_error: string | null
  sync_attempts: number
}

function toEntity(row: WorldEntityRow): WorldEntity {
  return {
    worldId: row.world_id,
    entityType: row.entity_type as WorldEntity['entityType'],
    entityId: row.entity_id,
    name: row.name,
    position: { lat: row.lat, lng: row.lng },
    rotation: row.rotation,
    enabled: row.enabled === 1,
    syncStatus: row.sync_status as WorldEntity['syncStatus'],
    serverVersion: row.server_version,
    localVersion: row.local_version,
    properties: JSON.parse(row.properties),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    lastSyncError: row.last_sync_error,
    syncAttempts: row.sync_attempts
  }
}

function toRow(entity: WorldEntity): Record<string, unknown> {
  return {
    world_id: entity.worldId,
    entity_type: entity.entityType,
    entity_id: entity.entityId,
    name: entity.name,
    lat: entity.position.lat,
    lng: entity.position.lng,
    rotation: entity.rotation,
    enabled: entity.enabled ? 1 : 0,
    sync_status: entity.syncStatus,
    server_version: entity.serverVersion,
    local_version: entity.localVersion,
    properties: JSON.stringify(entity.properties ?? {}),
    created_at: entity.createdAt,
    updated_at: entity.updatedAt,
    deleted_at: entity.deletedAt,
    last_sync_error: entity.lastSyncError,
    sync_attempts: entity.syncAttempts
  }
}

/**
 * Persisted (SQLite/libSQL) backing for the World Editor - replaces the
 * Fase-A in-memory `WorldEditorService`. worldId is a client-generated ULID
 * used as the primary key so it round-trips unchanged through future server
 * sync (Fase C).
 */
export class WorldEntityRepository {
  constructor(private db: Kysely<Database>) {}

  async create(request: CreateWorldEntityRequest): Promise<WorldEntity> {
    const now = new Date().toISOString()
    const entity: WorldEntity = {
      worldId: generateULID(),
      entityType: request.entityType,
      entityId: request.entityId,
      name: request.name,
      position: request.position,
      rotation: 0,
      enabled: true,
      syncStatus: WorldSyncStatus.Local,
      serverVersion: 0,
      localVersion: 1,
      properties: request.properties || {},
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      lastSyncError: null,
      syncAttempts: 0
    }
    await this.db
      .insertInto('world_entities')
      .values(toRow(entity) as never)
      .execute()
    return entity
  }

  async get(worldId: string): Promise<WorldEntity | undefined> {
    const row = await this.db
      .selectFrom('world_entities')
      .selectAll()
      .where('world_id', '=', worldId)
      .executeTakeFirst()
    return row ? toEntity(row) : undefined
  }

  async update(request: UpdateWorldEntityRequest): Promise<WorldEntity> {
    const current = await this.get(request.worldId)
    if (!current) throw new Error(`Entidad del mundo no encontrada: ${request.worldId}`)

    const updated: WorldEntity = {
      ...current,
      ...request.patch,
      updatedAt: new Date().toISOString(),
      localVersion: current.localVersion + 1,
      syncStatus: current.syncStatus === WorldSyncStatus.Synced ? WorldSyncStatus.Pending : current.syncStatus
    }
    await this.restoreWithId(updated)
    return updated
  }

  async move(worldId: string, position: Position): Promise<WorldEntity> {
    const current = await this.get(worldId)
    if (!current) throw new Error(`Entidad del mundo no encontrada: ${worldId}`)

    const updated: WorldEntity = {
      ...current,
      position,
      updatedAt: new Date().toISOString(),
      localVersion: current.localVersion + 1,
      syncStatus: current.syncStatus === WorldSyncStatus.Synced ? WorldSyncStatus.Pending : current.syncStatus
    }
    await this.restoreWithId(updated)
    return updated
  }

  /** Soft delete - keeps the row (with deletedAt set) so it can be undone or eventually synced as a tombstone. */
  async softDelete(worldId: string): Promise<WorldEntity> {
    const current = await this.get(worldId)
    if (!current) throw new Error(`Entidad del mundo no encontrada: ${worldId}`)

    const deleted: WorldEntity = {
      ...current,
      deletedAt: new Date().toISOString(),
      syncStatus: current.syncStatus === WorldSyncStatus.Local ? WorldSyncStatus.Local : WorldSyncStatus.DeletedPending,
      localVersion: current.localVersion + 1
    }
    await this.restoreWithId(deleted)
    return deleted
  }

  /** Real DELETE - only used to undo a create (the row should never have existed once undone). */
  async hardDelete(worldId: string): Promise<void> {
    await this.db.deleteFrom('world_entities').where('world_id', '=', worldId).execute()
  }

  async setEnabled(worldId: string, enabled: boolean): Promise<WorldEntity> {
    const current = await this.get(worldId)
    if (!current) throw new Error(`Entidad del mundo no encontrada: ${worldId}`)

    const updated: WorldEntity = {
      ...current,
      enabled,
      updatedAt: new Date().toISOString(),
      localVersion: current.localVersion + 1,
      syncStatus: current.syncStatus === WorldSyncStatus.Synced ? WorldSyncStatus.Pending : current.syncStatus
    }
    await this.restoreWithId(updated)
    return updated
  }

  async toggle(worldId: string): Promise<WorldEntity> {
    const current = await this.get(worldId)
    if (!current) throw new Error(`Entidad del mundo no encontrada: ${worldId}`)
    return this.setEnabled(worldId, !current.enabled)
  }

  /** Fija el estado de sincronización (usado por "Subir al mundo"). */
  async setSyncStatus(worldId: string, status: WorldSyncStatus, error: string | null = null): Promise<WorldEntity> {
    const current = await this.get(worldId)
    if (!current) throw new Error(`Entidad del mundo no encontrada: ${worldId}`)
    const updated: WorldEntity = {
      ...current,
      syncStatus: status,
      lastSyncError: error,
      updatedAt: new Date().toISOString()
    }
    await this.restoreWithId(updated)
    return updated
  }

  async duplicate(worldId: string): Promise<WorldEntity> {
    const original = await this.get(worldId)
    if (!original) throw new Error(`Entidad del mundo no encontrada: ${worldId}`)

    const now = new Date().toISOString()
    const copy: WorldEntity = {
      ...original,
      worldId: generateULID(),
      name: `${original.name} (copia)`,
      createdAt: now,
      updatedAt: now,
      syncStatus: WorldSyncStatus.Local,
      serverVersion: 0,
      localVersion: 1,
      deletedAt: null,
      lastSyncError: null,
      syncAttempts: 0
    }
    await this.db
      .insertInto('world_entities')
      .values(toRow(copy) as never)
      .execute()
    return copy
  }

  /** Upsert-by-worldId with a full snapshot - the one primitive undo/redo needs for create/update/move/toggle/delete. */
  async restoreWithId(entity: WorldEntity): Promise<WorldEntity> {
    const row = toRow(entity)
    await this.db
      .insertInto('world_entities')
      .values(row as never)
      .onConflict((oc) => oc.column('world_id').doUpdateSet(row as never))
      .execute()
    return entity
  }

  async query(query: WorldEntityQuery): Promise<{ items: WorldEntity[]; total: number }> {
    let base = this.db.selectFrom('world_entities').where('deleted_at', 'is', null)

    if (query.entityType) base = base.where('entity_type', '=', query.entityType)
    if (query.syncStatus) base = base.where('sync_status', '=', query.syncStatus)
    if (query.boundingBox) {
      const box = query.boundingBox
      base = base
        .where('lat', '>=', box.south)
        .where('lat', '<=', box.north)
        .where('lng', '>=', box.west)
        .where('lng', '<=', box.east)
    }

    const totalRow = await base.select(({ fn }) => [fn.countAll<number>().as('count')]).executeTakeFirst()
    const total = Number(totalRow?.count ?? 0)

    const rows = await base
      .selectAll()
      .orderBy('created_at', 'asc')
      .limit(query.limit ?? 500)
      .offset(query.offset ?? 0)
      .execute()

    return { items: rows.map(toEntity), total }
  }

  async listByType(entityType: string): Promise<WorldEntity[]> {
    const rows = await this.db
      .selectFrom('world_entities')
      .selectAll()
      .where('entity_type', '=', entityType)
      .where('deleted_at', 'is', null)
      .execute()
    return rows.map(toEntity)
  }

  async getAllEntities(): Promise<WorldEntity[]> {
    const rows = await this.db.selectFrom('world_entities').selectAll().where('deleted_at', 'is', null).execute()
    return rows.map(toEntity)
  }

  async getPublishSummary(): Promise<PublishWorldSummary> {
    const rows = await this.db.selectFrom('world_entities').select(['sync_status', 'deleted_at']).execute()

    const summary: PublishWorldSummary = {
      newCount: 0,
      modifiedCount: 0,
      movedCount: 0,
      deletedCount: 0,
      failedCount: 0,
      conflictCount: 0
    }

    for (const row of rows) {
      if (row.deleted_at) {
        if (row.sync_status === WorldSyncStatus.DeletedPending) summary.deletedCount++
        continue
      }
      if (row.sync_status === WorldSyncStatus.Local) summary.newCount++
      if (row.sync_status === WorldSyncStatus.Pending) summary.modifiedCount++
      if (row.sync_status === WorldSyncStatus.Failed) summary.failedCount++
      if (row.sync_status === WorldSyncStatus.Conflict) summary.conflictCount++
    }

    return summary
  }

  async getSyncStatus(): Promise<WorldSyncStatus_Response> {
    const rows = await this.db.selectFrom('world_entities').select('sync_status').execute()
    return {
      online: true,
      pendingCount: rows.filter((r) => r.sync_status === WorldSyncStatus.Pending).length,
      failedCount: rows.filter((r) => r.sync_status === WorldSyncStatus.Failed).length,
      conflictCount: rows.filter((r) => r.sync_status === WorldSyncStatus.Conflict).length,
      lastSyncAt: null,
      nextRetryAt: null
    }
  }
}
