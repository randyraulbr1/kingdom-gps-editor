import { useLayoutEffect, useRef, useState } from 'react'
import { WorldEntityType, type Position, type WorldZone } from '@shared-types/world'
import type { WorldEntityUI } from '../types'
import { getEntityIcon } from '../utils/markerColors'
import { MapPin, Hexagon, Store, Copy, Trash2, Crosshair } from 'lucide-react'

/** Qué se hizo clic derecho: mapa vacío (posiblemente dentro de una zona) o una entidad. */
export type MapMenuContext =
  | { kind: 'map'; position: Position; screen: { x: number; y: number }; zone: WorldZone | null }
  | { kind: 'entity'; position: Position; screen: { x: number; y: number }; entity: WorldEntityUI }

/** Tipos de entidad ofrecidos en el menú "Crear…", en orden. */
const CREATE_TYPES: WorldEntityType[] = [
  WorldEntityType.Npc,
  WorldEntityType.Enemy,
  WorldEntityType.Object,
  WorldEntityType.Chest,
  WorldEntityType.Shop,
  WorldEntityType.Resource,
  WorldEntityType.Quest,
  WorldEntityType.Event
]

const TYPE_LABELS: Partial<Record<WorldEntityType, string>> = {
  [WorldEntityType.Npc]: 'NPC',
  [WorldEntityType.Enemy]: 'Enemigo',
  [WorldEntityType.Object]: 'Objeto',
  [WorldEntityType.Chest]: 'Cofre',
  [WorldEntityType.Shop]: 'Tienda',
  [WorldEntityType.Resource]: 'Recurso',
  [WorldEntityType.Quest]: 'Misión',
  [WorldEntityType.Event]: 'Evento'
}

interface Props {
  context: MapMenuContext
  onClose(): void
  onCreatePin(position: Position): void
  onCreateEntity(type: WorldEntityType, position: Position): void
  onStartZone(position: Position): void
  onImportOsm(zone: WorldZone): void
  onDeleteZone(zone: WorldZone): void
  onSelectEntity(worldId: string): void
  onDuplicateEntity(worldId: string): void
  onDeleteEntity(worldId: string): void
}

function MenuItem({
  icon,
  label,
  onClick,
  danger
}: {
  icon?: React.ReactNode
  label: string
  onClick(): void
  danger?: boolean
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-surface-2 ${
        danger ? 'text-red-400' : 'text-slate-200'
      }`}
    >
      {icon ?? <span className="w-3.5" />}
      {label}
    </button>
  )
}

/**
 * Menú contextual del mapa, estilo editor de escritorio. Se posiciona en el punto
 * del clic y se voltea (hacia arriba / izquierda) si se saldría del panel. El
 * cierre y el reposicionamiento los gestiona el panel (overlay + clic derecho).
 */
export function MapContextMenu(props: Props): JSX.Element {
  const { context, onClose } = props
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number }>({
    left: context.screen.x,
    top: context.screen.y
  })

  useLayoutEffect(() => {
    const el = menuRef.current
    if (!el) return
    const parent = el.offsetParent as HTMLElement | null
    const parentWidth = parent?.clientWidth ?? window.innerWidth
    const parentHeight = parent?.clientHeight ?? window.innerHeight
    const width = el.offsetWidth
    const height = el.offsetHeight

    let left = context.screen.x
    let top = context.screen.y
    // Si se sale por la derecha, abrir hacia la izquierda del cursor.
    if (left + width > parentWidth) left = Math.max(4, context.screen.x - width)
    // Si se sale por abajo, abrir hacia arriba del cursor.
    if (top + height > parentHeight) top = Math.max(4, context.screen.y - height)
    setPos({ left, top })
  }, [context.screen.x, context.screen.y])

  const stop = (event: React.MouseEvent): void => event.stopPropagation()

  return (
    <div
      ref={menuRef}
      onClick={stop}
      onContextMenu={(e) => e.preventDefault()}
      className="absolute z-[1200] min-w-[190px] overflow-hidden rounded-md border border-surface-border bg-surface-1 py-1 shadow-xl"
      style={{ left: pos.left, top: pos.top }}
    >
      {context.kind === 'entity' ? (
        <>
          <div className="truncate px-3 py-1 text-[11px] font-medium text-slate-400">
            {getEntityIcon(context.entity.entityType)} {context.entity.name}
          </div>
          <div className="my-1 h-px bg-surface-border" />
          <MenuItem
            icon={<Crosshair size={13} />}
            label="Seleccionar / editar"
            onClick={() => {
              props.onSelectEntity(context.entity.worldId)
              onClose()
            }}
          />
          <MenuItem
            icon={<Copy size={13} />}
            label="Duplicar"
            onClick={() => {
              props.onDuplicateEntity(context.entity.worldId)
              onClose()
            }}
          />
          <MenuItem
            icon={<Trash2 size={13} />}
            label="Eliminar"
            danger
            onClick={() => {
              props.onDeleteEntity(context.entity.worldId)
              onClose()
            }}
          />
        </>
      ) : (
        <>
          {context.zone && (
            <>
              <div className="truncate px-3 py-1 text-[11px] font-medium" style={{ color: context.zone.color }}>
                ▧ {context.zone.name}
              </div>
              <MenuItem
                icon={<Store size={13} />}
                label="Importar lugares reales (OSM)…"
                onClick={() => {
                  props.onImportOsm(context.zone as WorldZone)
                  onClose()
                }}
              />
              <MenuItem
                icon={<Trash2 size={13} />}
                label="Eliminar zona"
                danger
                onClick={() => {
                  props.onDeleteZone(context.zone as WorldZone)
                  onClose()
                }}
              />
              <div className="my-1 h-px bg-surface-border" />
            </>
          )}

          <MenuItem
            icon={<MapPin size={13} />}
            label="Crear pin"
            onClick={() => {
              props.onCreatePin(context.position)
              onClose()
            }}
          />
          <div className="my-1 h-px bg-surface-border" />
          <div className="px-3 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">Crear entidad</div>
          {CREATE_TYPES.map((type) => (
            <MenuItem
              key={type}
              icon={<span className="text-[13px] leading-none">{getEntityIcon(type)}</span>}
              label={TYPE_LABELS[type] ?? type}
              onClick={() => {
                props.onCreateEntity(type, context.position)
                onClose()
              }}
            />
          ))}
          <div className="my-1 h-px bg-surface-border" />
          <MenuItem
            icon={<Hexagon size={13} />}
            label="Iniciar zona aquí"
            onClick={() => {
              props.onStartZone(context.position)
              onClose()
            }}
          />
        </>
      )}
    </div>
  )
}
