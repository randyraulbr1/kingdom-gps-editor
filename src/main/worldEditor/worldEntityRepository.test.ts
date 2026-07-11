import { describe, it, expect } from 'vitest'
import { Kysely } from 'kysely'
import { createClient } from '@libsql/client'
import { LibsqlDialect } from '@libsql/kysely-libsql'
import { runMigrations } from '../database/migrationRunner'
import { WorldEntityRepository } from './worldEntityRepository'
import { WorldEntityType } from '@shared-types/world'
import type { Database } from '../database/schema'

async function setup(): Promise<{ repository: WorldEntityRepository }> {
  const client = createClient({ url: ':memory:' })
  await runMigrations(client)
  const db = new Kysely<Database>({ dialect: new LibsqlDialect({ client }) })
  return { repository: new WorldEntityRepository(db) }
}

describe('WorldEntityRepository', () => {
  it('creates an entity with a ULID worldId and Fase-A defaults', async () => {
    const { repository } = await setup()

    const entity = await repository.create({
      entityType: WorldEntityType.Chest,
      entityId: null,
      name: 'Cofre del tesoro',
      position: { lat: 19.43, lng: -99.13 },
      properties: { loot: 'gold' }
    })

    expect(entity.worldId).toHaveLength(26)
    expect(entity.syncStatus).toBe('local')
    expect(entity.enabled).toBe(true)

    const fetched = await repository.get(entity.worldId)
    expect(fetched).toEqual(entity)
  })

  it('move() updates position and bumps localVersion', async () => {
    const { repository } = await setup()
    const entity = await repository.create({
      entityType: WorldEntityType.Npc,
      entityId: null,
      name: 'Guardia',
      position: { lat: 0, lng: 0 },
      properties: {}
    })

    const moved = await repository.move(entity.worldId, { lat: 5, lng: 5 })
    expect(moved.position).toEqual({ lat: 5, lng: 5 })
    expect(moved.localVersion).toBe(2)
  })

  it('softDelete keeps the row (recoverable) while query() excludes it', async () => {
    const { repository } = await setup()
    const entity = await repository.create({
      entityType: WorldEntityType.Enemy,
      entityId: null,
      name: 'Orco',
      position: { lat: 1, lng: 1 },
      properties: {}
    })

    await repository.softDelete(entity.worldId)

    const stillThere = await repository.get(entity.worldId)
    expect(stillThere?.deletedAt).not.toBeNull()

    const { total } = await repository.query({})
    expect(total).toBe(0)
  })

  it('hardDelete actually removes the row', async () => {
    const { repository } = await setup()
    const entity = await repository.create({
      entityType: WorldEntityType.Marker,
      entityId: null,
      name: 'Marca',
      position: { lat: 0, lng: 0 },
      properties: {}
    })

    await repository.hardDelete(entity.worldId)
    expect(await repository.get(entity.worldId)).toBeUndefined()
  })

  it('restoreWithId upserts a full snapshot back at the same worldId (undo primitive)', async () => {
    const { repository } = await setup()
    const entity = await repository.create({
      entityType: WorldEntityType.Zone,
      entityId: null,
      name: 'Zona segura',
      position: { lat: 2, lng: 2 },
      properties: {}
    })
    await repository.softDelete(entity.worldId)

    const restored = await repository.restoreWithId(entity)
    expect(restored.deletedAt).toBeNull()

    const fetched = await repository.get(entity.worldId)
    expect(fetched).toEqual(entity)
  })

  it('query() filters by entityType and boundingBox', async () => {
    const { repository } = await setup()
    await repository.create({
      entityType: WorldEntityType.Shop,
      entityId: null,
      name: 'Tienda central',
      position: { lat: 10, lng: 10 },
      properties: {}
    })
    await repository.create({
      entityType: WorldEntityType.Shop,
      entityId: null,
      name: 'Tienda lejana',
      position: { lat: 80, lng: 80 },
      properties: {}
    })

    const byType = await repository.query({ entityType: WorldEntityType.Shop })
    expect(byType.total).toBe(2)

    const byBox = await repository.query({ boundingBox: { north: 20, south: 0, east: 20, west: 0 } })
    expect(byBox.total).toBe(1)
    expect(byBox.items[0].name).toBe('Tienda central')
  })
})
