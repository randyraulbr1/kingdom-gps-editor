import type { Kysely } from 'kysely'
import type { Database } from '../database/schema'
import type { ChangeLogEntry, CommandDescriptor } from '@shared-types/commands'

interface ChangeLogRow {
  id: number
  timestamp: string
  module_id: string
  entity_id: string | null
  action: string
  before: string | null
  after: string | null
}

function toEntry(row: ChangeLogRow): ChangeLogEntry {
  return {
    id: row.id,
    timestamp: row.timestamp,
    moduleId: row.module_id,
    entityId: row.entity_id,
    action: row.action,
    before: row.before ? JSON.parse(row.before) : null,
    after: row.after ? JSON.parse(row.after) : null
  }
}

/**
 * Persistent log backing both undo/redo and the project's audit history
 * (condition #8) - one mechanism serves both, instead of an in-memory-only
 * undo stack that would be lost on restart.
 */
export class ChangeLogService {
  constructor(private db: Kysely<Database>) {}

  async record(command: CommandDescriptor): Promise<ChangeLogEntry> {
    // A new action invalidates whatever redo history existed past this point.
    await this.db.deleteFrom('change_log').where('undone', '=', 1).execute()

    const now = new Date().toISOString()
    const inserted = await this.db
      .insertInto('change_log')
      .values({
        timestamp: now,
        module_id: command.moduleId,
        entity_id: command.entityId === null ? null : String(command.entityId),
        action: command.action,
        before: command.before === undefined ? null : JSON.stringify(command.before),
        after: command.after === undefined ? null : JSON.stringify(command.after),
        undone: 0
      })
      .returningAll()
      .executeTakeFirstOrThrow()
    return toEntry(inserted)
  }

  async listRecent(limit = 50): Promise<ChangeLogEntry[]> {
    const rows = await this.db.selectFrom('change_log').selectAll().orderBy('id', 'desc').limit(limit).execute()
    return rows.map(toEntry)
  }

  async findLastActive(): Promise<ChangeLogEntry | null> {
    const row = await this.db
      .selectFrom('change_log')
      .selectAll()
      .where('undone', '=', 0)
      .orderBy('id', 'desc')
      .executeTakeFirst()
    return row ? toEntry(row) : null
  }

  async findLastUndone(): Promise<ChangeLogEntry | null> {
    const row = await this.db
      .selectFrom('change_log')
      .selectAll()
      .where('undone', '=', 1)
      .orderBy('id', 'asc')
      .executeTakeFirst()
    return row ? toEntry(row) : null
  }

  async markUndone(id: number, undone: boolean): Promise<void> {
    await this.db
      .updateTable('change_log')
      .set({ undone: undone ? 1 : 0 })
      .where('id', '=', id)
      .execute()
  }
}
