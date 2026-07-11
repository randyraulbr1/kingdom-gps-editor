import { useCallback, useEffect } from 'react'
import { useIconLibraryStore } from '../store/iconLibraryStore'

export function useIcons() {
  const query = useIconLibraryStore((s) => s.query)
  const setResults = useIconLibraryStore((s) => s.setResults)
  const setLoading = useIconLibraryStore((s) => s.setLoading)
  const setCategories = useIconLibraryStore((s) => s.setCategories)
  const setTags = useIconLibraryStore((s) => s.setTags)
  const patchIcon = useIconLibraryStore((s) => s.patchIcon)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const { items, total } = await window.api.icons.list(query)
      setResults(items, total)
    } finally {
      setLoading(false)
    }
  }, [query, setResults, setLoading])

  // Debounced so typing in the search box doesn't fire an IPC round-trip per keystroke.
  useEffect(() => {
    const handle = setTimeout(reload, 150)
    return () => clearTimeout(handle)
  }, [reload])

  // Undo/redo happens in the main process; this is how the grid finds out data changed under it.
  useEffect(() => {
    window.addEventListener('kgps:refresh', reload)
    return () => window.removeEventListener('kgps:refresh', reload)
  }, [reload])

  useEffect(() => {
    window.api.icons.listCategories().then(setCategories)
    window.api.icons.listTags().then(setTags)
  }, [setCategories, setTags])

  const toggleFavorite = useCallback(
    async (iconId: number) => {
      const updated = await window.api.icons.toggleFavorite(iconId)
      patchIcon(updated)
    },
    [patchIcon]
  )

  const setTagsFor = useCallback(
    async (iconId: number, tags: string[]) => {
      const updated = await window.api.icons.setTags(iconId, tags)
      patchIcon(updated)
      window.api.icons.listTags().then(setTags)
    },
    [patchIcon, setTags]
  )

  const importFolder = useCallback(async () => {
    const folder = await window.api.dialog.pickFolder()
    if (!folder) return null
    const result = await window.api.icons.importFolder(folder)
    await reload()
    window.api.icons.listCategories().then(setCategories)
    return result
  }, [reload, setCategories])

  return { reload, toggleFavorite, setTagsFor, importFolder }
}
