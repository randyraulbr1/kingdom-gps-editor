import { describe, it, expect } from 'vitest'
import { Kysely } from 'kysely'
import { createClient } from '@libsql/client'
import { LibsqlDialect } from '@libsql/kysely-libsql'
import { runMigrations } from '../database/migrationRunner'
import { IconLibraryRepository } from './iconLibraryRepository'
import type { Database } from '../database/schema'

async function setup(): Promise<{ repository: IconLibraryRepository }> {
  const client = createClient({ url: ':memory:' })
  await runMigrations(client)
  const db = new Kysely<Database>({ dialect: new LibsqlDialect({ client }) })
  return { repository: new IconLibraryRepository(db) }
}

describe('IconLibraryRepository', () => {
  it('creates, favorites, tags and lists icons', async () => {
    const { repository } = await setup()

    const icon = await repository.create({
      fileName: 'sword.png',
      relativePath: 'weapons/sword.png',
      category: 'weapons',
      hash: 'abc123',
      width: 64,
      height: 64,
      format: 'png',
      duplicateOfId: null
    })
    expect(icon.id).toBeGreaterThan(0)
    expect(icon.favorite).toBe(false)

    const favorited = await repository.setFavorite(icon.id, true)
    expect(favorited.favorite).toBe(true)

    const tagged = await repository.setTags(icon.id, ['epico', 'forjado'])
    expect([...tagged.tags].sort()).toEqual(['epico', 'forjado'])

    const { items, total } = await repository.list({ favoritesOnly: true })
    expect(total).toBe(1)
    expect(items[0].id).toBe(icon.id)

    expect(await repository.listCategories()).toEqual(['weapons'])
  })

  it('finds a duplicate by content hash', async () => {
    const { repository } = await setup()

    const first = await repository.create({
      fileName: 'a.png',
      relativePath: 'a.png',
      category: 'general',
      hash: 'same-hash',
      width: 1,
      height: 1,
      format: 'png',
      duplicateOfId: null
    })

    const found = await repository.findByHash('same-hash')
    expect(found?.id).toBe(first.id)
    expect(await repository.findByHash('does-not-exist')).toBeUndefined()
  })

  it('paginates and filters by search term', async () => {
    const { repository } = await setup()

    for (let i = 0; i < 5; i++) {
      await repository.create({
        fileName: `icon-${i}.png`,
        relativePath: `general/icon-${i}.png`,
        category: 'general',
        hash: `hash-${i}`,
        width: 32,
        height: 32,
        format: 'png',
        duplicateOfId: null
      })
    }

    const page = await repository.list({ limit: 2, offset: 0 })
    expect(page.items).toHaveLength(2)
    expect(page.total).toBe(5)

    const filtered = await repository.list({ search: 'icon-3' })
    expect(filtered.total).toBe(1)
    expect(filtered.items[0].fileName).toBe('icon-3.png')
  })
})
