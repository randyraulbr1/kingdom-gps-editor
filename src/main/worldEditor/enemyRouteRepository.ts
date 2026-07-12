import type { Kysely } from 'kysely'
import type { Database } from '../database/schema'
import { generateULID } from '../utils/idGenerator'
import type {
  Position,
  EnemyRoute,
  CreateEnemyRouteRequest,
  UpdateEnemyRouteRequest
} from '@shared-types/world'

interface EnemyRouteRow {
  route_id: string
  name: string
  color: string
  points: string
  properties: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

function toRoute(row: EnemyRouteRow): EnemyRoute {
  return {
    routeId: row.route_id,
    name: row.name,
    color: row.color,
    points: JSON.parse(row.points) as Position[],
    properties: JSON.parse(row.properties),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at
  }
}

function toRow(route: EnemyRoute): Record<string, unknown> {
  return {
    route_id: route.routeId,
    name: route.name,
    color: route.color,
    points: JSON.stringify(route.points ?? []),
    properties: JSON.stringify(route.properties ?? {}),
    created_at: route.createdAt,
    updated_at: route.updatedAt,
    deleted_at: route.deletedAt
  }
}

/**
 * Persisted (SQLite/libSQL) backing for World Editor enemy routes (polylines).
 * Mirrors WorldZoneRepository: ULID primary key, soft delete, JSON-in-TEXT for
 * the vertex list and the config (weighted enemies + spawn settings).
 */
export class EnemyRouteRepository {
  constructor(private db: Kysely<Database>) {}

  async create(request: CreateEnemyRouteRequest): Promise<EnemyRoute> {
    const now = new Date().toISOString()
    const route: EnemyRoute = {
      routeId: generateULID(),
      name: request.name,
      color: request.color,
      points: request.points,
      properties: request.properties ?? {},
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    }
    await this.db
      .insertInto('enemy_routes')
      .values(toRow(route) as never)
      .execute()
    return route
  }

  async get(routeId: string): Promise<EnemyRoute | undefined> {
    const row = await this.db
      .selectFrom('enemy_routes')
      .selectAll()
      .where('route_id', '=', routeId)
      .executeTakeFirst()
    return row ? toRoute(row) : undefined
  }

  async update(request: UpdateEnemyRouteRequest): Promise<EnemyRoute> {
    const current = await this.get(request.routeId)
    if (!current) throw new Error(`Ruta de enemigos no encontrada: ${request.routeId}`)

    const updated: EnemyRoute = {
      ...current,
      ...request.patch,
      updatedAt: new Date().toISOString()
    }
    const row = toRow(updated)
    await this.db
      .insertInto('enemy_routes')
      .values(row as never)
      .onConflict((oc) => oc.column('route_id').doUpdateSet(row as never))
      .execute()
    return updated
  }

  /** Soft delete - keeps the row so it can be undone or synced as a tombstone. */
  async softDelete(routeId: string): Promise<void> {
    await this.db
      .updateTable('enemy_routes')
      .set({ deleted_at: new Date().toISOString() })
      .where('route_id', '=', routeId)
      .execute()
  }

  async list(): Promise<EnemyRoute[]> {
    const rows = await this.db
      .selectFrom('enemy_routes')
      .selectAll()
      .where('deleted_at', 'is', null)
      .orderBy('created_at', 'asc')
      .execute()
    return rows.map(toRoute)
  }
}
