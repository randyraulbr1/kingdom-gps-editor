import type { WorldZone } from '@shared-types/world'
import { Trash2 } from 'lucide-react'

interface Props {
  zones: WorldZone[]
  onRename(zoneId: string, name: string): void
  onRecolor(zoneId: string, color: string): void
  onDelete(zone: WorldZone): void
}

/** Panel lateral para editar zonas: renombrar, cambiar color y eliminar. */
export function ZonesPanel({ zones, onRename, onRecolor, onDelete }: Props): JSX.Element {
  return (
    <div className="w-64 rounded-md border border-surface-border bg-surface-1 p-2 shadow-xl">
      <div className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Zonas ({zones.length})
      </div>

      {zones.length === 0 ? (
        <div className="px-1 py-2 text-[11px] text-slate-500">
          No hay zonas. Usa el botón “Zona” y haz clics en el mapa para dibujar una.
        </div>
      ) : (
        <div className="space-y-1">
          {zones.map((zone) => (
            <div key={zone.zoneId} className="flex items-center gap-2 rounded px-1 py-1 hover:bg-surface-2">
              <input
                type="color"
                value={zone.color}
                onChange={(event) => onRecolor(zone.zoneId, event.target.value)}
                className="h-5 w-5 shrink-0 cursor-pointer rounded border border-surface-border bg-transparent p-0"
                title="Cambiar color"
              />
              <input
                type="text"
                defaultValue={zone.name}
                onBlur={(event) => {
                  const value = event.target.value.trim()
                  if (value && value !== zone.name) onRename(zone.zoneId, value)
                }}
                className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-xs text-slate-200 hover:border-surface-border focus:border-accent focus:outline-none"
              />
              <span className="shrink-0 text-[10px] tabular-nums text-slate-500">{zone.points.length} pts</span>
              <button
                type="button"
                onClick={() => onDelete(zone)}
                className="shrink-0 rounded p-1 text-slate-400 hover:bg-surface-2 hover:text-red-400"
                title="Eliminar zona"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
