import { describe, it, expect } from 'vitest'
import { Kysely } from 'kysely'
import { createClient } from '@libsql/client'
import { LibsqlDialect } from '@libsql/kysely-libsql'
import { runMigrations } from '../database/migrationRunner'
import { WeaponsRepository } from './weaponsRepository'
import { createEmptyWeaponInput } from '@shared-types/weapon'
import type { Database } from '../database/schema'

async function setup(): Promise<{ repository: WeaponsRepository }> {
  const client = createClient({ url: ':memory:' })
  await runMigrations(client)
  const db = new Kysely<Database>({ dialect: new LibsqlDialect({ client }) })
  return { repository: new WeaponsRepository(db) }
}

describe('WeaponsRepository', () => {
  it('creates a weapon with defaults and JSON array fields', async () => {
    const { repository } = await setup()
    const weapon = await repository.create({
      ...createEmptyWeaponInput(),
      name: 'Espada de hierro',
      category: 'sword',
      damage: 12,
      bonuses: [{ stat: 'strength', value: 3 }]
    })

    expect(weapon.id).toBeGreaterThan(0)
    expect(weapon.name).toBe('Espada de hierro')
    expect(weapon.damage).toBe(12)
    expect(weapon.bonuses).toEqual([{ stat: 'strength', value: 3 }])

    const fetched = await repository.get(weapon.id)
    expect(fetched).toEqual(weapon)
  })

  it('update() patches fields and query() filters by category', async () => {
    const { repository } = await setup()
    const w = await repository.create({ ...createEmptyWeaponInput(), name: 'Arco', category: 'bow' })
    await repository.create({ ...createEmptyWeaponInput(), name: 'Hacha', category: 'axe' })

    const updated = await repository.update(w.id, { damage: 25, rarity: 'rare' })
    expect(updated.damage).toBe(25)
    expect(updated.rarity).toBe('rare')

    const bows = await repository.query({ category: 'bow' })
    expect(bows.total).toBe(1)
    expect(bows.items[0].name).toBe('Arco')
  })

  it('bulkUpdate applies a patch to several weapons at once', async () => {
    const { repository } = await setup()
    const a = await repository.create({ ...createEmptyWeaponInput(), name: 'A' })
    const b = await repository.create({ ...createEmptyWeaponInput(), name: 'B' })

    const updated = await repository.bulkUpdate([a.id, b.id], { rarity: 'epic' })
    expect(updated).toHaveLength(2)
    expect(updated.every((w) => w.rarity === 'epic')).toBe(true)
  })

  it('restoreWithId re-inserts a full snapshot with its original id (undo/redo support)', async () => {
    const { repository } = await setup()
    const weapon = await repository.create({ ...createEmptyWeaponInput(), name: 'Daga', damage: 5 })
    await repository.delete(weapon.id)
    expect(await repository.get(weapon.id)).toBeUndefined()

    const restored = await repository.restoreWithId(weapon)
    expect(restored).toEqual(weapon)
    expect(await repository.get(weapon.id)).toEqual(weapon)
  })
})
