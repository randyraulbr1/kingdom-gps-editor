import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import type { WorldZone, EnemyRoute } from '@shared-types/world'
import { useWorldEditorStore } from '../hooks/useWorldEditorStore'
import { searchWorld, type SearchResult } from '../content/mapSearch'

interface Props {
  zones: WorldZone[]
  routes: EnemyRoute[]
  onSelect(result: SearchResult): void
}

const KIND_BADGE: Record<SearchResult['kind'], string> = {
  entity: '📍',
  zone: '▧',
  route: '⚔'
}

/**
 * Barra de búsqueda global del mapa (doc 26). Busca pines, zonas y rutas por
 * nombre, tipo o ID; al elegir un resultado, el mapa se centra y se abre su
 * inspector (lo gestiona el panel padre vía onSelect).
 */
export function MapSearchBar({ zones, routes, onSelect }: Props): JSX.Element {
  const entities = useWorldEditorStore((s) => s.entities)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const results = useMemo(
    () => (query.trim() ? searchWorld(query, { entities, zones, routes }, 15) : []),
    [query, entities, zones, routes]
  )

  const choose = (result: SearchResult): void => {
    onSelect(result)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-1 rounded-md border border-surface-border bg-surface-2 px-2">
        <Search size={12} className="text-slate-500" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results.length > 0) choose(results[0])
            if (e.key === 'Escape') {
              setQuery('')
              setOpen(false)
            }
          }}
          placeholder="Buscar en el mapa…"
          className="w-44 bg-transparent py-1.5 text-xs text-slate-200 outline-none placeholder:text-slate-500"
        />
        {query && (
          <button type="button" onClick={() => { setQuery(''); setOpen(false) }} className="text-slate-500 hover:text-slate-300">
            <X size={12} />
          </button>
        )}
      </div>

      {open && query.trim() && (
        <div className="absolute right-0 top-full z-[1100] mt-1 max-h-72 w-64 overflow-y-auto rounded-md border border-surface-border bg-surface-1 py-1 shadow-xl">
          {results.length === 0 ? (
            <div className="px-3 py-2 text-[11px] text-slate-500">Sin resultados</div>
          ) : (
            results.map((r) => (
              <button
                key={`${r.kind}:${r.id}`}
                type="button"
                onClick={() => choose(r)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-surface-2"
              >
                <span className="shrink-0">{KIND_BADGE[r.kind]}</span>
                <span className="min-w-0 flex-1 truncate">{r.name}</span>
                <span className="shrink-0 text-[10px] text-slate-500">{r.subtitle}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
