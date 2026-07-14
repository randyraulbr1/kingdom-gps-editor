import { useLayoutEffect, useRef, useState } from 'react'
import { UploadCloud, RefreshCw, Info, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import type { WorldEntityUI } from '../types'

interface Props {
  entity: WorldEntityUI
  screen: { x: number; y: number }
  onClose(): void
  onPublish(worldId: string): void
  onShowMessage(message: string): void
}

/** Estado de sincronización → color, etiqueta y mensaje claro (sin tecnicismos). */
function describe(status: string): { color: string; label: string; help: string } {
  switch (status) {
    case 'synced':
      return { color: '#22c55e', label: 'Sincronizado', help: 'Este pin ya sale en el juego real.' }
    case 'failed':
      return { color: '#ef4444', label: 'Falló', help: 'No se pudo subir al mundo.' }
    case 'syncing':
      return { color: '#3b82f6', label: 'Subiendo…', help: 'Se está enviando al servidor.' }
    case 'pending':
      return { color: '#f59e0b', label: 'Pendiente', help: 'Tiene cambios sin subir.' }
    default:
      return { color: '#94a3b8', label: 'Solo local', help: 'Todavía no se ha subido al mundo.' }
  }
}

/**
 * Menú que se abre al hacer clic en la bolita de estado de un pin. Muestra
 * acciones según el estado (gris: subir; verde: resincronizar/ver estado; rojo:
 * reintentar/ver error). Mensajes claros, sin errores técnicos largos.
 */
export function SyncStatusMenu({ entity, screen, onClose, onPublish, onShowMessage }: Props): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: screen.x, top: screen.y })
  const info = describe(entity.syncStatus)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const parent = el.offsetParent as HTMLElement | null
    const pw = parent?.clientWidth ?? window.innerWidth
    const ph = parent?.clientHeight ?? window.innerHeight
    const m = 6
    let left = screen.x
    let top = screen.y
    if (left + el.offsetWidth > pw) left = screen.x - el.offsetWidth
    if (top + el.offsetHeight > ph) top = screen.y - el.offsetHeight
    left = Math.max(m, Math.min(left, pw - el.offsetWidth - m))
    top = Math.max(m, Math.min(top, ph - el.offsetHeight - m))
    setPos({ left, top })
  }, [screen.x, screen.y])

  const publish = (): void => {
    onPublish(entity.worldId)
    onClose()
  }

  const status = entity.syncStatus

  return (
    <div
      ref={ref}
      onClick={(e) => e.stopPropagation()}
      className="absolute z-[1250] min-w-[210px] rounded-md border border-surface-border bg-surface-1 py-1 shadow-xl"
      style={{ left: pos.left, top: pos.top }}
    >
      <div className="flex items-center gap-2 px-3 py-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: info.color }} />
        <span className="text-xs font-medium text-slate-200">{info.label}</span>
      </div>
      <div className="px-3 pb-1.5 text-[11px] text-slate-500">{info.help}</div>
      <div className="my-1 h-px bg-surface-border" />

      {status === 'syncing' ? (
        <MenuItem icon={<Loader2 size={13} className="animate-spin" />} label="Subiendo…" disabled onClick={() => undefined} />
      ) : status === 'synced' ? (
        <>
          <MenuItem icon={<RefreshCw size={13} />} label="Volver a sincronizar" onClick={publish} />
          <MenuItem
            icon={<CheckCircle2 size={13} className="text-green-400" />}
            label="Ver estado"
            onClick={() => {
              onShowMessage('Este pin ya sale en el juego real.')
              onClose()
            }}
          />
        </>
      ) : status === 'failed' ? (
        <>
          <MenuItem icon={<RefreshCw size={13} />} label="Reintentar subida" onClick={publish} />
          <MenuItem
            icon={<AlertTriangle size={13} className="text-amber-400" />}
            label="Ver error del servidor"
            onClick={() => {
              onShowMessage(entity.lastSyncError ? `Error: ${entity.lastSyncError}` : 'No hay detalle del error.')
              onClose()
            }}
          />
        </>
      ) : (
        <>
          <MenuItem icon={<UploadCloud size={13} />} label="Subir al mundo" onClick={publish} />
          {status === 'pending' && (
            <MenuItem
              icon={<Info size={13} className="text-slate-400" />}
              label="Ver estado"
              onClick={() => {
                onShowMessage('Tiene cambios sin subir. Usa "Subir al mundo".')
                onClose()
              }}
            />
          )}
        </>
      )}
    </div>
  )
}

function MenuItem({
  icon,
  label,
  onClick,
  disabled
}: {
  icon: React.ReactNode
  label: string
  onClick(): void
  disabled?: boolean
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-slate-200 hover:bg-surface-2 disabled:opacity-50"
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
