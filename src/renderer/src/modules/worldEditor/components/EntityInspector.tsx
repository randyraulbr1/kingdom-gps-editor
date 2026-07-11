import { Trash2, Copy, Power, Store, MessageSquare, Swords, Package } from 'lucide-react'
import { WorldEntityType } from '@shared-types/world'
import { useSelectedEntity, useWorldEditorStore } from '../hooks/useWorldEditorStore'
import { WorldEditorService } from '../services/entityService'
import { TextField } from '@renderer/shared/components/inspector/fields'
import type { WorldEntityUI } from '../types'

interface EntityInspectorProps {
  onDelete(worldId: string): void
  onOpenInteraction(entity: WorldEntityUI): void
}

export function EntityInspector({ onDelete, onOpenInteraction }: EntityInspectorProps): JSX.Element {
  const entity = useSelectedEntity()
  const updateEntity = useWorldEditorStore((s) => s.updateEntity)
  const addEntity = useWorldEditorStore((s) => s.addEntity)
  const selectEntity = useWorldEditorStore((s) => s.selectEntity)

  if (!entity) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-500">
        Selecciona o coloca una entidad en el mapa
      </div>
    )
  }

  const handleRename = async (name: string): Promise<void> => {
    const updated = await WorldEditorService.updateEntity({ worldId: entity.worldId, patch: { name } })
    updateEntity(entity.worldId, updated)
  }

  const handleToggle = async (): Promise<void> => {
    const updated = await WorldEditorService.toggleEntity(entity.worldId)
    updateEntity(entity.worldId, updated)
  }

  const handleDuplicate = async (): Promise<void> => {
    const copy = await WorldEditorService.duplicateEntity(entity.worldId)
    addEntity({ ...copy, isSelected: false, isEditing: false })
    selectEntity(copy.worldId)
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <TextField label="Nombre" value={entity.name} onCommit={handleRename} />

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Tipo</label>
        <div className="text-sm text-slate-300">{entity.entityType}</div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Posición</label>
        <div className="text-xs text-slate-400">
          {entity.position.lat.toFixed(6)}, {entity.position.lng.toFixed(6)}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
          Estado de sincronización
        </label>
        <span className="inline-flex rounded-full border border-surface-border bg-surface-2 px-2 py-0.5 text-[10px] text-slate-300">
          {entity.syncStatus}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {entity.entityType === WorldEntityType.Shop && (
          <button
            type="button"
            onClick={() => onOpenInteraction(entity)}
            className="flex items-center gap-2 rounded-md border border-accent bg-accent-muted px-3 py-1.5 text-sm text-accent hover:brightness-110"
          >
            <Store size={14} /> Abrir tienda
          </button>
        )}
        {entity.entityType === WorldEntityType.Npc && (
          <button
            type="button"
            onClick={() => onOpenInteraction(entity)}
            className="flex items-center gap-2 rounded-md border border-accent bg-accent-muted px-3 py-1.5 text-sm text-accent hover:brightness-110"
          >
            <MessageSquare size={14} /> Abrir diálogo
          </button>
        )}
        {entity.entityType === WorldEntityType.Enemy && (
          <button
            type="button"
            onClick={() => onOpenInteraction(entity)}
            className="flex items-center gap-2 rounded-md border border-accent bg-accent-muted px-3 py-1.5 text-sm text-accent hover:brightness-110"
          >
            <Swords size={14} /> Abrir enemigo
          </button>
        )}
        {entity.entityType === WorldEntityType.Chest && (
          <button
            type="button"
            onClick={() => onOpenInteraction(entity)}
            className="flex items-center gap-2 rounded-md border border-accent bg-accent-muted px-3 py-1.5 text-sm text-accent hover:brightness-110"
          >
            <Package size={14} /> Abrir cofre
          </button>
        )}
        <button
          type="button"
          onClick={handleToggle}
          className="flex items-center gap-2 rounded-md border border-surface-border px-3 py-1.5 text-sm text-slate-200 hover:bg-surface-2"
        >
          <Power size={14} /> {entity.enabled ? 'Deshabilitar' : 'Habilitar'}
        </button>
        <button
          type="button"
          onClick={handleDuplicate}
          className="flex items-center gap-2 rounded-md border border-surface-border px-3 py-1.5 text-sm text-slate-200 hover:bg-surface-2"
        >
          <Copy size={14} /> Duplicar
        </button>
        <button
          type="button"
          onClick={() => onDelete(entity.worldId)}
          className="flex items-center gap-2 rounded-md border border-red-500/40 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10"
        >
          <Trash2 size={14} /> Eliminar
        </button>
      </div>

      <div className="text-[10px] text-slate-600">#{entity.worldId}</div>
    </div>
  )
}
