import type { Kysely } from 'kysely'
import type { Database } from '../database/schema'
import type { Item, ItemInput, ItemQuery } from '@shared-types/item'

interface ItemRow {
  id: number
  name: string
  description: string
  category: string
  rarity: string
  icon_id: number | null
  value: number
  weight: number
  stack_size: number
  durability: number | null
  health_restore: number | null
  food_restore: number | null
  mana_restore: number | null
  required_level: number
  required_profession: string | null
  weapon_type: string | null
  armor_type: string | null
  bonuses: string
  scripts: string
  flags: string
  checks: string
  created_at: string
  updated_at: string
}

function toItem(row: ItemRow): Item {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category as Item['category'],
    rarity: row.rarity as Item['rarity'],
    iconId: row.icon_id,
    value: row.value,
    weight: row.weight,
    stackSize: row.stack_size,
    durability: row.durability,
    healthRestore: row.health_restore,
    foodRestore: row.food_restore,
    manaRestore: row.mana_restore,
    requiredLevel: row.required_level,
    requiredProfession: row.required_profession,
    weaponType: row.weapon_type,
    armorType: row.armor_type,
    bonuses: JSON.parse(row.bonuses),
    scripts: JSON.parse(row.scripts),
    flags: JSON.parse(row.flags),
    checks: JSON.parse(row.checks),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/** Converts the camelCase partial patch coming over IPC into the snake_case columns Kysely expects, JSON-encoding the array fields. */
function toRowPatch(input: Partial<ItemInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (input.name !== undefined) row.name = input.name
  if (input.description !== undefined) row.description = input.description
  if (input.category !== undefined) row.category = input.category
  if (input.rarity !== undefined) row.rarity = input.rarity
  if (input.iconId !== undefined) row.icon_id = input.iconId
  if (input.value !== undefined) row.value = input.value
  if (input.weight !== undefined) row.weight = input.weight
  if (input.stackSize !== undefined) row.stack_size = input.stackSize
  if (input.durability !== undefined) row.durability = input.durability
  if (input.healthRestore !== undefined) row.health_restore = input.healthRestore
  if (input.foodRestore !== undefined) row.food_restore = input.foodRestore
  if (input.manaRestore !== undefined) row.mana_restore = input.manaRestore
  if (input.requiredLevel !== undefined) row.required_level = input.requiredLevel
  if (input.requiredProfession !== undefined) row.required_profession = input.requiredProfession
  if (input.weaponType !== undefined) row.weapon_type = input.weaponType
  if (input.armorType !== undefined) row.armor_type = input.armorType
  if (input.bonuses !== undefined) row.bonuses = JSON.stringify(input.bonuses)
  if (input.scripts !== undefined) row.scripts = JSON.stringify(input.scripts)
  if (input.flags !== undefined) row.flags = JSON.stringify(input.flags)
  if (input.checks !== undefined) row.checks = JSON.stringify(input.checks)
  return row
}

/**
 * Reference-pattern repository for content modules: plain Kysely query
 * builder (dialect-portable, see DataSource.ts), snake_case <-> camelCase
 * mapping at the boundary, JSON-encoded array columns. Fase 3+ modules
 * repeat this shape.
 */
export class ItemsRepository {
  constructor(private db: Kysely<Database>) {}

  async query(params: ItemQuery): Promise<{ items: Item[]; total: number }> {
    let base = this.db.selectFrom('items')
    if (params.category) base = base.where('category', '=', params.category)
    if (params.rarity) base = base.where('rarity', '=', params.rarity)
    if (params.search) base = base.where('name', 'like', `%${params.search}%`)

    const totalRow = await base.select(({ fn }) => [fn.countAll<number>().as('count')]).executeTakeFirst()
    const total = Number(totalRow?.count ?? 0)

    const rows = await base
      .selectAll()
      .orderBy('name', 'asc')
      .limit(params.limit ?? 500)
      .offset(params.offset ?? 0)
      .execute()

    return { items: rows.map(toItem), total }
  }

  async get(id: number): Promise<Item | undefined> {
    const row = await this.db.selectFrom('items').selectAll().where('id', '=', id).executeTakeFirst()
    return row ? toItem(row) : undefined
  }

  async create(data: ItemInput): Promise<Item> {
    const now = new Date().toISOString()
    const values = { ...toRowPatch(data), created_at: now, updated_at: now }
    const inserted = await this.db
      .insertInto('items')
      .values(values as never)
      .returningAll()
      .executeTakeFirstOrThrow()
    return toItem(inserted)
  }

  async update(id: number, patch: Partial<ItemInput>): Promise<Item> {
    const values = { ...toRowPatch(patch), updated_at: new Date().toISOString() }
    await this.db
      .updateTable('items')
      .set(values as never)
      .where('id', '=', id)
      .execute()
    return (await this.get(id)) as Item
  }

  async delete(id: number): Promise<void> {
    await this.db.deleteFrom('items').where('id', '=', id).execute()
  }

  async bulkUpdate(ids: number[], patch: Partial<ItemInput>): Promise<Item[]> {
    if (ids.length === 0) return []
    const values = { ...toRowPatch(patch), updated_at: new Date().toISOString() }
    await this.db
      .updateTable('items')
      .set(values as never)
      .where('id', 'in', ids)
      .execute()
    const rows = await this.db.selectFrom('items').selectAll().where('id', 'in', ids).execute()
    return rows.map(toItem)
  }

  async bulkDelete(ids: number[]): Promise<void> {
    if (ids.length === 0) return
    await this.db.deleteFrom('items').where('id', 'in', ids).execute()
  }

  /** Re-inserts a full item snapshot with its original id - used by CommandBus to undo a delete or redo a create. */
  async restoreWithId(item: Item): Promise<Item> {
    const values = {
      id: item.id,
      ...toRowPatch(item),
      created_at: item.createdAt,
      updated_at: item.updatedAt
    }
    const inserted = await this.db
      .insertInto('items')
      .values(values as never)
      .onConflict((oc) => oc.column('id').doUpdateSet(values as never))
      .returningAll()
      .executeTakeFirstOrThrow()
    return toItem(inserted)
  }

  async listCategories(): Promise<string[]> {
    const rows = await this.db.selectFrom('items').select('category').distinct().orderBy('category').execute()
    return rows.map((row) => row.category)
  }
}
