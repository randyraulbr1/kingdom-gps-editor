import { useEffect, useState } from 'react'
import {
  Users,
  RefreshCw,
  UserPlus,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronDown,
  Coins,
  Heart,
  Utensils,
  Backpack,
  MapPin,
  Star
} from 'lucide-react'
import type { GamePlayer } from '@shared-types/system'

/**
 * Panel de administración de jugadores (grupo Herramientas). El editor es el
 * panel adm oficial: crea cuentas de prueba, lista jugadores y limpia cuentas.
 * La autenticación con el servidor es automática (Configuración ▸ Servidor).
 */
export function PlayersAdminPanel(): JSX.Element {
  const players = typeof window !== 'undefined' ? window.api?.players : undefined
  const [list, setList] = useState<GamePlayer[]>([])
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null)
  const [form, setForm] = useState({ usuario: '', password: '', telefono: '' })
  const [confirmClear, setConfirmClear] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const flash = (ok: boolean, text: string): void => {
    setNotice({ ok, text })
    window.setTimeout(() => setNotice((n) => (n?.text === text ? null : n)), 4000)
  }

  const refresh = async (): Promise<void> => {
    if (!players) return
    setLoading(true)
    try {
      setList(await players.list())
    } catch (error) {
      flash(false, error instanceof Error ? error.message : 'No se pudo cargar la lista.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const create = async (): Promise<void> => {
    if (!players) return
    if (form.usuario.trim().length < 2) return flash(false, 'El usuario necesita al menos 2 caracteres.')
    if (form.password.length < 4) return flash(false, 'La contraseña necesita al menos 4 caracteres.')
    const result = await players.create({ usuario: form.usuario.trim(), password: form.password, telefono: form.telefono.trim() })
    flash(result.ok, result.message)
    if (result.ok) {
      setForm({ usuario: '', password: '', telefono: '' })
      void refresh()
    }
  }

  const clearAll = async (): Promise<void> => {
    if (!players) return
    setConfirmClear(false)
    const result = await players.clearAll()
    flash(result.ok, result.message)
    if (result.ok) void refresh()
  }

  if (!players) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Header />
        <p className="mt-4 flex items-center gap-2 text-xs text-slate-400">
          <Info size={14} /> Solo disponible en la app de escritorio.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Header />

      {notice && (
        <div
          className={`mt-4 flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${
            notice.ok
              ? 'border-green-700/40 bg-green-900/20 text-green-300'
              : 'border-amber-700/40 bg-amber-900/20 text-amber-300'
          }`}
        >
          {notice.ok ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
          {notice.text}
        </div>
      )}

      {/* Crear cuenta de prueba */}
      <section className="mt-4 rounded-lg border border-surface-border bg-surface-1 p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-100">
          <UserPlus size={15} className="text-slate-400" /> Crear jugador
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input
            type="text"
            value={form.usuario}
            onChange={(e) => setForm((f) => ({ ...f, usuario: e.target.value }))}
            placeholder="Usuario"
            className="rounded-md border border-surface-border bg-surface-2 px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-accent focus:outline-none"
          />
          <input
            type="text"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Contraseña"
            className="rounded-md border border-surface-border bg-surface-2 px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-accent focus:outline-none"
          />
          <input
            type="text"
            value={form.telefono}
            onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
            placeholder="Teléfono (opcional)"
            className="rounded-md border border-surface-border bg-surface-2 px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-accent focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => void create()}
          className="mt-3 flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:brightness-110"
        >
          <UserPlus size={13} /> Crear jugador
        </button>
      </section>

      {/* Lista de jugadores */}
      <section className="mt-4 rounded-lg border border-surface-border bg-surface-1 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-100">
            Jugadores <span className="text-slate-500">({list.length})</span>
          </h2>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-md border border-surface-border px-3 py-1.5 text-xs text-slate-200 hover:bg-surface-2 disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Actualizar
          </button>
        </div>

        {list.length === 0 ? (
          <p className="text-xs text-slate-500">
            No hay jugadores registrados todavía (o aún falta configurar/probar el servidor en Configuración ▸ Servidor).
          </p>
        ) : (
          <ul className="divide-y divide-surface-border">
            {list.map((p) => (
              <PlayerRow key={p.id} player={p} expanded={expandedId === p.id} onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)} />
            ))}
          </ul>
        )}
      </section>

      {/* Zona peligrosa */}
      <section className="mt-4 rounded-lg border border-red-900/40 bg-red-950/10 p-4">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-medium text-red-300">
          <Trash2 size={15} /> Limpiar cuentas del juego
        </h2>
        <p className="mb-3 text-[11px] text-slate-400">
          Borra todas las cuentas dejando solo la de admin. El servidor hace un respaldo antes (restaurable).
          Úsalo para empezar a probar con cuentas nuevas.
        </p>
        {confirmClear ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-300">¿Seguro? Esto borra todas las cuentas.</span>
            <button
              type="button"
              onClick={() => void clearAll()}
              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:brightness-110"
            >
              Sí, limpiar
            </button>
            <button
              type="button"
              onClick={() => setConfirmClear(false)}
              className="rounded-md border border-surface-border px-3 py-1.5 text-xs text-slate-200 hover:bg-surface-2"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            className="flex items-center gap-1.5 rounded-md border border-red-800/60 px-3 py-1.5 text-xs text-red-300 hover:bg-red-900/20"
          >
            <Trash2 size={13} /> Limpiar cuentas…
          </button>
        )}
      </section>
    </div>
  )
}

function Header(): JSX.Element {
  return (
    <>
      <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-100">
        <Users size={18} /> Jugadores
      </h1>
      <p className="mt-1 text-xs text-slate-500">
        Cuentas <strong>reales</strong> registradas en el juego, con sus datos (dinero, nivel, inventario, posición…).
        Es lo que antes hacía el panel de admin dentro del juego. Autenticación automática (Configuración ▸ Servidor).
      </p>
    </>
  )
}

/** Una fila de jugador real, desplegable para ver sus datos de partida. */
function PlayerRow({
  player,
  expanded,
  onToggle
}: {
  player: GamePlayer
  expanded: boolean
  onToggle(): void
}): JSX.Element {
  const pos = player.posicion
  return (
    <li className="py-1">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 rounded px-1 py-1.5 text-left text-xs hover:bg-surface-2"
      >
        {expanded ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
        <span className="flex-1 font-medium text-slate-200">
          {player.nombre}
          {player.esAdmin && <span className="ml-2 rounded bg-accent/20 px-1.5 py-0.5 text-[10px] text-accent">admin</span>}
          {player.muerto && <span className="ml-2 rounded bg-red-900/40 px-1.5 py-0.5 text-[10px] text-red-300">muerto</span>}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-slate-400"><Star size={11} /> {player.nivel ?? 1}</span>
        <span className="flex items-center gap-1 text-[11px] text-amber-400"><Coins size={11} /> {player.dinero ?? 0}</span>
      </button>

      {expanded && (
        <div className="ml-6 mb-1 grid grid-cols-2 gap-x-4 gap-y-1 rounded-md border border-surface-border bg-surface-2/50 p-2 text-[11px] text-slate-300 sm:grid-cols-3">
          <Datum icon={<Star size={11} className="text-slate-400" />} label="Nivel" value={String(player.nivel ?? 1)} />
          <Datum icon={<Coins size={11} className="text-amber-400" />} label="Dinero" value={`$ ${player.dinero ?? 0}`} />
          <Datum icon={<Star size={11} className="text-sky-400" />} label="Experiencia" value={String(player.experiencia ?? 0)} />
          <Datum icon={<Heart size={11} className="text-red-400" />} label="Vida" value={player.vida != null ? String(player.vida) : '—'} />
          <Datum icon={<Utensils size={11} className="text-orange-400" />} label="Hambre" value={player.hambre != null ? String(player.hambre) : '—'} />
          <Datum icon={<Backpack size={11} className="text-slate-400" />} label="Objetos" value={String(player.objetos ?? 0)} />
          <Datum
            icon={<MapPin size={11} className="text-green-400" />}
            label="Posición"
            value={pos ? `${pos[0].toFixed(5)}, ${pos[1].toFixed(5)}` : '—'}
          />
          {player.telefono && <Datum icon={<Info size={11} className="text-slate-400" />} label="Teléfono" value={player.telefono} />}
          <Datum icon={<Info size={11} className="text-slate-400" />} label="ID" value={player.id} />
        </div>
      )}
    </li>
  )
}

function Datum({ icon, label, value }: { icon: JSX.Element; label: string; value: string }): JSX.Element {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-slate-500">{label}:</span>
      <span className="truncate text-slate-200">{value}</span>
    </div>
  )
}
