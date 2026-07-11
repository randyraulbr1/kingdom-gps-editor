import { create } from 'zustand'
import type { Item, ItemQuery } from '@shared-types/item'

export type ItemViewMode = 'grid' | 'list' | 'table'

interface SelectOptions {
  additive?: boolean
  range?: boolean
}

interface ItemsState {
  query: ItemQuery
  items: Item[]
  total: number
  categories: string[]
  selectedIds: number[]
  viewMode: ItemViewMode
  loading: boolean
  setQuery(patch: Partial<ItemQuery>): void
  setResults(items: Item[], total: number): void
  setCategories(categories: string[]): void
  setViewMode(mode: ItemViewMode): void
  setLoading(loading: boolean): void
  select(id: number, options?: SelectOptions): void
  clearSelection(): void
  patchItem(item: Item): void
  removeItems(ids: number[]): void
  addItem(item: Item): void
}

export const useItemsStore = create<ItemsState>((set, get) => ({
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
  patchItem: (item) => set((state) => ({ items: state.items.map((i) => (i.id === item.id ? item : i)) })),
  removeItems: (ids) =>
    set((state) => ({
      items: state.items.filter((item) => !ids.includes(item.id)),
      selectedIds: state.selectedIds.filter((id) => !ids.includes(id)),
      total: Math.max(0, state.total - ids.length)
    })),
  addItem: (item) =>
    set((state) => ({
      items: [...state.items, item].sort((a, b) => a.name.localeCompare(b.name)),
      total: state.total + 1
    }))
}))
