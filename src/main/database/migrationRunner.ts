import type { Client } from '@libsql/client'
import * as m001 from './migrations/001_init'
import * as m002 from './migrations/002_icon_library'
import * as m003 from './migrations/003_items'
import * as m004 from './migrations/004_world_entities'
import * as m005 from './migrations/005_world_zones'
import * as m006 from './migrations/006_weapons'
import * as m007 from './migrations/007_armor'
import * as m008 from './migrations/008_enemy_routes'
import * as m009 from './migrations/009_monsters'

interface Migration {
  id: string
  sql: string
}

/** New migrations are appended here, never edited after being released - see README. */
const MIGRATIONS: Migration[] = [m001, m002, m003, m004, m005, m006, m007, m008, m009]

function splitStatements(sql: string): string[] {
  return sql
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean)
}

/** Runs any not-yet-applied migrations, in order, tracked in schema_migrations. Idempotent and safe to call on every project open. */
export async function runMigrations(client: Client): Promise<string[]> {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL
    )
  `)

  const appliedRows = await client.execute('SELECT name FROM schema_migrations')
  const applied = new Set(appliedRows.rows.map((row) => row.name as string))
  const newlyApplied: string[] = []

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.id)) continue

    for (const statement of splitStatements(migration.sql)) {
      await client.execute(statement)
    }
    await client.execute({
      sql: 'INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)',
      args: [migration.id, new Date().toISOString()]
    })
    newlyApplied.push(migration.id)
  }

  return newlyApplied
}
