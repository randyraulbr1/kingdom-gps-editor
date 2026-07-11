import type { Kysely } from 'kysely'
import type { Database } from '../database/schema'
import { generateULID } from '../utils/idGenerator'
import type {
  Position,
  WorldZone,
  CreateWorldZoneRequest,
  UpdateWorldZoneRequest
} from '@shared-types/world'

interface WorldZoneRow {
  zone_id: string
  name: string
  color: string
  points: string
  properties: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

function toZone(row: WorldZoneRow): WorldZone {
  return {
    zoneId: row.zone_id,
    name: row.name,
    color: row.color,
    points: JSON.parse(row.points) as Position[],
    properties: JSON.parse(row.properties),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at
  }
}

function toRow(zone: WorldZone): Record<string, unknown> {
  return {
    zone_id: zone.zoneId,
    name: zone.name,
    color: zone.color,
    points: JSON.stringify(zone.points ?? []),
    properties: JSON.stringify(zone.properties ?? {}),
    created_at: zone.createdAt,
    updated_at: zone.updatedAt,
    deleted_at: zone.deletedAt
  }
}

/**
 * Persisted (SQLite/libSQL) backing for World Editor zones (polygons).
 * Mirrors the WorldEntityRepository conventions: ULID primary key, soft delete,
 * JSON-in-TEXT for the vertex list.
 */
export class WorldZoneRepository {
  constructor(private db: Kysely<Database>) {}

  async create(request: CreateWorldZoneRequest): Promise<WorldZone> {
    const now = new Date().toISOString()
    const zone: WorldZone = {
      zoneId: generateULID(),
      name: request.name,
      color: request.color,
      points: request.points,
      properties: request.properties ?? {},
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    }
    await this.db
      .insertInto('world_zones')
      .values(toRow(zone) as never)
      .execute()
    return zone
  }

  async get(zoneId: string): Promise<WorldZone | undefined> {
    const row = await this.db
      .selectFrom('world_zones')
      .selectAll()
      .where('zone_id', '=', zoneId)
      .executeTakeFirst()
    return row ? toZone(row) : undefined
  }

  async update(request: UpdateWorldZoneRequest): Promise<WorldZone> {
    const current = await this.get(request.zoneId)
    if (!current) throw new Error(`Zona no encontrada: ${request.zoneId}`)

    const updated: WorldZone = {
      ...current,
      ...request.patch,
      updatedAt: new Date().toISOString()
    }
    const row = toRow(updated)
    await this.db
      .insertInto('world_zones')
      .values(row as never)
      .onConflict((oc) => oc.column('zone_id').doUpdateSet(row as never))
      .execute()
    return updated
  }

  /** Soft delete - keeps the row so it can be undone or synced as a tombstone. */
  async softDelete(zoneId: string): Promise<void> {
    await this.db
      .updateTable('world_zones')
      .set({ deleted_at: new Date().toISOString() })
      .where('zone_id', '=', zoneId)
      .execute()
  }

  async list(): Promise<WorldZone[]> {
    const rows = await this.db
      .selectFrom('world_zones')
      .selectAll()
      .where('deleted_at', 'is', null)
      .orderBy('created_at', 'asc')
      .execute()
    return rows.map(toZone)
  }
}
