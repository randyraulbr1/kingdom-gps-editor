import { create } from 'zustand'
import type { IconRecord, IconQuery } from '@shared-types/icon'

interface IconLibraryState {
  query: IconQuery
  items: IconRecord[]
  total: number
  categories: string[]
  tags: string[]
  selectedIconId: number | null
  loading: boolean
  setQuery(patch: Partial<IconQuery>): void
  setSelected(id: number | null): void
  setResults(items: IconRecord[], total: number): void
  setCategories(categories: string[]): void
  setTags(tags: string[]): void
  setLoading(loading: boolean): void
  patchIcon(icon: IconRecord): void
}

export const useIconLibraryStore = create<IconLibraryState>((set) => ({
  query: { limit: 200, offset: 0 },
  items: [],
  total: 0,
  categories: [],
  tags: [],
  selectedIconId: null,
  loading: false,
  setQuery: (patch) => set((state) => ({ query: { ...state.query, ...patch, offset: 0 } })),
  setSelected: (id) => set({ selectedIconId: id }),
  setResults: (items, total) => set({ items, total }),
  setCategories: (categories) => set({ categories }),
  setTags: (tags) => set({ tags }),
  setLoading: (loading) => set({ loading }),
  patchIcon: (icon) => set((state) => ({ items: state.items.map((i) => (i.id === icon.id ? icon : i)) }))
}))
