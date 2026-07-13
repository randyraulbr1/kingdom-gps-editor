import { describe, it, expect } from 'vitest'
import { Kysely } from 'kysely'
import { createClient } from '@libsql/client'
import { LibsqlDialect } from '@libsql/kysely-libsql'
import { runMigrations } from '../database/migrationRunner'
import { MonstersRepository } from './monstersRepository'
import { createEmptyMonsterInput } from '@shared-types/monster'
import type { Database } from '../database/schema'

async function setup(): Promise<{ repository: MonstersRepository }> {
  const client = createClient({ url: ':memory:' })
  await runMigrations(client)
  const db = new Kysely<Database>({ dialect: new LibsqlDialect({ client }) })
  return { repository: new MonstersRepository(db) }
}

describe('MonstersRepository', () => {
  it('creates a monster with stats and JSON array fields', async () => {
    const { repository } = await setup()
    const monster = await repository.create({
      ...createEmptyMonsterInput(),
      name: 'Lobo feroz',
      category: 'beast',
      level: 5,
      hp: 240,
      flags: ['aggressive']
    })

    expect(monster.id).toBeGreaterThan(0)
    expect(monster.name).toBe('Lobo feroz')
    expect(monster.level).toBe(5)
    expect(monster.hp).toBe(240)
    expect(monster.flags).toEqual(['aggressive'])

    const fetched = await repository.get(monster.id)
    expect(fetched).toEqual(monster)
  })

  it('update() patches fields and query() filters by category', async () => {
    const { repository } = await setup()
    const a = await repository.create({ ...createEmptyMonsterInput(), name: 'Esqueleto', category: 'undead' })
    await repository.create({ ...createEmptyMonsterInput(), name: 'Rata', category: 'beast' })

    const updated = await repository.update(a.id, { damage: 45, rarity: 'rare' })
    expect(updated.damage).toBe(45)
    expect(updated.rarity).toBe('rare')

    const undead = await repository.query({ category: 'undead' })
    expect(undead.total).toBe(1)
    expect(undead.items[0].name).toBe('Esqueleto')
  })

  it('bulkUpdate applies a patch to several monsters at once', async () => {
    const { repository } = await setup()
    const a = await repository.create({ ...createEmptyMonsterInput(), name: 'A' })
    const b = await repository.create({ ...createEmptyMonsterInput(), name: 'B' })

    const updated = await repository.bulkUpdate([a.id, b.id], { rarity: 'epic' })
    expect(updated).toHaveLength(2)
    expect(updated.every((m) => m.rarity === 'epic')).toBe(true)
  })

  it('restoreWithId re-inserts a full snapshot with its original id (undo/redo support)', async () => {
    const { repository } = await setup()
    const monster = await repository.create({ ...createEmptyMonsterInput(), name: 'Jefe', hp: 999 })
    await repository.delete(monster.id)
    expect(await repository.get(monster.id)).toBeUndefined()

    const restored = await repository.restoreWithId(monster)
    expect(restored).toEqual(monster)
    expect(await repository.get(monster.id)).toEqual(monster)
  })
})
