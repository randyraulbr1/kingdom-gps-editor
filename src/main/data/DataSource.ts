import { Kysely } from 'kysely'
import { createClient, type Client } from '@libsql/client'
import { LibsqlDialect } from '@libsql/kysely-libsql'
import type { Database } from '../database/schema'

/**
 * Single entry point for opening the project database. Every module's
 * repository receives the `Kysely<Database>` instance from here instead of
 * touching a driver directly - swapping SQLite/libSQL for Postgres or MySQL
 * later means changing this factory (and the dialect-specific bits of the
 * migrations), not the repositories or the UI. Kysely's query builder is
 * dialect-portable by design, which is why it was chosen over a thicker ORM.
 */
export interface DataSourceHandle {
  db: Kysely<Database>
  client: Client
  close(): Promise<void>
}

export function createDataSource(sqliteFilePath: string): DataSourceHandle {
  const client = createClient({ url: `file:${sqliteFilePath}` })
  const dialect = new LibsqlDialect({ client })
  const db = new Kysely<Database>({ dialect })

  return {
    db,
    client,
    async close() {
      await db.destroy()
    }
  }
}

/** WAL mode makes the on-disk file crash-safe and is required for the recovery flow in ProjectManager. */
export async function enableCrashSafeMode(client: Client): Promise<void> {
  await client.execute('PRAGMA journal_mode = WAL')
  await client.execute('PRAGMA foreign_keys = ON')
}
