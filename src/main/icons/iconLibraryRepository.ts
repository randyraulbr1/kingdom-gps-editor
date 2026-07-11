import type { Kysely } from 'kysely'
import type { Database } from '../database/schema'
import type { IconRecord, IconQuery, IconFormat } from '@shared-types/icon'

interface IconRow {
  id: number
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

function toIconRecord(row: IconRow, tags: string[]): IconRecord {
  return {
    id: row.id,
    fileName: row.file_name,
    relativePath: row.relative_path,
    category: row.category,
    hash: row.hash,
    width: row.width,
    height: row.height,
    format: row.format as IconFormat,
    favorite: row.favorite === 1,
    tags,
    duplicateOfId: row.duplicate_of_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export interface CreateIconInput {
  fileName: string
  relativePath: string
  category: string
  hash: string
  width: number
  height: number
  format: IconFormat
  duplicateOfId: number | null
}

/** All access to the `icons` / `icon_tags` tables goes through here - the service layer never writes SQL directly. */
export class IconLibraryRepository {
  constructor(private db: Kysely<Database>) {}

  private async tagsFor(iconIds: number[]): Promise<Map<number, string[]>> {
    if (iconIds.length === 0) return new Map()
    const rows = await this.db.selectFrom('icon_tags').selectAll().where('icon_id', 'in', iconIds).execute()
    const map = new Map<number, string[]>()
    for (const row of rows) {
      const list = map.get(row.icon_id) ?? []
      list.push(row.tag)
      map.set(row.icon_id, list)
    }
    return map
  }

  async list(query: IconQuery): Promise<{ items: IconRecord[]; total: number }> {
    let base = this.db.selectFrom('icons')

    if (query.category) base = base.where('category', '=', query.category)
    if (query.favoritesOnly) base = base.where('favorite', '=', 1)
    if (query.duplicatesOnly) base = base.where('duplicate_of_id', 'is not', null)
    if (query.search) base = base.where('file_name', 'like', `%${query.search}%`)
    if (query.tags && query.tags.length > 0) {
      const tags = query.tags
      base = base.where('id', 'in', (eb) => eb.selectFrom('icon_tags').select('icon_id').where('tag', 'in', tags))
    }

    const totalRow = await base.select(({ fn }) => [fn.countAll<number>().as('count')]).executeTakeFirst()
    const total = Number(totalRow?.count ?? 0)

    const rows = await base
      .selectAll()
      .orderBy('file_name', 'asc')
      .limit(query.limit ?? 200)
      .offset(query.offset ?? 0)
      .execute()

    const tagMap = await this.tagsFor(rows.map((row) => row.id))
    return { items: rows.map((row) => toIconRecord(row, tagMap.get(row.id) ?? [])), total }
  }

  async get(id: number): Promise<IconRecord | undefined> {
    const row = await this.db.selectFrom('icons').selectAll().where('id', '=', id).executeTakeFirst()
    if (!row) return undefined
    const tagMap = await this.tagsFor([id])
    return toIconRecord(row, tagMap.get(id) ?? [])
  }

  async findByHash(hash: string): Promise<IconRecord | undefined> {
    const row = await this.db.selectFrom('icons').selectAll().where('hash', '=', hash).executeTakeFirst()
    if (!row) return undefined
    const tagMap = await this.tagsFor([row.id])
    return toIconRecord(row, tagMap.get(row.id) ?? [])
  }

  async findByRelativePath(relativePath: string): Promise<IconRecord | undefined> {
    const row = await this.db
      .selectFrom('icons')
      .selectAll()
      .where('relative_path', '=', relativePath)
      .executeTakeFirst()
    if (!row) return undefined
    const tagMap = await this.tagsFor([row.id])
    return toIconRecord(row, tagMap.get(row.id) ?? [])
  }

  async create(data: CreateIconInput): Promise<IconRecord> {
    const now = new Date().toISOString()
    const inserted = await this.db
      .insertInto('icons')
      .values({
        file_name: data.fileName,
        relative_path: data.relativePath,
        category: data.category,
        hash: data.hash,
        width: data.width,
        height: data.height,
        format: data.format,
        favorite: 0,
        duplicate_of_id: data.duplicateOfId,
        created_at: now,
        updated_at: now
      })
      .returningAll()
      .executeTakeFirstOrThrow()
    return toIconRecord(inserted, [])
  }

  async setFavorite(id: number, favorite: boolean): Promise<IconRecord> {
    await this.db
      .updateTable('icons')
      .set({ favorite: favorite ? 1 : 0, updated_at: new Date().toISOString() })
      .where('id', '=', id)
      .execute()
    return (await this.get(id)) as IconRecord
  }

  async setTags(id: number, tags: string[]): Promise<IconRecord> {
    await this.db.deleteFrom('icon_tags').where('icon_id', '=', id).execute()
    if (tags.length > 0) {
      await this.db
        .insertInto('icon_tags')
        .values(tags.map((tag) => ({ icon_id: id, tag })))
        .execute()
    }
    await this.db.updateTable('icons').set({ updated_at: new Date().toISOString() }).where('id', '=', id).execute()
    return (await this.get(id)) as IconRecord
  }

  async listCategories(): Promise<string[]> {
    const rows = await this.db.selectFrom('icons').select('category').distinct().orderBy('category').execute()
    return rows.map((row) => row.category)
  }

  async listTags(): Promise<string[]> {
    const rows = await this.db.selectFrom('icon_tags').select('tag').distinct().orderBy('tag').execute()
    return rows.map((row) => row.tag)
  }

  async countAll(): Promise<number> {
    const row = await this.db
      .selectFrom('icons')
      .select(({ fn }) => [fn.countAll<number>().as('count')])
      .executeTakeFirst()
    return Number(row?.count ?? 0)
  }
}
