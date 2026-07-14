import type { ItemRarity, IconRegion } from '@shared-types/item'

/**
 * Forma mínima que todo registro de contenido (objetos, armas, armaduras, …)
 * comparte para poder renderizarse en las vistas genéricas (rejilla/lista/tabla).
 * Cada módulo define su tipo completo extendiendo esta base.
 */
export interface ContentRecord {
  id: number
  name: string
  iconId: number | null
  /** Recorte del icono (opcional; los tipos que lo soporten). */
  iconRef?: IconRegion | null
  rarity: ItemRarity
  category: string
  updatedAt: string
}

export type ContentViewMode = 'grid' | 'list' | 'table'

export interface ContentQueryBase {
  search?: string
  category?: string
  rarity?: ItemRarity
  limit?: number
  offset?: number
}

/**
 * Superficie CRUD que un módulo de contenido expone en `window.api` (items,
 * weapons, …). El framework habla solo con esta interfaz, así que un módulo
 * nuevo se conecta pasando su `window.api.<módulo>` sin tocar el framework.
 */
export interface ContentApi<T extends ContentRecord, TInput> {
  query(params: ContentQueryBase): Promise<{ items: T[]; total: number }>
  get(id: number): Promise<T | undefined>
  create(data: TInput): Promise<T>
  update(id: number, patch: Partial<TInput>): Promise<T>
  delete(id: number): Promise<void>
  bulkUpdate(ids: number[], patch: Partial<TInput>): Promise<T[]>
  bulkDelete(ids: number[]): Promise<void>
  listCategories(): Promise<string[]>
}

/** Columna extra de la vista de tabla (además de icono/id/nombre/categoría/rareza). */
export interface ContentColumn<T extends ContentRecord> {
  header: string
  render(record: T): React.ReactNode
}
