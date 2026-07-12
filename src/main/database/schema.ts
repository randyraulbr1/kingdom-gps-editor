import type { Generated } from 'kysely'

export interface SchemaMigrationsTable {
  id: Generated<number>
  name: string
  applied_at: string
}

/**
 * Backs both the undo/redo command bus and the persistent audit trail
 * (see condition #8 - project history survives restarts, undo/redo does not
 * need a separate in-memory-only stack).
 */
export interface ChangeLogTable {
  id: Generated<number>
  timestamp: string
  module_id: string
  entity_id: string | null
  action: string
  before: string | null
  after: string | null
  undone: number
}

export interface IconsTable {
  id: Generated<number>
  file_name: string
  relative_path: string
  category: string
  hash: string
  width: number
  height: number
  format: string
  favorite: number
  duplicate_of_id: number | null
  created_at: string
  updated_at: string
}

export interface IconTagsTable {
  icon_id: number
  tag: string
}

export interface ItemsTable {
  id: Generated<number>
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

export interface WorldEntitiesTable {
  world_id: string
  entity_type: string
  entity_id: number | null
  name: string
  lat: number
  lng: number
  rotation: number
  enabled: number
  sync_status: string
  server_version: number
  local_version: number
  properties: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  last_sync_error: string | null
  sync_attempts: number
}

export interface WeaponsTable {
  id: Generated<number>
  name: string
  description: string
  category: string
  rarity: string
  icon_id: number | null
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

export interface ArmorTable {
  id: Generated<number>
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

export interface WorldZonesTable {
  zone_id: string
  name: string
  color: string
  /** JSON array of {lat,lng} vertices. */
  points: string
  properties: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface EnemyRoutesTable {
  route_id: string
  name: string
  color: string
  /** JSON array of {lat,lng} vertices (polyline, not closed). */
  points: string
  properties: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Database {
  schema_migrations: SchemaMigrationsTable
  change_log: ChangeLogTable
  icons: IconsTable
  icon_tags: IconTagsTable
  items: ItemsTable
  weapons: WeaponsTable
  armor: ArmorTable
  world_entities: WorldEntitiesTable
  world_zones: WorldZonesTable
  enemy_routes: EnemyRoutesTable
}
