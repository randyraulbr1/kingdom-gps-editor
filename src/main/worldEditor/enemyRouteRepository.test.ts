import { describe, it, expect } from 'vitest'
import { Kysely } from 'kysely'
import { createClient } from '@libsql/client'
import { LibsqlDialect } from '@libsql/kysely-libsql'
import { runMigrations } from '../database/migrationRunner'
import { EnemyRouteRepository } from './enemyRouteRepository'
import type { Database } from '../database/schema'

async function setup(): Promise<{ repository: EnemyRouteRepository }> {
  const client = createClient({ url: ':memory:' })
  await runMigrations(client)
  const db = new Kysely<Database>({ dialect: new LibsqlDialect({ client }) })
  return { repository: new EnemyRouteRepository(db) }
}

const line = [
  { lat: 0, lng: 0 },
  { lat: 0, lng: 1 },
  { lat: 1, lng: 1 }
]

describe('EnemyRouteRepository', () => {
  it('creates a route with a ULID id and round-trips points + properties', async () => {
    const { repository } = await setup()

    const route = await repository.create({
      name: 'Bosque',
      color: '#ef4444',
      points: line,
      properties: { activationRadiusM: 40, entries: [{ id: 'e1', enemyName: 'Lobo', weight: 70 }] }
    })

    expect(route.routeId).toHaveLength(26)
    expect(route.points).toEqual(line)
    expect(route.properties.activationRadiusM).toBe(40)

    const fetched = await repository.get(route.routeId)
    expect(fetched).toEqual(route)
  })

  it('update() patches fields and keeps the same id', async () => {
    const { repository } = await setup()
    const route = await repository.create({ name: 'A', color: '#ef4444', points: line })

    const updated = await repository.update({ routeId: route.routeId, patch: { name: 'B', color: '#f97316' } })
    expect(updated.name).toBe('B')
    expect(updated.color).toBe('#f97316')
    expect(updated.routeId).toBe(route.routeId)
  })

  it('softDelete keeps the row but list() excludes it', async () => {
    const { repository } = await setup()
    const route = await repository.create({ name: 'Temporal', color: '#ef4444', points: line })

    await repository.softDelete(route.routeId)

    const stillThere = await repository.get(route.routeId)
    expect(stillThere?.deletedAt).not.toBeNull()

    const list = await repository.list()
    expect(list).toHaveLength(0)
  })
})
