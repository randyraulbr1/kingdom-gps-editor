import { useState } from 'react'
import { X, Plus, Trash2, Save, FlaskConical, AlertTriangle, Route as RouteIcon } from 'lucide-react'
import type { EnemyRoute } from '@shared-types/world'
import { EnemyRouteService } from '../services/enemyRouteService'
import {
  readRouteConfig,
  writeRouteConfig,
  routeLengthMeters,
  validateRoute,
  simulateRouteRun,
  estimatedSpawnEvents,
  newRouteEntryId,
  ROUTE_STATUS_LABELS,
  SPAWN_MODE_LABELS,
  type EnemyRouteConfig,
  type EnemyRouteStatus,
  type RouteSpawnMode,
  type EnemyRouteEntry,
  type RouteSpawnEvent
} from '../content/enemyRoute'

interface Props {
  route: EnemyRoute
  onSaved(route: EnemyRoute): void
  onDeleted(routeId: string): void
  onClose(): void
}

type Tab = 'ruta' | 'enemigos' | 'activacion' | 'simular'

const inputClass =
  'w-full rounded-md border border-surface-border bg-surface-2 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-accent'

const ROUTE_COLORS = ['#ef4444', '#f97316', '#a855f7', '#ec4899', '#eab308']

/**
 * Inspector/ficha de una ruta de enemigos (doc 14). Edita nombre, color y la
 * config guardada en `properties`, y la persiste vía IPC. Incluye simulador de
 * recorrido del jugador que lista los eventos de spawn.
 */
export function RouteModal({ route, onSaved, onDeleted, onClose }: Props): JSX.Element {
  const [name, setName] = useState(route.name)
  const [color, setColor] = useState(route.color)
  const [config, setConfig] = useState<EnemyRouteConfig>(() => readRouteConfig(route.properties))
  const [tab, setTab] = useState<Tab>('ruta')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const lengthM = routeLengthMeters(route.points)
  const errors = validateRoute(route.points, config)

  const patch = (p: Partial<EnemyRouteConfig>): void => {
    setConfig((c) => ({ ...c, ...p }))
    setDirty(true)
  }
  const markDirty = (): void => setDirty(true)

  const patchEntry = (id: string, p: Partial<EnemyRouteEntry>): void =>
    patch({ entries: config.entries.map((e) => (e.id === id ? { ...e, ...p } : e)) })
  const addEntry = (): void =>
    patch({ entries: [...config.entries, { id: newRouteEntryId(), enemyName: '', weight: 50, levelMin: 1, levelMax: 1, minCount: 1, maxCount: 1 }] })
  const removeEntry = (id: string): void => patch({ entries: config.entries.filter((e) => e.id !== id) })

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    try {
      const updated = await EnemyRouteService.update({
        routeId: route.routeId,
        patch: { name, color, properties: writeRouteConfig(config) }
      })
      onSaved(updated)
      setDirty(false)
    } catch (error) {
      window.alert(`No se pudo guardar la ruta: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (): Promise<void> => {
    if (!window.confirm('¿Eliminar esta ruta de enemigos?')) return
    await EnemyRouteService.delete(route.routeId)
    onDeleted(route.routeId)
  }

  return (
    <div className="absolute inset-0 z-[1400] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="flex max-h-full w-[600px] max-w-full flex-col overflow-hidden rounded-lg border border-surface-border bg-surface-1 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-surface-border px-4 py-3">
          <RouteIcon size={16} style={{ color }} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-slate-100">{name || 'Ruta de enemigos'}</div>
            <div className="text-[11px] text-slate-500">
              {route.points.length} puntos · {Math.round(lengthM)} m · {ROUTE_STATUS_LABELS[config.status]}
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-surface-2 hover:text-slate-200">
            <X size={16} />
          </button>
        </div>

        {errors.length > 0 && (
          <div className="flex items-start gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-[11px] text-amber-300">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            <div>
              {errors.map((e, i) => (
                <div key={i}>{e.message}</div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-1 border-b border-surface-border px-2 pt-2">
          {(['ruta', 'enemigos', 'activacion', 'simular'] as Tab[]).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-t px-3 py-1.5 text-xs capitalize ${tab === t ? 'bg-surface-2 text-slate-100' : 'text-slate-400 hover:text-slate-200'}`}>
              {t === 'activacion' ? 'Activación' : t === 'simular' ? 'Simular jugador' : t}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {tab === 'ruta' && (
            <RouteTab name={name} color={color} config={config} onName={(v) => { setName(v); markDirty() }} onColor={(v) => { setColor(v); markDirty() }} patch={patch} />
          )}
          {tab === 'enemigos' && <EnemiesTab entries={config.entries} patchEntry={patchEntry} addEntry={addEntry} removeEntry={removeEntry} />}
          {tab === 'activacion' && <ActivationTab config={config} patch={patch} />}
          {tab === 'simular' && <SimulateTab route={route} config={config} lengthM={lengthM} />}
        </div>

        <div className="flex items-center gap-2 border-t border-surface-border px-4 py-3">
          <button type="button" onClick={() => void handleDelete()} className="flex items-center gap-1.5 rounded-md border border-red-500/40 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10">
            <Trash2 size={13} /> Eliminar
          </button>
          <span className="text-[11px] text-slate-500">{config.entries.length} enemigo(s)</span>
          <button type="button" onClick={() => void handleSave()} disabled={saving || !dirty} className="ml-auto flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40">
            <Save size={13} /> {saving ? 'Guardando…' : dirty ? 'Guardar' : 'Guardado'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  )
}

function NumField({ label, value, onChange, min = 0 }: { label: string; value: number; onChange(n: number): void; min?: number }): JSX.Element {
  return (
    <Field label={label}>
      <input type="number" min={min} value={value} onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))} className={inputClass} />
    </Field>
  )
}

function RouteTab({
  name,
  color,
  config,
  onName,
  onColor,
  patch
}: {
  name: string
  color: string
  config: EnemyRouteConfig
  onName(v: string): void
  onColor(v: string): void
  patch(p: Partial<EnemyRouteConfig>): void
}): JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      <Field label="Nombre">
        <input value={name} onChange={(e) => onName(e.target.value)} className={inputClass} />
      </Field>
      <Field label="Color del trazado">
        <div className="flex gap-1.5">
          {ROUTE_COLORS.map((c) => (
            <button key={c} type="button" onClick={() => onColor(c)} className={`h-6 w-6 rounded-full border-2 ${color === c ? 'border-white' : 'border-transparent'}`} style={{ background: c }} />
          ))}
        </div>
      </Field>
      <Field label="Estado">
        <select value={config.status} onChange={(e) => patch({ status: e.target.value as EnemyRouteStatus })} className={inputClass}>
          {(Object.keys(ROUTE_STATUS_LABELS) as EnemyRouteStatus[]).map((s) => (
            <option key={s} value={s}>
              {ROUTE_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </Field>
    </div>
  )
}

function EnemiesTab({
  entries,
  patchEntry,
  addEntry,
  removeEntry
}: {
  entries: EnemyRouteEntry[]
  patchEntry(id: string, p: Partial<EnemyRouteEntry>): void
  addEntry(): void
  removeEntry(id: string): void
}): JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[1fr_48px_64px_64px_24px] items-center gap-1.5 px-1 text-[10px] uppercase tracking-wide text-slate-500">
        <span>Enemigo</span>
        <span>Peso</span>
        <span>Nivel</span>
        <span>Cant.</span>
        <span />
      </div>
      {entries.length === 0 && (
        <div className="rounded-md border border-dashed border-surface-border px-3 py-6 text-center text-xs text-slate-500">
          Sin enemigos. Añade una lista ponderada para que la ruta genere spawns.
        </div>
      )}
      {entries.map((entry) => (
        <div key={entry.id} className="grid grid-cols-[1fr_48px_64px_64px_24px] items-center gap-1.5">
          <input value={entry.enemyName} placeholder="Nombre" onChange={(e) => patchEntry(entry.id, { enemyName: e.target.value })} className={inputClass} />
          <input type="number" min={0} value={entry.weight} title="Peso" onChange={(e) => patchEntry(entry.id, { weight: Math.max(0, Number(e.target.value) || 0) })} className={inputClass} />
          <div className="flex items-center gap-0.5">
            <input type="number" min={1} value={entry.levelMin} title="Nivel mín" onChange={(e) => patchEntry(entry.id, { levelMin: Math.max(1, Number(e.target.value) || 1) })} className={inputClass} />
            <input type="number" min={entry.levelMin} value={entry.levelMax} title="Nivel máx" onChange={(e) => patchEntry(entry.id, { levelMax: Math.max(entry.levelMin, Number(e.target.value) || entry.levelMin) })} className={inputClass} />
          </div>
          <div className="flex items-center gap-0.5">
            <input type="number" min={1} value={entry.minCount} title="Cant. mín" onChange={(e) => patchEntry(entry.id, { minCount: Math.max(1, Number(e.target.value) || 1) })} className={inputClass} />
            <input type="number" min={entry.minCount} value={entry.maxCount} title="Cant. máx" onChange={(e) => patchEntry(entry.id, { maxCount: Math.max(entry.minCount, Number(e.target.value) || entry.minCount) })} className={inputClass} />
          </div>
          <button type="button" onClick={() => removeEntry(entry.id)} className="rounded p-1 text-slate-500 hover:bg-surface-2 hover:text-red-400">
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <button type="button" onClick={addEntry} className="mt-1 flex items-center justify-center gap-1.5 rounded-md border border-dashed border-surface-border px-3 py-1.5 text-xs text-slate-300 hover:bg-surface-2">
        <Plus size={13} /> Añadir enemigo
      </button>
    </div>
  )
}

function ActivationTab({ config, patch }: { config: EnemyRouteConfig; patch(p: Partial<EnemyRouteConfig>): void }): JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      <Field label="Modo de aparición">
        <select value={config.spawnMode} onChange={(e) => patch({ spawnMode: e.target.value as RouteSpawnMode })} className={inputClass}>
          {(Object.keys(SPAWN_MODE_LABELS) as RouteSpawnMode[]).map((m) => (
            <option key={m} value={m}>
              {SPAWN_MODE_LABELS[m]}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <NumField label="Radio activación (m)" min={1} value={config.activationRadiusM} onChange={(n) => patch({ activationRadiusM: Math.max(1, n) })} />
        <NumField label="Máx enemigos activos" min={1} value={config.maxActiveEnemies} onChange={(n) => patch({ maxActiveEnemies: Math.max(1, n) })} />
        {config.spawnMode === 'by_distance' && <NumField label="Cada X metros" min={1} value={config.spawnDistanceM} onChange={(n) => patch({ spawnDistanceM: Math.max(1, n) })} />}
        {config.spawnMode === 'by_time' && <NumField label="Cada X segundos" min={1} value={config.spawnIntervalSeconds} onChange={(n) => patch({ spawnIntervalSeconds: Math.max(1, n) })} />}
        <NumField label="Cooldown (s)" value={config.cooldownSeconds} onChange={(n) => patch({ cooldownSeconds: n })} />
        <NumField label="Nivel jugador mín" value={config.minPlayerLevel} onChange={(n) => patch({ minPlayerLevel: n })} />
        <NumField label="Nivel jugador máx (0=∞)" value={config.maxPlayerLevel} onChange={(n) => patch({ maxPlayerLevel: n })} />
      </div>
    </div>
  )
}

function SimulateTab({ route, config, lengthM }: { route: EnemyRoute; config: EnemyRouteConfig; lengthM: number }): JSX.Element {
  const [events, setEvents] = useState<RouteSpawnEvent[] | null>(null)
  const estimated = estimatedSpawnEvents(config, lengthM)

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-slate-400">
        Longitud: <span className="text-slate-200">{Math.round(lengthM)} m</span> · Eventos estimados:{' '}
        <span className="text-slate-200">{estimated}</span>
      </div>
      <button type="button" onClick={() => setEvents(simulateRouteRun(route.points, config))} className="self-start rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white">
        <FlaskConical size={13} className="mr-1 inline" /> Simular recorrido
      </button>
      {events && (
        <div className="rounded-md border border-surface-border bg-surface-2/40 p-3">
          {events.length === 0 ? (
            <p className="text-[11px] text-slate-500">No hay enemigos válidos para generar spawns.</p>
          ) : (
            <ul className="flex flex-col gap-1 text-xs text-slate-300">
              {events.map((e, i) => (
                <li key={i}>
                  <span className="text-slate-500">a {e.atMeters} m:</span> {e.count}× {e.enemyName} (Nv {e.level})
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <p className="text-[10px] text-slate-600">Simulación local. En producción el servidor valida entrada, cooldown, posición y cantidad antes de cada spawn.</p>
    </div>
  )
}
