import { useCallback, useEffect } from 'react'
import type { ContentApi, ContentRecord } from './contentTypes'
import type { ContentStoreHook } from './createContentStore'

/**
 * Acciones CRUD de un módulo de contenido, sin efectos. Lo usan tanto el panel
 * (para crear/borrar) como el inspector (para actualizar). Generalización de
 * `useItems` sin la parte de carga automática.
 */
export function useContentActions<T extends ContentRecord, TInput>(
  useStore: ContentStoreHook<T>,
  api: ContentApi<T, TInput>,
  createEmpty: () => TInput
) {
  const setResults = useStore((s) => s.setResults)
  const setLoading = useStore((s) => s.setLoading)
  const setCategories = useStore((s) => s.setCategories)
  const patchRecord = useStore((s) => s.patchRecord)
  const removeRecords = useStore((s) => s.removeRecords)
  const addRecord = useStore((s) => s.addRecord)
  const query = useStore((s) => s.query)

  const reload = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const { items, total } = await api.query(query)
      setResults(items, total)
    } finally {
      setLoading(false)
    }
  }, [api, query, setResults, setLoading])

  const createRecord = useCallback(async (): Promise<void> => {
    const created = await api.create(createEmpty())
    addRecord(created)
    api.listCategories().then(setCategories)
  }, [api, createEmpty, addRecord, setCategories])

  const updateRecord = useCallback(
    async (id: number, patch: Partial<TInput>): Promise<void> => {
      const updated = await api.update(id, patch)
      patchRecord(updated)
    },
    [api, patchRecord]
  )

  const deleteRecords = useCallback(
    async (ids: number[]): Promise<void> => {
      for (const id of ids) {
        await api.delete(id)
      }
      removeRecords(ids)
    },
    [api, removeRecords]
  )

  const bulkUpdate = useCallback(
    async (ids: number[], patch: Partial<TInput>): Promise<void> => {
      const updated = await api.bulkUpdate(ids, patch)
      updated.forEach(patchRecord)
    },
    [api, patchRecord]
  )

  return { reload, createRecord, updateRecord, deleteRecords, bulkUpdate }
}

/**
 * Carga automática: recarga (debounced) cuando cambia la query, trae las
 * categorías, y escucha el evento global `kgps:refresh`. Se llama UNA vez, en el
 * panel del módulo. Generalización de la parte de efectos de `useItems`.
 */
export function useContentAutoLoad<T extends ContentRecord, TInput>(
  useStore: ContentStoreHook<T>,
  api: ContentApi<T, TInput>
): void {
  const setResults = useStore((s) => s.setResults)
  const setLoading = useStore((s) => s.setLoading)
  const setCategories = useStore((s) => s.setCategories)
  const query = useStore((s) => s.query)

  const reload = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const { items, total } = await api.query(query)
      setResults(items, total)
    } finally {
      setLoading(false)
    }
  }, [api, query, setResults, setLoading])

  useEffect(() => {
    const handle = setTimeout(reload, 150)
    return () => clearTimeout(handle)
  }, [reload])

  useEffect(() => {
    api.listCategories().then(setCategories)
  }, [api, setCategories])

  useEffect(() => {
    window.addEventListener('kgps:refresh', reload)
    return () => window.removeEventListener('kgps:refresh', reload)
  }, [reload])
}
