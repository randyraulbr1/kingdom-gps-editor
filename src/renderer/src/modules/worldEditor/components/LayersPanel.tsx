import { Eye, EyeOff, Lock, Unlock } from 'lucide-react'
import { useWorldEditorStore, useEntityCountByType } from '../hooks/useWorldEditorStore'
import { WorldEntityType } from '@shared-types/world'
import { getEntityIcon } from '../utils/markerColors'

const LABELS: Record<WorldEntityType, string> = {
  [WorldEntityType.Object]: 'Objetos',
  [WorldEntityType.Enemy]: 'Enemigos',
  [WorldEntityType.Npc]: 'NPCs',
  [WorldEntityType.Chest]: 'Cofres',
  [WorldEntityType.Shop]: 'Tiendas',
  [WorldEntityType.Quest]: 'Misiones',
  [WorldEntityType.Resource]: 'Recursos',
  [WorldEntityType.Plant]: 'Plantas',
  [WorldEntityType.Event]: 'Eventos',
  [WorldEntityType.Zone]: 'Zonas',
  [WorldEntityType.SpawnPoint]: 'Puntos de spawn',
  [WorldEntityType.Building]: 'Construcciones',
  [WorldEntityType.Teleporter]: 'Teletransportadores',
  [WorldEntityType.Marker]: 'Marcadores'
}

/**
 * Panel de capas (doc 26): por cada tipo de entidad permite mostrar/ocultar,
 * bloquear (para no moverla por accidente) y ver su contador. La visibilidad y
 * el bloqueo se guardan en el estado persistido del proyecto.
 */
export function LayersPanel(): JSX.Element {
  const layerVisibility = useWorldEditorStore((s) => s.layerVisibility)
  const toggleLayerVisibility = useWorldEditorStore((s) => s.toggleLayerVisibility)
  const layerLocked = useWorldEditorStore((s) => s.layerLocked)
  const toggleLayerLock = useWorldEditorStore((s) => s.toggleLayerLock)
  const counts = useEntityCountByType()

  return (
    <div className="w-60 rounded-md border border-surface-border bg-surface-1 p-2 shadow-xl">
      <div className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Capas</div>
      {Object.values(WorldEntityType).map((type) => {
        const visible = layerVisibility[type]
        const locked = layerLocked[type]
        const count = counts[type] ?? 0
        return (
          <div key={type} className="flex items-center gap-1.5 rounded px-1.5 py-1 text-xs text-slate-300 hover:bg-surface-2">
            <button
              type="button"
              onClick={() => toggleLayerVisibility(type)}
              title={visible ? 'Ocultar capa' : 'Mostrar capa'}
              className="text-slate-400 hover:text-slate-100"
            >
              {visible ? <Eye size={13} /> : <EyeOff size={13} className="text-slate-600" />}
            </button>
            <span className="w-4 text-center">{getEntityIcon(type)}</span>
            <span className={`flex-1 truncate ${visible ? '' : 'text-slate-600'}`}>{LABELS[type]}</span>
            <span className="min-w-[18px] rounded bg-surface-2 px-1 text-center text-[10px] text-slate-400">{count}</span>
            <button
              type="button"
              onClick={() => toggleLayerLock(type)}
              title={locked ? 'Desbloquear capa' : 'Bloquear capa (evita mover)'}
              className={locked ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'}
            >
              {locked ? <Lock size={12} /> : <Unlock size={12} />}
            </button>
          </div>
        )
      })}
      <div className="mt-1 border-t border-surface-border px-1 pt-1 text-[10px] text-slate-600">
        Ocultar quita los marcadores del mapa. Bloquear impide arrastrarlos.
      </div>
    </div>
  )
}
