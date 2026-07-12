import { useMemo, useState } from 'react'
import { X, RefreshCw, AlertTriangle, XCircle, Info, MapPin, CheckCircle2 } from 'lucide-react'
import type { ValidationIssue, WorldValidationSummary, IssueSeverity } from '../content/worldValidator'

interface Props {
  summary: WorldValidationSummary
  onGoTo(issue: ValidationIssue): void
  onRevalidate(): void
  onClose(): void
}

type Filter = 'all' | IssueSeverity

const SEVERITY_META: Record<IssueSeverity, { label: string; icon: JSX.Element; cls: string }> = {
  error: { label: 'Error', icon: <XCircle size={13} className="text-red-400" />, cls: 'text-red-400' },
  warning: { label: 'Aviso', icon: <AlertTriangle size={13} className="text-amber-400" />, cls: 'text-amber-400' },
  info: { label: 'Info', icon: <Info size={13} className="text-sky-400" />, cls: 'text-sky-400' }
}

/**
 * Panel del validador del mundo (doc 24). Muestra el resumen (errores/avisos/
 * elementos revisados/porcentaje válido) y una lista filtrable de avisos; cada
 * uno permite ir al elemento en el mapa. No publica: solo diagnostica.
 */
export function WorldValidatorPanel({ summary, onGoTo, onRevalidate, onClose }: Props): JSX.Element {
  const [filter, setFilter] = useState<Filter>('all')
  const [moduleFilter, setModuleFilter] = useState<string>('all')

  const modules = useMemo(() => Array.from(new Set(summary.issues.map((i) => i.module))).sort(), [summary.issues])
  const filtered = summary.issues.filter(
    (i) => (filter === 'all' || i.severity === filter) && (moduleFilter === 'all' || i.module === moduleFilter)
  )

  const noCritical = summary.errors === 0

  return (
    <div className="absolute inset-0 z-[1400] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="flex max-h-full w-[640px] max-w-full flex-col overflow-hidden rounded-lg border border-surface-border bg-surface-1 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-surface-border px-4 py-3">
          <CheckCircle2 size={16} className={noCritical ? 'text-green-400' : 'text-red-400'} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-slate-100">Validación del mundo</div>
            <div className="text-[11px] text-slate-500">
              {summary.reviewed} elementos revisados · {summary.validPercent}% válido
            </div>
          </div>
          <button type="button" onClick={onRevalidate} title="Revalidar" className="rounded p-1 text-slate-400 hover:bg-surface-2 hover:text-slate-200">
            <RefreshCw size={15} />
          </button>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-surface-2 hover:text-slate-200">
            <X size={16} />
          </button>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-2 border-b border-surface-border px-4 py-3">
          <Stat label="Errores críticos" value={summary.errors} cls="text-red-400" onClick={() => setFilter('error')} />
          <Stat label="Advertencias" value={summary.warnings} cls="text-amber-400" onClick={() => setFilter('warning')} />
          <Stat label="Información" value={summary.info} cls="text-sky-400" onClick={() => setFilter('info')} />
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-surface-border px-4 py-2 text-xs">
          {(['all', 'error', 'warning', 'info'] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded px-2 py-1 ${filter === f ? 'bg-surface-2 text-slate-100' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {f === 'all' ? 'Todos' : SEVERITY_META[f].label}
            </button>
          ))}
          <span className="mx-1 text-slate-600">|</span>
          <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} className="rounded border border-surface-border bg-surface-2 px-2 py-1 text-xs text-slate-200">
            <option value="all">Todos los módulos</option>
            {modules.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Lista */}
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {summary.issues.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <CheckCircle2 size={28} className="text-green-400" />
              <p className="text-sm text-slate-200">Mundo válido: no se encontraron problemas.</p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">No hay avisos con este filtro.</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {filtered.map((issue) => (
                <li key={issue.id} className="flex items-start gap-2 rounded-md border border-surface-border bg-surface-2/40 px-3 py-2">
                  <span className="mt-0.5 shrink-0">{SEVERITY_META[issue.severity].icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-slate-200">{issue.message}</div>
                    <div className="text-[10px] text-slate-500">
                      {issue.module} · {issue.targetName || issue.targetId}
                    </div>
                  </div>
                  {issue.position && (
                    <button
                      type="button"
                      onClick={() => onGoTo(issue)}
                      className="flex shrink-0 items-center gap-1 rounded border border-surface-border px-2 py-1 text-[11px] text-slate-300 hover:bg-surface-2"
                    >
                      <MapPin size={11} /> Ir
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-surface-border px-4 py-3">
          <span className={`text-xs ${noCritical ? 'text-green-400' : 'text-red-400'}`}>
            {noCritical ? 'Sin errores críticos: se puede publicar.' : 'Hay errores críticos: publicación bloqueada.'}
          </span>
          <button type="button" onClick={onClose} className="ml-auto rounded-md border border-surface-border px-3 py-1.5 text-xs text-slate-300 hover:bg-surface-2">
            Volver al mapa
          </button>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, cls, onClick }: { label: string; value: number; cls: string; onClick(): void }): JSX.Element {
  return (
    <button type="button" onClick={onClick} className="rounded-md border border-surface-border bg-surface-2/40 px-3 py-2 text-left hover:bg-surface-2">
      <div className={`text-lg font-semibold ${cls}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
    </button>
  )
}
