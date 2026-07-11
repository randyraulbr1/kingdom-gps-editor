import { useEffect, useState } from 'react'

/** Module-scoped so every grid cell / inspector that references the same iconId shares one IPC round-trip. */
const cache = new Map<number, string | null>()

export function useIconPath(iconId: number | null): string | null {
  const [path, setPath] = useState<string | null>(iconId !== null ? (cache.get(iconId) ?? null) : null)

  useEffect(() => {
    if (iconId === null) {
      setPath(null)
      return
    }
    if (cache.has(iconId)) {
      setPath(cache.get(iconId) ?? null)
      return
    }
    let cancelled = false
    window.api.icons.get(iconId).then((icon) => {
      const value = icon?.relativePath ?? null
      cache.set(iconId, value)
      if (!cancelled) setPath(value)
    })
    return () => {
      cancelled = true
    }
  }, [iconId])

  return path
}
