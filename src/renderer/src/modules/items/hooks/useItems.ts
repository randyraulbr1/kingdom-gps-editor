import { useCallback, useEffect } from 'react'
import { useItemsStore } from '../store/itemsStore'
import { createEmptyItemInput, type ItemInput } from '@shared-types/item'

export function useItems() {
  const query = useItemsStore((s) => s.query)
  const setResults = useItemsStore((s) => s.setResults)
  const setLoading = useItemsStore((s) => s.setLoading)
  const setCategories = useItemsStore((s) => s.setCategories)
  const patchItem = useItemsStore((s) => s.patchItem)
  const removeItems = useItemsStore((s) => s.removeItems)
  const addItem = useItemsStore((s) => s.addItem)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const { items, total } = await window.api.items.query(query)
      setResults(items, total)
    } finally {
      setLoading(false)
    }
  }, [query, setResults, setLoading])

  useEffect(() => {
    const handle = setTimeout(reload, 150)
    return () => clearTimeout(handle)
  }, [reload])

  useEffect(() => {
    window.api.items.listCategories().then(setCategories)
  }, [setCategories])

  useEffect(() => {
    window.addEventListener('kgps:refresh', reload)
    return () => window.removeEventListener('kgps:refresh', reload)
  }, [reload])

  const createItem = useCallback(async (): Promise<void> => {
    const created = await window.api.items.create(createEmptyItemInput())
    addItem(created)
    window.api.items.listCategories().then(setCategories)
  }, [addItem, setCategories])

  const updateItem = useCallback(
    async (id: number, patch: Partial<ItemInput>): Promise<void> => {
      const updated = await window.api.items.update(id, patch)
      patchItem(updated)
    },
    [patchItem]
  )

  const deleteItems = useCallback(
    async (ids: number[]): Promise<void> => {
      for (const id of ids) {
        await window.api.items.delete(id)
      }
      removeItems(ids)
    },
    [removeItems]
  )

  const bulkUpdate = useCallback(
    async (ids: number[], patch: Partial<ItemInput>): Promise<void> => {
      const updated = await window.api.items.bulkUpdate(ids, patch)
      updated.forEach(patchItem)
    },
    [patchItem]
  )

  return { reload, createItem, updateItem, deleteItems, bulkUpdate }
}
