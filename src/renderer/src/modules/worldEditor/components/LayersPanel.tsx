import { useWorldEditorStore } from '../hooks/useWorldEditorStore'
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

export function LayersPanel(): JSX.Element {
  const layerVisibility = useWorldEditorStore((s) => s.layerVisibility)
  const toggleLayerVisibility = useWorldEditorStore((s) => s.toggleLayerVisibility)

  return (
    <div className="w-52 rounded-md border border-surface-border bg-surface-1 p-2 shadow-xl">
      <div className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Capas</div>
      {Object.values(WorldEntityType).map((type) => (
        <label
          key={type}
          className="flex items-center gap-2 rounded px-1.5 py-1 text-xs text-slate-300 hover:bg-surface-2"
        >
          <input
            type="checkbox"
            checked={layerVisibility[type]}
            onChange={() => toggleLayerVisibility(type)}
            className="accent-accent"
          />
          <span>{getEntityIcon(type)}</span>
          <span className="flex-1 truncate">{LABELS[type]}</span>
        </label>
      ))}
    </div>
  )
}
