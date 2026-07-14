import { useEffect, useState } from 'react'
import { Search, X, ImageOff } from 'lucide-react'
import type { IconRecord } from '@shared-types/icon'
import { IconThumbnail } from './IconThumbnail'

interface Props {
  /** Icono actualmente asignado (para resaltarlo). */
  currentIconId: number | null
  onClose(): void
  onPick(iconId: number | null): void
}

/**
 * Ventana para elegir el icono de un contenido desde la Biblioteca de Iconos.
 * Guarda solo la REFERENCIA (iconId), nunca la imagen (ver RECURSOS_ARQUITECTURA.md).
 */
export function IconPickerModal({ currentIconId, onClose, onPick }: Props): JSX.Element {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [icons, setIcons] = useState<IconRecord[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.icons
      .listCategories()
      .then(setCategories)
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const handle = window.setTimeout(() => {
      window.api.icons
        .list({ search: search || undefined, category: category || undefined, limit: 300, offset: 0 })
        .then((res) => {
          if (cancelled) return
          setIcons(res.items)
          setTotal(res.total)
        })
        .catch(() => undefined)
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 150)
    return () => {
      cancelled = true
      window.clearTimeout(handle)
    }
  }, [search, category])

  return (
    <div className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/50 p-6" onClick={onClose}>
      <div
        className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-surface-border bg-surface-1 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-surface-border px-4 py-3">
          <h2 className="text-sm font-medium text-slate-100">Elegir icono</h2>
          <span className="text-xs text-slate-500">({total})</span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded p-1 text-slate-400 hover:bg-surface-2 hover:text-slate-200"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-surface-border p-3">
          <div className="relative min-w-[180px] flex-1">
            <Search size={14} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar icono…"
              className="w-full rounded-md border border-surface-border bg-surface-2 py-1.5 pl-7 pr-2 text-sm text-slate-200 outline-none focus:border-accent"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-surface-border bg-surface-2 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-accent"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onPick(null)}
            className="flex items-center gap-1.5 rounded-md border border-surface-border px-2.5 py-1.5 text-xs text-slate-300 hover:bg-surface-2"
          >
            <ImageOff size={13} /> Sin icono
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {loading ? (
            <p className="p-4 text-center text-xs text-slate-500">Cargando…</p>
          ) : icons.length === 0 ? (
            <p className="p-4 text-center text-xs text-slate-500">
              No hay iconos. Impórtalos primero en la Biblioteca de Iconos.
            </p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-2">
              {icons.map((icon) => (
                <button
                  key={icon.id}
                  type="button"
                  onClick={() => onPick(icon.id)}
                  title={icon.fileName}
                  className={`flex aspect-square items-center justify-center rounded-md border p-1 hover:border-accent hover:bg-surface-2 ${
                    icon.id === currentIconId ? 'border-accent bg-accent-muted' : 'border-surface-border bg-surface-2/40'
                  }`}
                >
                  <IconThumbnail iconId={icon.id} size={40} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
