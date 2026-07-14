import type { Kysely } from 'kysely'
import type { Database } from '../database/schema'
import type { Weapon, WeaponInput, WeaponQuery } from '@shared-types/weapon'

interface WeaponRow {
  id: number
  name: string
  description: string
  category: string
  rarity: string
  icon_id: number | null
  icon_ref: string | null
  damage: number
  attack_speed: number
  range: number
  crit_chance: number
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

function toWeapon(row: WeaponRow): Weapon {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category as Weapon['category'],
    rarity: row.rarity as Weapon['rarity'],
    iconId: row.icon_id,
    iconRef: row.icon_ref ? JSON.parse(row.icon_ref) : null,
    damage: row.damage,
    attackSpeed: row.attack_speed,
    range: row.range,
    critChance: row.crit_chance,
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

/** camelCase (IPC) -> snake_case (columnas), con arrays JSON-encoded. Mismo patrón que ItemsRepository. */
function toRowPatch(input: Partial<WeaponInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (input.name !== undefined) row.name = input.name
  if (input.description !== undefined) row.description = input.description
  if (input.category !== undefined) row.category = input.category
  if (input.rarity !== undefined) row.rarity = input.rarity
  if (input.iconId !== undefined) row.icon_id = input.iconId
  if (input.iconRef !== undefined) row.icon_ref = input.iconRef ? JSON.stringify(input.iconRef) : null
  if (input.damage !== undefined) row.damage = input.damage
  if (input.attackSpeed !== undefined) row.attack_speed = input.attackSpeed
  if (input.range !== undefined) row.range = input.range
  if (input.critChance !== undefined) row.crit_chance = input.critChance
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

/** Repositorio del módulo Armas. Réplica del patrón de referencia (ItemsRepository) con campos de arma. */
export class WeaponsRepository {
  constructor(private db: Kysely<Database>) {}

  async query(params: WeaponQuery): Promise<{ items: Weapon[]; total: number }> {
    let base = this.db.selectFrom('weapons')
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

    return { items: rows.map(toWeapon), total }
  }

  async get(id: number): Promise<Weapon | undefined> {
    const row = await this.db.selectFrom('weapons').selectAll().where('id', '=', id).executeTakeFirst()
    return row ? toWeapon(row) : undefined
  }

  async create(data: WeaponInput): Promise<Weapon> {
    const now = new Date().toISOString()
    const values = { ...toRowPatch(data), created_at: now, updated_at: now }
    const inserted = await this.db
      .insertInto('weapons')
      .values(values as never)
      .returningAll()
      .executeTakeFirstOrThrow()
    return toWeapon(inserted)
  }

  async update(id: number, patch: Partial<WeaponInput>): Promise<Weapon> {
    const values = { ...toRowPatch(patch), updated_at: new Date().toISOString() }
    await this.db
      .updateTable('weapons')
      .set(values as never)
      .where('id', '=', id)
      .execute()
    return (await this.get(id)) as Weapon
  }

  async delete(id: number): Promise<void> {
    await this.db.deleteFrom('weapons').where('id', '=', id).execute()
  }

  async bulkUpdate(ids: number[], patch: Partial<WeaponInput>): Promise<Weapon[]> {
    if (ids.length === 0) return []
    const values = { ...toRowPatch(patch), updated_at: new Date().toISOString() }
    await this.db
      .updateTable('weapons')
      .set(values as never)
      .where('id', 'in', ids)
      .execute()
    const rows = await this.db.selectFrom('weapons').selectAll().where('id', 'in', ids).execute()
    return rows.map(toWeapon)
  }

  async bulkDelete(ids: number[]): Promise<void> {
    if (ids.length === 0) return
    await this.db.deleteFrom('weapons').where('id', 'in', ids).execute()
  }

  /** Re-inserta un snapshot completo de arma con su id original - usado por CommandBus para deshacer un delete o rehacer un create. Mismo patrón que ItemsRepository.restoreWithId. */
  async restoreWithId(weapon: Weapon): Promise<Weapon> {
    const values = {
      id: weapon.id,
      ...toRowPatch(weapon),
      created_at: weapon.createdAt,
      updated_at: weapon.updatedAt
    }
    const inserted = await this.db
      .insertInto('weapons')
      .values(values as never)
      .onConflict((oc) => oc.column('id').doUpdateSet(values as never))
      .returningAll()
      .executeTakeFirstOrThrow()
    return toWeapon(inserted)
  }

  async listCategories(): Promise<string[]> {
    const rows = await this.db.selectFrom('weapons').select('category').distinct().orderBy('category').execute()
    return rows.map((row) => row.category)
  }
}
