import { useEffect, useState } from 'react'
import {
  WorldEntityType,
  type OsmCategoryKey,
  type OsmQueryResult,
  type WorldZone
} from '@shared-types/world'
import { OsmService } from '../services/osmService'
import { WorldEditorService } from '../services/entityService'
import { X, Loader2, MapPinned } from 'lucide-react'

interface Props {
  zone: WorldZone
  onClose(): void
  onImported(): void
}

interface CategoryMeta {
  key: OsmCategoryKey
  label: string
  emoji: string
  entityType: WorldEntityType
}

const CATEGORIES: CategoryMeta[] = [
  { key: 'pharmacy', label: 'Farmacias', emoji: '💊', entityType: WorldEntityType.Shop },
  { key: 'hospital', label: 'Hospitales', emoji: '🏥', entityType: WorldEntityType.Building },
  { key: 'fuel', label: 'Gasolineras', emoji: '⛽', entityType: WorldEntityType.Shop },
  { key: 'supermarket', label: 'Supermercados', emoji: '🛒', entityType: WorldEntityType.Shop }
]

const ENTITY_TYPE_BY_CATEGORY: Record<OsmCategoryKey, WorldEntityType> = {
  pharmacy: WorldEntityType.Shop,
  hospital: WorldEntityType.Building,
  fuel: WorldEntityType.Shop,
  supermarket: WorldEntityType.Shop
}

export function OsmImportModal({ zone, onClose, onImported }: Props): JSX.Element {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<OsmQueryResult | null>(null)
  const [selected, setSelected] = useState<Set<OsmCategoryKey>>(new Set())
  const [creating, setCreating] = useState(false)
  const [createdCount, setCreatedCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    OsmService.queryPlaces({ polygon: zone.points })
      .then((res) => {
        if (cancelled) return
        setResult(res)
        // Preseleccionar las categorías que sí tienen resultados.
        const withResults = new Set<OsmCategoryKey>(
          CATEGORIES.filter((c) => (res.countsByCategory[c.key] ?? 0) > 0).map((c) => c.key)
        )
        setSelected(withResults)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [zone])

  const totalFound = result ? result.places.length : 0

  const toggle = (key: OsmCategoryKey): void => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const selectedCount = result
    ? result.places.filter((p) => selected.has(p.category)).length
    : 0

  const handleCreate = async (): Promise<void> => {
    if (!result) return
    const toCreate = result.places.filter((p) => selected.has(p.category))
    if (toCreate.length === 0) return

    setCreating(true)
    try {
      for (const place of toCreate) {
        await WorldEditorService.createEntity({
          entityType: ENTITY_TYPE_BY_CATEGORY[place.category],
          entityId: null,
          name: place.name,
          position: place.position,
          properties: { source: 'osm', osmId: place.osmId, osmCategory: place.category, zoneId: zone.zoneId }
        })
      }
      setCreatedCount(toCreate.length)
      onImported()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="absolute inset-0 z-[1300] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[380px] max-w-[90%] overflow-hidden rounded-lg border border-surface-border bg-surface-1 shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-surface-border px-4 py-3">
          <MapPinned size={15} className="text-accent" />
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-100">Importar lugares reales</div>
            <div className="truncate text-[11px] text-slate-500">Zona: {zone.name} · OpenStreetMap</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded p-1 text-slate-400 hover:bg-surface-2 hover:text-slate-200"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-4 py-3">
          {loading && (
            <div className="flex items-center gap-2 py-6 text-sm text-slate-400">
              <Loader2 size={16} className="animate-spin" />
              Consultando OpenStreetMap dentro de la zona…
            </div>
          )}

          {!loading && error && (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          {!loading && !error && result && totalFound === 0 && (
            <div className="rounded-md border border-surface-border bg-surface-2 px-3 py-4 text-center text-xs text-slate-400">
              No se encontraron resultados de OpenStreetMap dentro de esta zona.
            </div>
          )}

          {!loading && !error && result && totalFound > 0 && createdCount === null && (
            <>
              <div className="mb-2 text-[11px] text-slate-500">
                Selecciona qué categorías crear como pines dentro de la zona:
              </div>
              <div className="space-y-1">
                {CATEGORIES.map((cat) => {
                  const count = result.countsByCategory[cat.key] ?? 0
                  const disabled = count === 0
                  return (
                    <label
                      key={cat.key}
                      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${
                        disabled
                          ? 'cursor-not-allowed border-surface-border/50 text-slate-600'
                          : 'cursor-pointer border-surface-border text-slate-200 hover:bg-surface-2'
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={disabled}
                        checked={selected.has(cat.key)}
                        onChange={() => toggle(cat.key)}
                      />
                      <span>
                        {cat.emoji} {cat.label}
                      </span>
                      <span className="ml-auto tabular-nums text-slate-500">{count}</span>
                    </label>
                  )
                })}
              </div>
            </>
          )}

          {createdCount !== null && (
            <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-4 text-center text-xs text-emerald-300">
              Se crearon {createdCount} pines dentro de la zona.
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-surface-border px-4 py-3">
          {createdCount === null ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-surface-border px-3 py-1.5 text-xs text-slate-300 hover:bg-surface-2"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={loading || creating || selectedCount === 0}
                onClick={handleCreate}
                className="flex items-center gap-1 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
              >
                {creating && <Loader2 size={12} className="animate-spin" />}
                Crear {selectedCount > 0 ? `${selectedCount} ` : ''}pines
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white"
            >
              Listo
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
