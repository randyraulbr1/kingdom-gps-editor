import { useLayoutEffect, useRef, useState } from 'react'
import { WorldEntityType, type Position, type WorldZone } from '@shared-types/world'
import type { WorldEntityUI } from '../types'
import type { ClipboardEntry } from '../utils/clipboard'
import { getEntityIcon } from '../utils/markerColors'
import {
  MapPin,
  Hexagon,
  Store,
  Copy,
  Scissors,
  ClipboardPaste,
  Trash2,
  Crosshair,
  SlidersHorizontal,
  MessageSquare,
  Power
} from 'lucide-react'

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
  clipboard: ClipboardEntry | null
  onClose(): void
  onCreatePin(position: Position): void
  onCreateEntity(type: WorldEntityType, position: Position): void
  onStartZone(position: Position): void
  onImportOsm(zone: WorldZone): void
  onDeleteZone(zone: WorldZone): void
  onSelectEntity(worldId: string): void
  onOpenProperties(worldId: string): void
  onOpenInteraction(entity: WorldEntityUI): void
  onCopyEntity(worldId: string): void
  onCutEntity(worldId: string): void
  onPasteAt(position: Position): void
  onDuplicateEntity(worldId: string): void
  onToggleEntity(worldId: string): void
  onDeleteEntity(worldId: string): void
}

function MenuItem({
  icon,
  label,
  shortcut,
  onClick,
  danger
}: {
  icon?: React.ReactNode
  label: string
  shortcut?: string
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
      <span className="flex-1">{label}</span>
      {shortcut && <span className="ml-2 text-[10px] tracking-wide text-slate-500">{shortcut}</span>}
    </button>
  )
}

function Separator(): JSX.Element {
  return <div className="my-1 h-px bg-surface-border" />
}

/**
 * Menú contextual del mapa, estilo editor de escritorio (docs 25 y 28). Se
 * posiciona en el punto del clic y se ajusta (voltea y luego fija dentro del
 * panel) para no quedar cortado por ningún borde; si aun así es más alto que el
 * panel, permite scroll. El cierre y el reposicionamiento los gestiona el panel
 * (overlay + clic derecho).
 */
export function MapContextMenu(props: Props): JSX.Element {
  const { context, clipboard } = props
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
    const margin = 4
    const width = el.offsetWidth
    const height = el.offsetHeight

    let left = context.screen.x
    let top = context.screen.y
    // Si se sale por la derecha, abrir hacia la izquierda del cursor.
    if (left + width > parentWidth) left = context.screen.x - width
    // Si se sale por abajo, abrir hacia arriba del cursor.
    if (top + height > parentHeight) top = context.screen.y - height
    // Fijar siempre dentro del panel para que nunca quede cortado por un borde.
    left = Math.max(margin, Math.min(left, parentWidth - width - margin))
    top = Math.max(margin, Math.min(top, parentHeight - height - margin))
    setPos({ left, top })
  }, [context.screen.x, context.screen.y])

  const stop = (event: React.MouseEvent): void => event.stopPropagation()

  // ¿El portapapeles es compatible para pegar aquí? (por ahora, cualquier entidad copiada/cortada)
  const canPaste = clipboard !== null

  return (
    <div
      ref={menuRef}
      onClick={stop}
      onContextMenu={(e) => e.preventDefault()}
      className="absolute z-[1200] flex max-h-[80%] min-w-[210px] flex-col overflow-y-auto rounded-md border border-surface-border bg-surface-1 py-1 shadow-xl"
      style={{ left: pos.left, top: pos.top }}
    >
      {context.kind === 'entity'
        ? renderEntityMenu(props, context.entity)
        : renderMapMenu(props, context, canPaste)}
    </div>
  )
}

/** Menú para una entidad. El orden sigue doc 28; Propiedades siempre al final. */
function renderEntityMenu(props: Props, entity: WorldEntityUI): JSX.Element {
  const { onClose } = props

  return (
    <>
      <div className="truncate px-3 py-1 text-[11px] font-medium text-slate-400">
        {getEntityIcon(entity.entityType)} {entity.name}
      </div>
      <Separator />

      {entity.entityType === WorldEntityType.Shop && (
        <>
          <MenuItem
            icon={<Store size={13} />}
            label="Abrir tienda"
            onClick={() => {
              props.onOpenInteraction(entity)
              onClose()
            }}
          />
          <Separator />
        </>
      )}

      {entity.entityType === WorldEntityType.Npc && (
        <>
          <MenuItem
            icon={<MessageSquare size={13} />}
            label="Abrir diálogo"
            onClick={() => {
              props.onOpenInteraction(entity)
              onClose()
            }}
          />
          <Separator />
        </>
      )}

      <MenuItem
        icon={<Crosshair size={13} />}
        label="Editar (inspector)"
        onClick={() => {
          props.onSelectEntity(entity.worldId)
          onClose()
        }}
      />
      <Separator />

      <MenuItem
        icon={<Copy size={13} />}
        label="Copiar"
        shortcut="Ctrl+C"
        onClick={() => {
          props.onCopyEntity(entity.worldId)
          onClose()
        }}
      />
      <MenuItem
        icon={<Scissors size={13} />}
        label="Cortar"
        shortcut="Ctrl+X"
        onClick={() => {
          props.onCutEntity(entity.worldId)
          onClose()
        }}
      />
      <MenuItem
        icon={<Copy size={13} />}
        label="Duplicar"
        shortcut="Ctrl+D"
        onClick={() => {
          props.onDuplicateEntity(entity.worldId)
          onClose()
        }}
      />
      <Separator />

      <MenuItem
        icon={<Power size={13} />}
        label={entity.enabled ? 'Desactivar' : 'Activar'}
        onClick={() => {
          props.onToggleEntity(entity.worldId)
          onClose()
        }}
      />
      <MenuItem
        icon={<Trash2 size={13} />}
        label="Eliminar"
        shortcut="Supr"
        danger
        onClick={() => {
          props.onDeleteEntity(entity.worldId)
          onClose()
        }}
      />
      <Separator />

      <MenuItem
        icon={<SlidersHorizontal size={13} />}
        label="Propiedades"
        shortcut="Alt+Enter"
        onClick={() => {
          props.onOpenProperties(entity.worldId)
          onClose()
        }}
      />
    </>
  )
}

/** Menú para el mapa vacío (posiblemente dentro de una zona). */
function renderMapMenu(
  props: Props,
  context: Extract<MapMenuContext, { kind: 'map' }>,
  canPaste: boolean
): JSX.Element {
  const { onClose } = props
  return (
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
          <Separator />
        </>
      )}

      {canPaste && (
        <>
          <MenuItem
            icon={<ClipboardPaste size={13} />}
            label="Pegar aquí"
            shortcut="Ctrl+V"
            onClick={() => {
              props.onPasteAt(context.position)
              onClose()
            }}
          />
          <Separator />
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
      <Separator />
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
      <Separator />
      <MenuItem
        icon={<Hexagon size={13} />}
        label="Iniciar zona aquí"
        onClick={() => {
          props.onStartZone(context.position)
          onClose()
        }}
      />
    </>
  )
}
