import { useEffect, useState } from 'react'
import { RefreshCw, Download, CheckCircle2, AlertTriangle, Info, Server, Save } from 'lucide-react'
import type { UpdateCheckResult } from '@shared-types/updates'
import type { ServerConfig } from '@shared-types/system'

type Status =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'result'; result: UpdateCheckResult }
  | { kind: 'downloading' }

/**
 * Panel de Configuración. De momento incluye la sección de Actualizaciones
 * (auto-update de la app instalada vía electron-updater + GitHub Releases).
 */
export function SettingsPanel(): JSX.Element {
  const [version, setVersion] = useState<string>('…')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const api = typeof window !== 'undefined' ? window.api?.updates : undefined

  useEffect(() => {
    if (!api) return
    api.getVersion().then(setVersion).catch(() => setVersion('desconocida'))
  }, [api])

  const check = async (): Promise<void> => {
    if (!api) return
    setStatus({ kind: 'checking' })
    try {
      const result = await api.check()
      if (result.currentVersion) setVersion(result.currentVersion)
      setStatus({ kind: 'result', result })
    } catch (error) {
      setStatus({
        kind: 'result',
        result: { supported: true, available: false, currentVersion: version, error: error instanceof Error ? error.message : String(error) }
      })
    }
  }

  const install = async (): Promise<void> => {
    if (!api) return
    setStatus({ kind: 'downloading' })
    const res = await api.downloadAndInstall()
    if (!res.ok) {
      setStatus({
        kind: 'result',
        result: { supported: true, available: true, currentVersion: version, error: res.message }
      })
    }
    // Si ok: la app se cerrará para instalar; no hay nada más que mostrar.
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-1 text-lg font-semibold text-slate-100">Configuración</h1>
      <p className="mb-6 text-xs text-slate-500">Preferencias del editor y mantenimiento de la aplicación.</p>

      <section className="rounded-lg border border-surface-border bg-surface-1 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-slate-100">Actualizaciones</h2>
            <p className="text-[11px] text-slate-500">Versión instalada: <span className="text-slate-300">{version}</span></p>
          </div>
          <button
            type="button"
            onClick={() => void check()}
            disabled={status.kind === 'checking' || status.kind === 'downloading'}
            className="flex items-center gap-1.5 rounded-md border border-surface-border px-3 py-1.5 text-xs text-slate-200 hover:bg-surface-2 disabled:opacity-50"
          >
            <RefreshCw size={13} className={status.kind === 'checking' ? 'animate-spin' : ''} />
            Buscar actualizaciones
          </button>
        </div>

        {status.kind === 'checking' && <Line icon={<RefreshCw size={13} className="animate-spin text-slate-400" />} text="Comprobando…" />}
        {status.kind === 'downloading' && (
          <Line icon={<Download size={13} className="animate-pulse text-accent" />} text="Descargando actualización… la app se reiniciará al terminar." />
        )}

        {status.kind === 'result' && <ResultView result={status.result} onInstall={() => void install()} />}

        {!api && (
          <Line
            icon={<Info size={13} className="text-slate-400" />}
            text="Las actualizaciones solo están disponibles en la app de escritorio."
          />
        )}

        <p className="mt-3 border-t border-surface-border pt-2 text-[10px] text-slate-600">
          Requiere la app instalada (.exe) y una versión publicada en GitHub Releases. En modo desarrollo se ignora.
        </p>
      </section>

      <ServerSection />
    </div>
  )
}

/**
 * Servidor del juego: URL + credenciales de admin. La autenticación es
 * automática: se guardan usuario y contraseña UNA vez; el editor inicia sesión
 * solo y reutiliza el token internamente. El usuario nunca pega un token.
 */
function ServerSection(): JSX.Element {
  const server = typeof window !== 'undefined' ? window.api?.server : undefined
  const [config, setConfig] = useState<ServerConfig>({ url: '', adminUser: '', adminPass: '' })
  const [saved, setSaved] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [testing, setTesting] = useState(false)
  const [auth, setAuth] = useState<{ ok: boolean; message: string } | null>(null)

  useEffect(() => {
    if (!server) return
    server
      .get()
      .then((value) =>
        setConfig({ url: value.url ?? '', adminUser: value.adminUser ?? '', adminPass: value.adminPass ?? '' })
      )
      .catch(() => undefined)
      .finally(() => setLoaded(true))
  }, [server])

  const save = async (): Promise<void> => {
    if (!server) return
    await server.set(config)
    setSaved(true)
    setAuth(null)
    window.setTimeout(() => setSaved(false), 2000)
  }

  const test = async (): Promise<void> => {
    if (!server) return
    await server.set(config)
    setTesting(true)
    setAuth(null)
    try {
      const result = await server.checkAuth()
      setAuth({ ok: result.ok, message: result.message })
    } catch (error) {
      setAuth({ ok: false, message: error instanceof Error ? error.message : 'No se pudo conectar.' })
    } finally {
      setTesting(false)
    }
  }

  const field = (
    label: string,
    key: keyof ServerConfig,
    type: string,
    placeholder: string
  ): JSX.Element => (
    <label className="mb-2 block text-xs text-slate-400">
      {label}
      <input
        type={type}
        value={config[key]}
        onChange={(e) => setConfig((c) => ({ ...c, [key]: e.target.value }))}
        placeholder={placeholder}
        disabled={!server || !loaded}
        className="mt-1 w-full rounded-md border border-surface-border bg-surface-2 px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-accent focus:outline-none disabled:opacity-50"
      />
    </label>
  )

  return (
    <section className="mt-4 rounded-lg border border-surface-border bg-surface-1 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Server size={15} className="text-slate-400" />
        <div>
          <h2 className="text-sm font-medium text-slate-100">Servidor del juego</h2>
          <p className="text-[11px] text-slate-500">
            Guarda la URL y el usuario/contraseña de admin una sola vez. El editor inicia sesión solo y
            mantiene la conexión; no necesitas pegar ningún token. Se usa para «Subir al mundo» y para
            administrar jugadores.
          </p>
        </div>
      </div>

      {field('URL del servidor', 'url', 'text', 'https://mariel-online.onrender.com')}
      {field('Usuario admin', 'adminUser', 'text', 'randy')}
      {field('Contraseña admin', 'adminPass', 'password', '••••••••')}

      <div className="mt-1 flex items-center gap-2">
        <button
          type="button"
          onClick={() => void save()}
          disabled={!server || !loaded}
          className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:brightness-110 disabled:opacity-50"
        >
          <Save size={13} /> Guardar
        </button>
        <button
          type="button"
          onClick={() => void test()}
          disabled={!server || !loaded || testing}
          className="flex items-center gap-1.5 rounded-md border border-surface-border px-3 py-1.5 text-xs text-slate-200 hover:bg-surface-2 disabled:opacity-50"
        >
          <RefreshCw size={13} className={testing ? 'animate-spin' : ''} /> Probar conexión
        </button>
        {saved && <span className="text-[11px] text-green-400">Guardado.</span>}
      </div>

      {auth && (
        <div className="mt-3">
          <Line
            icon={
              auth.ok ? (
                <CheckCircle2 size={13} className="text-green-400" />
              ) : (
                <AlertTriangle size={13} className="text-amber-400" />
              )
            }
            text={auth.message}
          />
        </div>
      )}
      {!server && <p className="mt-2 text-[11px] text-slate-500">Solo disponible en la app de escritorio.</p>}
    </section>
  )
}

function ResultView({ result, onInstall }: { result: UpdateCheckResult; onInstall(): void }): JSX.Element {
  if (!result.supported) {
    return <Line icon={<Info size={13} className="text-sky-400" />} text={result.message ?? 'No disponible en este modo.'} />
  }
  if (result.error) {
    return <Line icon={<AlertTriangle size={13} className="text-amber-400" />} text={`No se pudo comprobar: ${result.error}`} />
  }
  if (result.available) {
    return (
      <div className="flex flex-col gap-2">
        <Line icon={<Download size={13} className="text-accent" />} text={`Nueva versión disponible: ${result.latestVersion} (tienes ${result.currentVersion}).`} />
        <button
          type="button"
          onClick={onInstall}
          className="flex w-fit items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:brightness-110"
        >
          <Download size={13} /> Descargar e instalar ahora
        </button>
      </div>
    )
  }
  return <Line icon={<CheckCircle2 size={13} className="text-green-400" />} text={`Estás en la última versión (${result.currentVersion}).`} />
}

function Line({ icon, text }: { icon: JSX.Element; text: string }): JSX.Element {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-300">
      {icon}
      <span>{text}</span>
    </div>
  )
}
