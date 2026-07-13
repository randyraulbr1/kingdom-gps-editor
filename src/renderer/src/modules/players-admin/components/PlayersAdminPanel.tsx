import { useEffect, useState } from 'react'
import { Users, RefreshCw, UserPlus, Trash2, ShieldCheck, AlertTriangle, Info } from 'lucide-react'
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
          <UserPlus size={15} className="text-slate-400" /> Crear jugador de prueba
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
          <p className="text-xs text-slate-500">No hay jugadores (o aún no configuraste el servidor).</p>
        ) : (
          <ul className="divide-y divide-surface-border">
            {list.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-1.5 text-xs">
                <span className="text-slate-200">
                  {p.nombre}
                  {p.esAdmin && <span className="ml-2 rounded bg-accent/20 px-1.5 py-0.5 text-[10px] text-accent">admin</span>}
                </span>
                {p.telefono && <span className="text-slate-500">{p.telefono}</span>}
              </li>
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
        Administra las cuentas del juego desde el editor. Autenticación automática (Configuración ▸ Servidor).
      </p>
    </>
  )
}
