export interface ListOptions {
  limit?: number
  offset?: number
}

/**
 * Generic CRUD contract every content-module repository implements on top of
 * Kysely (see DataSource.ts). Content modules (Fase 2+) extend this with
 * domain-specific query methods; they never issue dialect-specific raw SQL.
 */
export interface Repository<TRow, TId = number> {
  list(options?: ListOptions): Promise<TRow[]>
  count(): Promise<number>
  get(id: TId): Promise<TRow | undefined>
  create(data: Omit<TRow, 'id'>): Promise<TRow>
  update(id: TId, patch: Partial<Omit<TRow, 'id'>>): Promise<TRow>
  delete(id: TId): Promise<void>
}
