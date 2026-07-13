import { useEffect, useMemo, useState } from 'react'
import { Play, RotateCcw } from 'lucide-react'
import { SNIPPET_PRESETS, buildPreviewHtml, getPreset } from '../content/playground'

type Part = 'html' | 'css' | 'js'

/**
 * Probar códigos: elige un ejemplo (inventario, barras de vida/hambre/XP, menú
 * de amigos…), edita su HTML/CSS/JS y ve el resultado en vivo en una vista previa
 * aislada. "Actualizar sin perder conexiones": el preview se re-renderiza al
 * pulsar Aplicar (o al escribir), sin recargar el editor.
 */
export function CodePlaygroundTab(): JSX.Element {
  const [presetId, setPresetId] = useState<string>(SNIPPET_PRESETS[0].id)
  const [code, setCode] = useState({ html: SNIPPET_PRESETS[0].html, css: SNIPPET_PRESETS[0].css, js: SNIPPET_PRESETS[0].js })
  const [tab, setTab] = useState<Part>('html')
  const [applied, setApplied] = useState<{ html: string; css: string; js: string }>(() => ({
    html: SNIPPET_PRESETS[0].html,
    css: SNIPPET_PRESETS[0].css,
    js: SNIPPET_PRESETS[0].js
  }))
  const [autoApply, setAutoApply] = useState(true)

  const previewHtml = useMemo(() => buildPreviewHtml(applied), [applied])

  // Se sirve como blob para que los scripts de la vista previa corran con su
  // propio origen (la CSP del editor bloquea scripts inline en srcdoc).
  const [previewUrl, setPreviewUrl] = useState<string>('')
  useEffect(() => {
    const blob = new Blob([previewHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [previewHtml])

  const loadPreset = (id: string): void => {
    const preset = getPreset(id)
    if (!preset) return
    setPresetId(id)
    const next = { html: preset.html, css: preset.css, js: preset.js }
    setCode(next)
    setApplied(next)
  }

  const setPart = (part: Part, value: string): void => {
    const next = { ...code, [part]: value }
    setCode(next)
    if (autoApply) setApplied(next)
  }

  const apply = (): void => setApplied({ ...code })
  const reset = (): void => loadPreset(presetId)

  return (
    <div className="flex h-full w-full">
      {/* Editor (izquierda) */}
      <div className="flex w-1/2 min-w-0 flex-col border-r border-surface-border">
        <div className="flex flex-wrap items-center gap-2 border-b border-surface-border bg-surface-1 px-3 py-2">
          <label className="text-[11px] text-slate-400">
            Ejemplo
            <select
              value={presetId}
              onChange={(e) => loadPreset(e.target.value)}
              className="ml-1 rounded border border-surface-border bg-surface-2 px-2 py-1 text-xs text-slate-200"
            >
              {SNIPPET_PRESETS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1 text-[11px] text-slate-400">
            <input type="checkbox" checked={autoApply} onChange={(e) => setAutoApply(e.target.checked)} /> En vivo
          </label>
          <div className="ml-auto flex items-center gap-1.5">
            <button type="button" onClick={apply} className="flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-white">
              <Play size={12} /> Aplicar
            </button>
            <button type="button" onClick={reset} className="flex items-center gap-1 rounded-md border border-surface-border px-2 py-1 text-xs text-slate-300 hover:bg-surface-2">
              <RotateCcw size={12} /> Restablecer
            </button>
          </div>
        </div>

        <div className="flex gap-1 border-b border-surface-border bg-surface-1 px-2 pt-1.5">
          {(['html', 'css', 'js'] as Part[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setTab(p)}
              className={`rounded-t px-3 py-1 text-xs uppercase ${tab === p ? 'bg-surface-2 text-slate-100' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {p}
            </button>
          ))}
        </div>

        <textarea
          value={code[tab]}
          onChange={(e) => setPart(tab, e.target.value)}
          spellCheck={false}
          className="min-h-0 flex-1 resize-none bg-[#0e1117] p-3 font-mono text-xs leading-relaxed text-slate-200 outline-none"
        />
      </div>

      {/* Vista previa (derecha) */}
      <div className="flex w-1/2 min-w-0 flex-col">
        <div className="border-b border-surface-border bg-surface-1 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-slate-500">
          Vista previa
        </div>
        <iframe
          title="Vista previa de código"
          src={previewUrl}
          sandbox="allow-scripts allow-modals"
          className="min-h-0 flex-1 border-0 bg-[#0e1117]"
        />
      </div>
    </div>
  )
}
