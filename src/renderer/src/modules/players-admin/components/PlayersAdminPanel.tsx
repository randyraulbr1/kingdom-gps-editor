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
            La lista está vacía. Si crees que sí hay jugadores, entra a <strong>Configuración ▸ Servidor</strong>,
            escribe la <strong>contraseña de admin</strong> (la URL y el usuario ya vienen puestos), pulsa
            <strong> Probar conexión</strong> y vuelve a <strong>Actualizar</strong> aquí.
          </p>
        ) : (
          <ul className="divide-y divide-surface-border">
            {list.map((p) => (
              <PlayerRow
                key={p.id}
                player={p}
                expanded={expandedId === p.id}
                onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)}
                onChanged={() => void refresh()}
                flash={flash}
              />
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

/** Una fila de jugador real, desplegable para ver y EDITAR sus datos. */
function PlayerRow({
  player,
  expanded,
  onToggle,
  onChanged,
  flash
}: {
  player: GamePlayer
  expanded: boolean
  onToggle(): void
  onChanged(): void
  flash(ok: boolean, text: string): void
}): JSX.Element {
  const api = window.api.players
  const [edit, setEdit] = useState({
    dinero: String(player.dinero ?? 0),
    nivel: String(player.nivel ?? 1),
    experiencia: String(player.experiencia ?? 0),
    vida: player.vida != null ? String(player.vida) : '',
    hambre: player.hambre != null ? String(player.hambre) : ''
  })
  const [newPass, setNewPass] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)

  // Solo dígitos (evita el spinner de type=number y caracteres raros).
  const onlyInt = (v: string): string => v.replace(/[^0-9]/g, '')

  const saveStats = async (): Promise<void> => {
    setBusy(true)
    const toNum = (v: string): number | undefined => (v.trim() === '' ? undefined : Number(v))
    const result = await api.edit({
      id: player.id,
      dinero: toNum(edit.dinero),
      nivel: toNum(edit.nivel),
      experiencia: toNum(edit.experiencia),
      vida: toNum(edit.vida),
      hambre: toNum(edit.hambre)
    })
    setBusy(false)
    flash(result.ok, result.message)
    if (result.ok) onChanged()
  }

  const changePass = async (): Promise<void> => {
    if (newPass.length < 4) return flash(false, 'La contraseña necesita al menos 4 caracteres.')
    setBusy(true)
    const result = await api.setPassword(player.id, newPass)
    setBusy(false)
    flash(result.ok, result.message)
    if (result.ok) setNewPass('')
  }

  const toggleBan = async (): Promise<void> => {
    setBusy(true)
    const result = await api.ban(player.id, !isBanned(player))
    setBusy(false)
    flash(result.ok, result.message)
    if (result.ok) onChanged()
  }

  const remove = async (): Promise<void> => {
    setConfirmDelete(false)
    setBusy(true)
    const result = await api.delete(player.id)
    setBusy(false)
    flash(result.ok, result.message)
    if (result.ok) onChanged()
  }

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
        <div className="ml-6 mb-2 rounded-md border border-surface-border bg-surface-2/50 p-3 text-[11px] text-slate-300">
          {/* Datos de solo lectura */}
          <div className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
            <Datum icon={<Backpack size={11} className="text-slate-400" />} label="Objetos" value={String(player.objetos ?? 0)} />
            <Datum
              icon={<MapPin size={11} className="text-green-400" />}
              label="Posición"
              value={pos ? `${pos[0].toFixed(5)}, ${pos[1].toFixed(5)}` : '—'}
            />
            <Datum icon={<Info size={11} className="text-slate-400" />} label="ID" value={player.id} />
            {player.telefono && <Datum icon={<Info size={11} className="text-slate-400" />} label="Teléfono" value={player.telefono} />}
          </div>

          {player.esAdmin ? (
            <p className="text-[11px] text-slate-500">La cuenta de administrador no se edita ni se elimina desde aquí.</p>
          ) : (
            <>
              {/* Editar stats */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                <NumField label="Dinero" icon={<Coins size={11} className="text-amber-400" />} value={edit.dinero} onChange={(v) => setEdit((e) => ({ ...e, dinero: onlyInt(v) }))} />
                <NumField label="Nivel" icon={<Star size={11} className="text-slate-400" />} value={edit.nivel} onChange={(v) => setEdit((e) => ({ ...e, nivel: onlyInt(v) }))} />
                <NumField label="XP" icon={<Star size={11} className="text-sky-400" />} value={edit.experiencia} onChange={(v) => setEdit((e) => ({ ...e, experiencia: onlyInt(v) }))} />
                <NumField label="Vida" icon={<Heart size={11} className="text-red-400" />} value={edit.vida} onChange={(v) => setEdit((e) => ({ ...e, vida: onlyInt(v) }))} />
                <NumField label="Hambre" icon={<Utensils size={11} className="text-orange-400" />} value={edit.hambre} onChange={(v) => setEdit((e) => ({ ...e, hambre: onlyInt(v) }))} />
              </div>
              <button
                type="button"
                onClick={() => void saveStats()}
                disabled={busy}
                className="mt-2 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:brightness-110 disabled:opacity-50"
              >
                Guardar cambios
              </button>

              {/* Contraseña + acciones */}
              <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-surface-border pt-3">
                <label className="text-[11px] text-slate-400">
                  Nueva contraseña
                  <input
                    type="text"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="mín. 4"
                    className="mt-1 block w-40 rounded-md border border-surface-border bg-surface-1 px-2 py-1 text-xs text-slate-100 placeholder:text-slate-600 focus:border-accent focus:outline-none"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void changePass()}
                  disabled={busy}
                  className="rounded-md border border-surface-border px-3 py-1.5 text-xs text-slate-200 hover:bg-surface-2 disabled:opacity-50"
                >
                  Cambiar contraseña
                </button>
                <button
                  type="button"
                  onClick={() => void toggleBan()}
                  disabled={busy}
                  className="rounded-md border border-amber-800/60 px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-900/20 disabled:opacity-50"
                >
                  {isBanned(player) ? 'Quitar ban' : 'Banear'}
                </button>
                {confirmDelete ? (
                  <span className="flex items-center gap-2">
                    <button type="button" onClick={() => void remove()} disabled={busy} className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:brightness-110">
                      Confirmar
                    </button>
                    <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-md border border-surface-border px-3 py-1.5 text-xs text-slate-200 hover:bg-surface-2">
                      Cancelar
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    disabled={busy}
                    className="flex items-center gap-1.5 rounded-md border border-red-800/60 px-3 py-1.5 text-xs text-red-300 hover:bg-red-900/20 disabled:opacity-50"
                  >
                    <Trash2 size={13} /> Eliminar
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </li>
  )
}

function isBanned(player: GamePlayer): boolean {
  return (player as GamePlayer & { baneado?: boolean }).baneado === true
}

function NumField({
  label,
  icon,
  value,
  onChange
}: {
  label: string
  icon: JSX.Element
  value: string
  onChange(v: string): void
}): JSX.Element {
  return (
    <label className="text-[11px] text-slate-400">
      <span className="flex items-center gap-1">{icon} {label}</span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-surface-border bg-surface-1 px-2 py-1 text-xs text-slate-100 focus:border-accent focus:outline-none"
      />
    </label>
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
