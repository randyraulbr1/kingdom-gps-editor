import { describe, it, expect } from 'vitest'
import { Kysely } from 'kysely'
import { createClient } from '@libsql/client'
import { LibsqlDialect } from '@libsql/kysely-libsql'
import { runMigrations } from '../database/migrationRunner'
import { ItemsRepository } from './itemsRepository'
import { createEmptyItemInput } from '@shared-types/item'
import type { Database } from '../database/schema'

async function setup(): Promise<{ repository: ItemsRepository }> {
  const client = createClient({ url: ':memory:' })
  await runMigrations(client)
  const db = new Kysely<Database>({ dialect: new LibsqlDialect({ client }) })
  return { repository: new ItemsRepository(db) }
}

describe('ItemsRepository', () => {
  it('creates an item with defaults and JSON array fields round-trip', async () => {
    const { repository } = await setup()

    const created = await repository.create({
      ...createEmptyItemInput(),
      name: 'Espada de prueba',
      category: 'weapon',
      rarity: 'rare',
      bonuses: [{ stat: 'attack', value: 5 }],
      flags: ['unique']
    })

    expect(created.id).toBeGreaterThan(0)
    expect(created.name).toBe('Espada de prueba')
    expect(created.bonuses).toEqual([{ stat: 'attack', value: 5 }])
    expect(created.flags).toEqual(['unique'])

    const fetched = await repository.get(created.id)
    expect(fetched).toEqual(created)
  })

  it('updates a partial patch without touching other fields', async () => {
    const { repository } = await setup()
    const created = await repository.create({ ...createEmptyItemInput(), name: 'Poción', value: 10 })

    const updated = await repository.update(created.id, { value: 25 })
    expect(updated.value).toBe(25)
    expect(updated.name).toBe('Poción')
  })

  it('queries with filters by category, rarity and search', async () => {
    const { repository } = await setup()
    await repository.create({ ...createEmptyItemInput(), name: 'Hacha', category: 'weapon', rarity: 'epic' })
    await repository.create({ ...createEmptyItemInput(), name: 'Manzana', category: 'food', rarity: 'common' })

    const weapons = await repository.query({ category: 'weapon' })
    expect(weapons.total).toBe(1)
    expect(weapons.items[0].name).toBe('Hacha')

    const bySearch = await repository.query({ search: 'manz' })
    expect(bySearch.total).toBe(1)
    expect(bySearch.items[0].category).toBe('food')
  })

  it('bulk updates several items at once', async () => {
    const { repository } = await setup()
    const a = await repository.create({ ...createEmptyItemInput(), name: 'A' })
    const b = await repository.create({ ...createEmptyItemInput(), name: 'B' })

    const updated = await repository.bulkUpdate([a.id, b.id], { requiredLevel: 12 })
    expect(updated.map((item) => item.requiredLevel)).toEqual([12, 12])
  })

  it('restoreWithId re-inserts a full snapshot at the same id (undo-a-delete / redo-a-create)', async () => {
    const { repository } = await setup()
    const created = await repository.create({ ...createEmptyItemInput(), name: 'Escudo' })
    await repository.delete(created.id)

    expect(await repository.get(created.id)).toBeUndefined()

    const restored = await repository.restoreWithId(created)
    expect(restored.id).toBe(created.id)
    expect(restored.name).toBe('Escudo')
    expect(await repository.get(created.id)).toEqual(created)
  })
})
