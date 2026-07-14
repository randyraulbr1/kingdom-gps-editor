import { describe, it, expect } from 'vitest'
import { createClient } from '@libsql/client'
import { runMigrations } from './migrationRunner'

describe('migrationRunner', () => {
  it('applies all migrations once and is idempotent on a second run', async () => {
    const client = createClient({ url: ':memory:' })

    const applied = await runMigrations(client)
    expect(applied).toEqual([
      '001_init',
      '002_icon_library',
      '003_items',
      '004_world_entities',
      '005_world_zones',
      '006_weapons',
      '007_armor',
      '008_enemy_routes',
      '009_monsters',
      '010_item_icon_ref'
    ])

    const secondRun = await runMigrations(client)
    expect(secondRun).toEqual([])

    const tables = await client.execute("SELECT name FROM sqlite_master WHERE type = 'table'")
    const names = tables.rows.map((row) => row.name)
    expect(names).toEqual(
      expect.arrayContaining([
        'schema_migrations',
        'change_log',
        'icons',
        'icon_tags',
        'items',
        'weapons',
        'armor',
        'world_entities',
        'world_zones',
        'enemy_routes',
        'monsters'
      ])
    )
  })
})
