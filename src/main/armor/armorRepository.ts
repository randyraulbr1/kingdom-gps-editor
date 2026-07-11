import type { Kysely } from 'kysely'
import type { Database } from '../database/schema'
import type { Armor, ArmorInput, ArmorQuery } from '@shared-types/armor'

interface ArmorRow {
  id: number
  name: string
  description: string
  category: string
  rarity: string
  icon_id: number | null
  defense: number
  magic_resist: number
  value: number
  weight: number
  required_level: number
  required_profession: string | null
  bonuses: string
  scripts: string
  flags: string
  checks: string
  created_at: string
  updated_at: string
}

function toArmor(row: ArmorRow): Armor {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category as Armor['category'],
    rarity: row.rarity as Armor['rarity'],
    iconId: row.icon_id,
    defense: row.defense,
    magicResist: row.magic_resist,
    value: row.value,
    weight: row.weight,
    requiredLevel: row.required_level,
    requiredProfession: row.required_profession,
    bonuses: JSON.parse(row.bonuses),
    scripts: JSON.parse(row.scripts),
    flags: JSON.parse(row.flags),
    checks: JSON.parse(row.checks),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/** camelCase (IPC) -> snake_case (columnas), con arrays JSON-encoded. Mismo patrón que WeaponsRepository/ItemsRepository. */
function toRowPatch(input: Partial<ArmorInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (input.name !== undefined) row.name = input.name
  if (input.description !== undefined) row.description = input.description
  if (input.category !== undefined) row.category = input.category
  if (input.rarity !== undefined) row.rarity = input.rarity
  if (input.iconId !== undefined) row.icon_id = input.iconId
  if (input.defense !== undefined) row.defense = input.defense
  if (input.magicResist !== undefined) row.magic_resist = input.magicResist
  if (input.value !== undefined) row.value = input.value
  if (input.weight !== undefined) row.weight = input.weight
  if (input.requiredLevel !== undefined) row.required_level = input.requiredLevel
  if (input.requiredProfession !== undefined) row.required_profession = input.requiredProfession
  if (input.bonuses !== undefined) row.bonuses = JSON.stringify(input.bonuses)
  if (input.scripts !== undefined) row.scripts = JSON.stringify(input.scripts)
  if (input.flags !== undefined) row.flags = JSON.stringify(input.flags)
  if (input.checks !== undefined) row.checks = JSON.stringify(input.checks)
  return row
}

/** Repositorio del módulo Armaduras. Réplica del patrón de referencia (WeaponsRepository) con campos de armadura. */
export class ArmorRepository {
  constructor(private db: Kysely<Database>) {}

  async query(params: ArmorQuery): Promise<{ items: Armor[]; total: number }> {
    let base = this.db.selectFrom('armor')
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

    return { items: rows.map(toArmor), total }
  }

  async get(id: number): Promise<Armor | undefined> {
    const row = await this.db.selectFrom('armor').selectAll().where('id', '=', id).executeTakeFirst()
    return row ? toArmor(row) : undefined
  }

  async create(data: ArmorInput): Promise<Armor> {
    const now = new Date().toISOString()
    const values = { ...toRowPatch(data), created_at: now, updated_at: now }
    const inserted = await this.db
      .insertInto('armor')
      .values(values as never)
      .returningAll()
      .executeTakeFirstOrThrow()
    return toArmor(inserted)
  }

  async update(id: number, patch: Partial<ArmorInput>): Promise<Armor> {
    const values = { ...toRowPatch(patch), updated_at: new Date().toISOString() }
    await this.db
      .updateTable('armor')
      .set(values as never)
      .where('id', '=', id)
      .execute()
    return (await this.get(id)) as Armor
  }

  async delete(id: number): Promise<void> {
    await this.db.deleteFrom('armor').where('id', '=', id).execute()
  }

  async bulkUpdate(ids: number[], patch: Partial<ArmorInput>): Promise<Armor[]> {
    if (ids.length === 0) return []
    const values = { ...toRowPatch(patch), updated_at: new Date().toISOString() }
    await this.db
      .updateTable('armor')
      .set(values as never)
      .where('id', 'in', ids)
      .execute()
    const rows = await this.db.selectFrom('armor').selectAll().where('id', 'in', ids).execute()
    return rows.map(toArmor)
  }

  async bulkDelete(ids: number[]): Promise<void> {
    if (ids.length === 0) return
    await this.db.deleteFrom('armor').where('id', 'in', ids).execute()
  }

  /** Re-inserta un snapshot completo de armadura con su id original - usado por CommandBus para deshacer un delete o rehacer un create. */
  async restoreWithId(armor: Armor): Promise<Armor> {
    const values = {
      id: armor.id,
      ...toRowPatch(armor),
      created_at: armor.createdAt,
      updated_at: armor.updatedAt
    }
    const inserted = await this.db
      .insertInto('armor')
      .values(values as never)
      .onConflict((oc) => oc.column('id').doUpdateSet(values as never))
      .returningAll()
      .executeTakeFirstOrThrow()
    return toArmor(inserted)
  }

  async listCategories(): Promise<string[]> {
    const rows = await this.db.selectFrom('armor').select('category').distinct().orderBy('category').execute()
    return rows.map((row) => row.category)
  }
}
