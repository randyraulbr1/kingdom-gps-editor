import { describe, it, expect } from 'vitest'
import { Kysely } from 'kysely'
import { createClient } from '@libsql/client'
import { LibsqlDialect } from '@libsql/kysely-libsql'
import { runMigrations } from '../database/migrationRunner'
import { ArmorRepository } from './armorRepository'
import { createEmptyArmorInput } from '@shared-types/armor'
import type { Database } from '../database/schema'

async function setup(): Promise<{ repository: ArmorRepository }> {
  const client = createClient({ url: ':memory:' })
  await runMigrations(client)
  const db = new Kysely<Database>({ dialect: new LibsqlDialect({ client }) })
  return { repository: new ArmorRepository(db) }
}

describe('ArmorRepository', () => {
  it('creates an armor piece with defaults and JSON array fields', async () => {
    const { repository } = await setup()
    const armor = await repository.create({
      ...createEmptyArmorInput(),
      name: 'Peto de hierro',
      category: 'chest',
      defense: 15,
      bonuses: [{ stat: 'vitality', value: 5 }]
    })

    expect(armor.id).toBeGreaterThan(0)
    expect(armor.name).toBe('Peto de hierro')
    expect(armor.defense).toBe(15)
    expect(armor.bonuses).toEqual([{ stat: 'vitality', value: 5 }])

    const fetched = await repository.get(armor.id)
    expect(fetched).toEqual(armor)
  })

  it('update() patches fields and query() filters by category', async () => {
    const { repository } = await setup()
    const a = await repository.create({ ...createEmptyArmorInput(), name: 'Casco', category: 'head' })
    await repository.create({ ...createEmptyArmorInput(), name: 'Botas', category: 'boots' })

    const updated = await repository.update(a.id, { defense: 20, rarity: 'rare' })
    expect(updated.defense).toBe(20)
    expect(updated.rarity).toBe('rare')

    const heads = await repository.query({ category: 'head' })
    expect(heads.total).toBe(1)
    expect(heads.items[0].name).toBe('Casco')
  })

  it('bulkUpdate applies a patch to several armor pieces at once', async () => {
    const { repository } = await setup()
    const a = await repository.create({ ...createEmptyArmorInput(), name: 'A' })
    const b = await repository.create({ ...createEmptyArmorInput(), name: 'B' })

    const updated = await repository.bulkUpdate([a.id, b.id], { rarity: 'epic' })
    expect(updated).toHaveLength(2)
    expect(updated.every((piece) => piece.rarity === 'epic')).toBe(true)
  })

  it('restoreWithId re-inserts a full snapshot with its original id (undo/redo support)', async () => {
    const { repository } = await setup()
    const armor = await repository.create({ ...createEmptyArmorInput(), name: 'Guantes', defense: 3 })
    await repository.delete(armor.id)
    expect(await repository.get(armor.id)).toBeUndefined()

    const restored = await repository.restoreWithId(armor)
    expect(restored).toEqual(armor)
    expect(await repository.get(armor.id)).toEqual(armor)
  })
})
