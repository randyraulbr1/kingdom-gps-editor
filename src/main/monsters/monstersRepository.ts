import type { Kysely } from 'kysely'
import type { Database } from '../database/schema'
import type { Monster, MonsterInput, MonsterQuery } from '@shared-types/monster'

interface MonsterRow {
  id: number
  name: string
  description: string
  category: string
  rarity: string
  icon_id: number | null
  level: number
  hp: number
  damage: number
  defense: number
  speed: number
  xp_reward: number
  coin_reward: number
  scripts: string
  flags: string
  checks: string
  created_at: string
  updated_at: string
}

function toMonster(row: MonsterRow): Monster {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category as Monster['category'],
    rarity: row.rarity as Monster['rarity'],
    iconId: row.icon_id,
    level: row.level,
    hp: row.hp,
    damage: row.damage,
    defense: row.defense,
    speed: row.speed,
    xpReward: row.xp_reward,
    coinReward: row.coin_reward,
    scripts: JSON.parse(row.scripts),
    flags: JSON.parse(row.flags),
    checks: JSON.parse(row.checks),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/** camelCase (IPC) -> snake_case (columnas), con arrays JSON-encoded. Mismo patrón que ArmorRepository. */
function toRowPatch(input: Partial<MonsterInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {}
  if (input.name !== undefined) row.name = input.name
  if (input.description !== undefined) row.description = input.description
  if (input.category !== undefined) row.category = input.category
  if (input.rarity !== undefined) row.rarity = input.rarity
  if (input.iconId !== undefined) row.icon_id = input.iconId
  if (input.level !== undefined) row.level = input.level
  if (input.hp !== undefined) row.hp = input.hp
  if (input.damage !== undefined) row.damage = input.damage
  if (input.defense !== undefined) row.defense = input.defense
  if (input.speed !== undefined) row.speed = input.speed
  if (input.xpReward !== undefined) row.xp_reward = input.xpReward
  if (input.coinReward !== undefined) row.coin_reward = input.coinReward
  if (input.scripts !== undefined) row.scripts = JSON.stringify(input.scripts)
  if (input.flags !== undefined) row.flags = JSON.stringify(input.flags)
  if (input.checks !== undefined) row.checks = JSON.stringify(input.checks)
  return row
}

/** Repositorio del módulo Monstruos (bestiario). Réplica del patrón de referencia con campos de monstruo. */
export class MonstersRepository {
  constructor(private db: Kysely<Database>) {}

  async query(params: MonsterQuery): Promise<{ items: Monster[]; total: number }> {
    let base = this.db.selectFrom('monsters')
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

    return { items: rows.map(toMonster), total }
  }

  async get(id: number): Promise<Monster | undefined> {
    const row = await this.db.selectFrom('monsters').selectAll().where('id', '=', id).executeTakeFirst()
    return row ? toMonster(row) : undefined
  }

  async create(data: MonsterInput): Promise<Monster> {
    const now = new Date().toISOString()
    const values = { ...toRowPatch(data), created_at: now, updated_at: now }
    const inserted = await this.db
      .insertInto('monsters')
      .values(values as never)
      .returningAll()
      .executeTakeFirstOrThrow()
    return toMonster(inserted)
  }

  async update(id: number, patch: Partial<MonsterInput>): Promise<Monster> {
    const values = { ...toRowPatch(patch), updated_at: new Date().toISOString() }
    await this.db
      .updateTable('monsters')
      .set(values as never)
      .where('id', '=', id)
      .execute()
    return (await this.get(id)) as Monster
  }

  async delete(id: number): Promise<void> {
    await this.db.deleteFrom('monsters').where('id', '=', id).execute()
  }

  async bulkUpdate(ids: number[], patch: Partial<MonsterInput>): Promise<Monster[]> {
    if (ids.length === 0) return []
    const values = { ...toRowPatch(patch), updated_at: new Date().toISOString() }
    await this.db
      .updateTable('monsters')
      .set(values as never)
      .where('id', 'in', ids)
      .execute()
    const rows = await this.db.selectFrom('monsters').selectAll().where('id', 'in', ids).execute()
    return rows.map(toMonster)
  }

  async bulkDelete(ids: number[]): Promise<void> {
    if (ids.length === 0) return
    await this.db.deleteFrom('monsters').where('id', 'in', ids).execute()
  }

  /** Re-inserta un snapshot completo con su id original - usado por CommandBus para deshacer/rehacer. */
  async restoreWithId(monster: Monster): Promise<Monster> {
    const values = {
      id: monster.id,
      ...toRowPatch(monster),
      created_at: monster.createdAt,
      updated_at: monster.updatedAt
    }
    const inserted = await this.db
      .insertInto('monsters')
      .values(values as never)
      .onConflict((oc) => oc.column('id').doUpdateSet(values as never))
      .returningAll()
      .executeTakeFirstOrThrow()
    return toMonster(inserted)
  }

  async listCategories(): Promise<string[]> {
    const rows = await this.db.selectFrom('monsters').select('category').distinct().orderBy('category').execute()
    return rows.map((row) => row.category)
  }
}
