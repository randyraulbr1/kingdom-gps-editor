import { create } from 'zustand'
import type { StoreApi, UseBoundStore } from 'zustand'
import type { ContentRecord, ContentQueryBase, ContentViewMode } from './contentTypes'

interface SelectOptions {
  additive?: boolean
  range?: boolean
}

export interface ContentStoreState<T extends ContentRecord> {
  query: ContentQueryBase
  items: T[]
  total: number
  categories: string[]
  selectedIds: number[]
  viewMode: ContentViewMode
  loading: boolean
  setQuery(patch: Partial<ContentQueryBase>): void
  setResults(items: T[], total: number): void
  setCategories(categories: string[]): void
  setViewMode(mode: ContentViewMode): void
  setLoading(loading: boolean): void
  select(id: number, options?: SelectOptions): void
  clearSelection(): void
  patchRecord(record: T): void
  removeRecords(ids: number[]): void
  addRecord(record: T): void
}

export type ContentStoreHook<T extends ContentRecord> = UseBoundStore<StoreApi<ContentStoreState<T>>>

/**
 * Fábrica del store (Zustand) de un módulo de contenido. Es una generalización
 * 1:1 del store del módulo Objetos (selección múltiple con Ctrl/Shift, carga,
 * filtros). Cada módulo llama a esto una vez: `export const useWeaponsStore =
 * createContentStore<Weapon>()`.
 */
export function createContentStore<T extends ContentRecord>(): ContentStoreHook<T> {
  return create<ContentStoreState<T>>((set, get) => ({
    query: { limit: 500, offset: 0 },
    items: [],
    total: 0,
    categories: [],
    selectedIds: [],
    viewMode: 'grid',
    loading: false,
    setQuery: (patch) => set((state) => ({ query: { ...state.query, ...patch, offset: 0 } })),
    setResults: (items, total) => set({ items, total }),
    setCategories: (categories) => set({ categories }),
    setViewMode: (viewMode) => set({ viewMode }),
    setLoading: (loading) => set({ loading }),
    select: (id, options) => {
      const { selectedIds, items } = get()

      if (options?.range && selectedIds.length > 0) {
        const anchorId = selectedIds[selectedIds.length - 1]
        const anchorIndex = items.findIndex((item) => item.id === anchorId)
        const targetIndex = items.findIndex((item) => item.id === id)
        if (anchorIndex !== -1 && targetIndex !== -1) {
          const [start, end] = anchorIndex < targetIndex ? [anchorIndex, targetIndex] : [targetIndex, anchorIndex]
          const rangeIds = items.slice(start, end + 1).map((item) => item.id)
          set({ selectedIds: Array.from(new Set([...selectedIds, ...rangeIds])) })
          return
        }
      }

      if (options?.additive) {
        const exists = selectedIds.includes(id)
        set({ selectedIds: exists ? selectedIds.filter((sid) => sid !== id) : [...selectedIds, id] })
        return
      }

      set({ selectedIds: [id] })
    },
    clearSelection: () => set({ selectedIds: [] }),
    patchRecord: (record) => set((state) => ({ items: state.items.map((i) => (i.id === record.id ? record : i)) })),
    removeRecords: (ids) =>
      set((state) => ({
        items: state.items.filter((item) => !ids.includes(item.id)),
        selectedIds: state.selectedIds.filter((id) => !ids.includes(id)),
        total: Math.max(0, state.total - ids.length)
      })),
    addRecord: (record) =>
      set((state) => ({
        items: [...state.items, record].sort((a, b) => a.name.localeCompare(b.name)),
        total: state.total + 1
      }))
  }))
}
