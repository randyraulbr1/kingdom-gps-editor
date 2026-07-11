import { describe, it, expect } from 'vitest'
import { Kysely } from 'kysely'
import { createClient } from '@libsql/client'
import { LibsqlDialect } from '@libsql/kysely-libsql'
import { runMigrations } from '../database/migrationRunner'
import { WorldZoneRepository } from './worldZoneRepository'
import type { Database } from '../database/schema'

async function setup(): Promise<{ repository: WorldZoneRepository }> {
  const client = createClient({ url: ':memory:' })
  await runMigrations(client)
  const db = new Kysely<Database>({ dialect: new LibsqlDialect({ client }) })
  return { repository: new WorldZoneRepository(db) }
}

const triangle = [
  { lat: 0, lng: 0 },
  { lat: 0, lng: 1 },
  { lat: 1, lng: 0 }
]

describe('WorldZoneRepository', () => {
  it('creates a zone with a ULID id and round-trips its points', async () => {
    const { repository } = await setup()

    const zone = await repository.create({ name: 'Centro', color: '#1E90FF', points: triangle })

    expect(zone.zoneId).toHaveLength(26)
    expect(zone.points).toEqual(triangle)

    const fetched = await repository.get(zone.zoneId)
    expect(fetched).toEqual(zone)
  })

  it('update() patches fields and keeps the same id', async () => {
    const { repository } = await setup()
    const zone = await repository.create({ name: 'A', color: '#111111', points: triangle })

    const updated = await repository.update({ zoneId: zone.zoneId, patch: { name: 'B', color: '#22c55e' } })
    expect(updated.name).toBe('B')
    expect(updated.color).toBe('#22c55e')
    expect(updated.zoneId).toBe(zone.zoneId)
  })

  it('softDelete keeps the row but list() excludes it', async () => {
    const { repository } = await setup()
    const zone = await repository.create({ name: 'Temporal', color: '#ef4444', points: triangle })

    await repository.softDelete(zone.zoneId)

    const stillThere = await repository.get(zone.zoneId)
    expect(stillThere?.deletedAt).not.toBeNull()

    const list = await repository.list()
    expect(list).toHaveLength(0)
  })
})
