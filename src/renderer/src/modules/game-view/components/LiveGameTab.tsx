import { useEffect, useRef, useState } from 'react'
import { RotateCw, Trash2, Monitor, Smartphone, Tablet, ExternalLink, Bug, ArrowRight } from 'lucide-react'

// El elemento <webview> de Electron ya está tipado por @types/react
// (HTMLWebViewElement); aquí solo describimos los métodos que usamos.

/** API mínima del WebviewTag de Electron que usamos. */
interface WebviewEl extends HTMLElement {
  src: string
  loadURL(url: string): Promise<void>
  reload(): void
  reloadIgnoringCache(): void
  getURL(): string
  executeJavaScript(code: string): Promise<unknown>
  openDevTools(): void
  isDevToolsOpened(): boolean
  closeDevTools(): void
}

type Device = 'pc' | 'phone' | 'tablet'

/** Tamaños lógicos aproximados por dispositivo (CSS px). Teléfono ~ gama alta Samsung. */
const DEVICES: Record<Device, { label: string; icon: JSX.Element; width: number | null; height: number | null }> = {
  pc: { label: 'PC', icon: <Monitor size={13} />, width: null, height: null },
  phone: { label: 'Teléfono (Samsung)', icon: <Smartphone size={13} />, width: 412, height: 915 },
  tablet: { label: 'Tablet', icon: <Tablet size={13} />, width: 820, height: 1180 }
}

const DEFAULT_URL = 'https://tcodm.com'

// Limpia caché/almacenamiento/service workers dentro de la propia página del juego.
const CLEAR_SCRIPT = `(async () => {
  const log = [];
  try { if (window.caches) { const ks = await caches.keys(); await Promise.all(ks.map(k => caches.delete(k))); log.push('caches:' + ks.length); } } catch (e) {}
  try { if (navigator.serviceWorker) { const rs = await navigator.serviceWorker.getRegistrations(); await Promise.all(rs.map(r => r.unregister())); log.push('sw:' + rs.length); } } catch (e) {}
  try { localStorage.clear(); sessionStorage.clear(); log.push('storage'); } catch (e) {}
  try { if (window.indexedDB && indexedDB.databases) { const dbs = await indexedDB.databases(); await Promise.all(dbs.map(d => d.name && indexedDB.deleteDatabase(d.name))); log.push('idb:' + dbs.length); } } catch (e) {}
  return log.join(', ');
})()`

export function LiveGameTab(): JSX.Element {
  const webviewRef = useRef<WebviewEl | null>(null)
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const [urlInput, setUrlInput] = useState(DEFAULT_URL)
  const [device, setDevice] = useState<Device>('pc')
  const [status, setStatus] = useState<string>('')
  const [ready, setReady] = useState(false)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const wv = webviewRef.current
    if (!wv) return
    const onReady = (): void => setReady(true)
    const onStop = (): void => setStatus('')
    wv.addEventListener('dom-ready', onReady)
    wv.addEventListener('did-stop-loading', onStop)
    return () => {
      wv.removeEventListener('dom-ready', onReady)
      wv.removeEventListener('did-stop-loading', onStop)
    }
  }, [])

  const normalizeUrl = (value: string): string => {
    const v = value.trim()
    if (!/^https?:\/\//i.test(v)) return `https://${v}`
    return v
  }

  const go = (): void => {
    const wv = webviewRef.current
    if (!wv) return
    const url = normalizeUrl(urlInput)
    setUrlInput(url)
    wv.src = url
    setStatus('Cargando…')
  }

  const reload = (ignoreCache: boolean): void => {
    const wv = webviewRef.current
    if (!wv) return
    setStatus('Recargando…')
    if (ignoreCache) wv.reloadIgnoringCache()
    else wv.reload()
  }

  const clearData = async (): Promise<void> => {
    const wv = webviewRef.current
    if (!wv || !ready) return
    setStatus('Limpiando caché y datos…')
    try {
      const res = await wv.executeJavaScript(CLEAR_SCRIPT)
      setStatus(`Limpieza: ${String(res) || 'ok'} · recargando…`)
      wv.reloadIgnoringCache()
    } catch (error) {
      setStatus(`No se pudo limpiar: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const toggleDevTools = (): void => {
    const wv = webviewRef.current
    if (!wv || !ready) return
    if (wv.isDevToolsOpened()) wv.closeDevTools()
    else wv.openDevTools()
  }

  const openExternal = (): void => {
    const wv = webviewRef.current
    if (wv) window.open(wv.getURL(), '_blank')
  }

  const dev = DEVICES[device]

  // Escala el marco del dispositivo para que quepa ENTERO en el panel (no scroll).
  useEffect(() => {
    if (!dev.width || !dev.height) {
      setScale(1)
      return
    }
    const el = canvasRef.current
    if (!el) return
    const compute = (): void => {
      const pad = 24
      const availW = Math.max(0, el.clientWidth - pad)
      const availH = Math.max(0, el.clientHeight - pad)
      const s = Math.min(availW / dev.width!, availH / dev.height!, 1)
      setScale(s > 0 ? s : 1)
    }
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [device, dev.width, dev.height])

  return (
    <div className="flex h-full w-full flex-col">
      {/* Barra de controles */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-surface-border bg-surface-1 px-3 py-2">
        <div className="flex flex-1 items-center gap-1 rounded-md border border-surface-border bg-surface-2 px-2">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && go()}
            placeholder="https://tcodm.com"
            className="min-w-0 flex-1 bg-transparent py-1.5 text-xs text-slate-200 outline-none"
          />
          <button type="button" onClick={go} title="Ir" className="text-slate-400 hover:text-accent">
            <ArrowRight size={14} />
          </button>
        </div>
        <ToolBtn icon={<RotateCw size={13} />} label="Recargar" onClick={() => reload(false)} />
        <ToolBtn icon={<Trash2 size={13} />} label="Limpiar caché y datos" onClick={() => void clearData()} />
        <ToolBtn icon={<Bug size={13} />} label="DevTools" onClick={toggleDevTools} />
        <ToolBtn icon={<ExternalLink size={13} />} label="Navegador" onClick={openExternal} />
        <div className="mx-1 h-5 w-px bg-surface-border" />
        {(Object.keys(DEVICES) as Device[]).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDevice(d)}
            className={`flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs ${
              device === d ? 'border-accent bg-accent-muted text-accent' : 'border-surface-border text-slate-300 hover:bg-surface-2'
            }`}
          >
            {DEVICES[d].icon} {DEVICES[d].label}
          </button>
        ))}
      </div>

      {status && <div className="border-b border-surface-border bg-surface-1 px-3 py-1 text-[11px] text-slate-400">{status}</div>}

      {/* Lienzo con marco de dispositivo (se escala para caber entero en el panel) */}
      <div ref={canvasRef} className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#0b0d12] p-3">
        {dev.width && dev.height ? (
          // Caja que reserva el tamaño ya escalado, para centrar bien el marco.
          <div style={{ width: dev.width * scale, height: dev.height * scale }}>
            <div
              className="overflow-hidden rounded-lg border border-surface-border bg-black shadow-2xl"
              style={{ width: dev.width, height: dev.height, transform: `scale(${scale})`, transformOrigin: 'top left' }}
            >
              <webview
                ref={webviewRef as unknown as React.Ref<HTMLWebViewElement>}
                src={DEFAULT_URL}
                partition="persist:game-view"
                style={{ width: '100%', height: '100%', display: 'inline-flex' }}
              />
            </div>
          </div>
        ) : (
          <div className="h-full w-full overflow-hidden rounded-lg border border-surface-border bg-black shadow-2xl">
            <webview
              ref={webviewRef as unknown as React.Ref<HTMLWebViewElement>}
              src={DEFAULT_URL}
              partition="persist:game-view"
              style={{ width: '100%', height: '100%', display: 'inline-flex' }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function ToolBtn({ icon, label, onClick }: { icon: JSX.Element; label: string; onClick(): void }): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 rounded-md border border-surface-border px-2 py-1.5 text-xs text-slate-300 hover:bg-surface-2"
    >
      {icon} {label}
    </button>
  )
}
