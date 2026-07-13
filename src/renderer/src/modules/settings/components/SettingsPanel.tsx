import { useEffect, useState } from 'react'
import { RefreshCw, Download, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import type { UpdateCheckResult } from '@shared-types/updates'

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
    </div>
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
