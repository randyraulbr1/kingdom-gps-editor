import { useEffect, useMemo, useState } from 'react'
import { Search, X, Package, Swords } from 'lucide-react'
import { WorldEntityType } from '@shared-types/world'
import type { Item } from '@shared-types/item'
import type { Monster } from '@shared-types/monster'

/** Un elemento del catálogo elegible (objeto o enemigo). */
export interface PickedCatalog {
  entityId: number
  name: string
  /** Propiedades específicas del tipo, listas para guardar en la entidad. */
  properties: Record<string, unknown>
  /** Emoji/icono para el subtítulo. */
  hint?: string
}

interface Props {
  type: WorldEntityType
  onClose(): void
  onPick(picked: PickedCatalog): void
}

/** Sólo estos tipos tienen catálogo del que elegir. */
export function typeHasCatalog(type: WorldEntityType): boolean {
  return type === WorldEntityType.Object || type === WorldEntityType.Enemy
}

/**
 * Ventana para elegir QUÉ objeto/enemigo colocar: muestra todos los que existen
 * (del módulo Objetos / Monstruos), con búsqueda. Al elegir uno, se coloca el pin
 * en la posición del clic con su catálogo enlazado (entityId + propiedades).
 */
export function EntityPickerModal({ type, onClose, onPick }: Props): JSX.Element {
  const isObject = type === WorldEntityType.Object
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [monsters, setMonsters] = useState<Monster[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const load = async (): Promise<void> => {
      try {
        if (isObject) {
          const res = await window.api.items.query({ limit: 100000, offset: 0 })
          if (!cancelled) setItems(res.items)
        } else {
          const res = await window.api.monsters.query({ limit: 100000, offset: 0 })
          if (!cancelled) setMonsters(res.items)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [isObject])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (isObject) {
      return items
        .filter((it) => !q || it.name.toLowerCase().includes(q) || it.category.toLowerCase().includes(q))
        .map<PickedCatalog & { sub: string }>((it) => ({
          entityId: it.id,
          name: it.name,
          sub: `${it.category} · ${it.rarity} · $${it.value}`,
          properties: {
            object: { itemId: it.id, itemName: it.name, category: it.category, rarity: it.rarity, value: it.value }
          }
        }))
    }
    return monsters
      .filter((m) => !q || m.name.toLowerCase().includes(q))
      .map<PickedCatalog & { sub: string }>((m) => ({
        entityId: m.id,
        name: m.name,
        sub: `nivel ${m.level ?? 1}`,
        properties: { enemy: { monsterId: m.id, name: m.name, level: m.level ?? 1 } }
      }))
  }, [isObject, items, monsters, search])

  const total = isObject ? items.length : monsters.length
  const Icon = isObject ? Package : Swords

  return (
    <div className="absolute inset-0 z-[1400] flex items-center justify-center bg-black/50 p-6" onClick={onClose}>
      <div
        className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-surface-border bg-surface-1 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-surface-border px-4 py-3">
          <Icon size={16} className="text-accent" />
          <h2 className="text-sm font-medium text-slate-100">
            Elige {isObject ? 'un objeto' : 'un enemigo'} para colocar
          </h2>
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

        <div className="border-b border-surface-border p-3">
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isObject ? 'Buscar objeto…' : 'Buscar enemigo…'}
              className="w-full rounded-md border border-surface-border bg-surface-2 py-1.5 pl-7 pr-2 text-sm text-slate-200 outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {loading ? (
            <p className="p-4 text-center text-xs text-slate-500">Cargando…</p>
          ) : total === 0 ? (
            <p className="p-4 text-center text-xs text-slate-500">
              No hay {isObject ? 'objetos' : 'enemigos'} creados todavía. Créalos primero en su módulo.
            </p>
          ) : rows.length === 0 ? (
            <p className="p-4 text-center text-xs text-slate-500">Nada coincide con la búsqueda.</p>
          ) : (
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {rows.map((row) => (
                <button
                  key={row.entityId}
                  type="button"
                  onClick={() => onPick({ entityId: row.entityId, name: row.name, properties: row.properties })}
                  className="flex items-center gap-2 rounded-md border border-surface-border bg-surface-2/40 px-3 py-2 text-left hover:border-accent hover:bg-surface-2"
                >
                  <Icon size={15} className="shrink-0 text-slate-400" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-slate-100">{row.name}</span>
                    <span className="block truncate text-[11px] text-slate-500">{row.sub}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
