import { useState } from 'react'
import { X, Plus, Trash2, Save, Swords, FlaskConical, AlertTriangle, Play, RotateCcw } from 'lucide-react'
import type { WorldEntityUI } from '../types'
import { WorldEditorService } from '../services/entityService'
import { useWorldEditorStore } from '../hooks/useWorldEditorStore'
import {
  readEnemyConfig,
  writeEnemyConfig,
  validateEnemyConfig,
  nextEnemyState,
  rollLoot,
  newLootEntryId,
  ENEMY_CATEGORY_LABELS,
  ENEMY_AI_STATE_LABELS,
  type EnemyConfig,
  type EnemyCategory,
  type EnemyStats,
  type EnemyGpsRanges,
  type EnemySpawnConfig,
  type LootEntry,
  type EnemyAiState,
  type LootDrop
} from '../content/enemyConfig'

interface Props {
  entity: WorldEntityUI
  onClose(): void
}

type Tab = 'stats' | 'gps' | 'loot' | 'spawn' | 'probar'

const inputClass =
  'w-full rounded-md border border-surface-border bg-surface-2 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-accent'

/**
 * Ficha funcional de un enemigo del mapa (doc 21). Edita `properties.enemy` y lo
 * persiste vía IPC. Incluye simuladores locales de IA (idle/chasing/attacking/
 * returning con tolerancia GPS) y de caída de loot.
 */
export function EnemyModal({ entity, onClose }: Props): JSX.Element {
  const updateEntity = useWorldEditorStore((s) => s.updateEntity)
  const [config, setConfig] = useState<EnemyConfig>(() => readEnemyConfig(entity.properties))
  const [tab, setTab] = useState<Tab>('stats')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const errors = validateEnemyConfig(config)

  const patch = (partial: Partial<EnemyConfig>): void => {
    setConfig((c) => ({ ...c, ...partial }))
    setDirty(true)
  }
  const patchStats = (p: Partial<EnemyStats>): void => patch({ stats: { ...config.stats, ...p } })
  const patchGps = (p: Partial<EnemyGpsRanges>): void => patch({ gps: { ...config.gps, ...p } })
  const patchSpawn = (p: Partial<EnemySpawnConfig>): void => patch({ spawn: { ...config.spawn, ...p } })

  const patchLoot = (id: string, p: Partial<LootEntry>): void =>
    patch({ loot: config.loot.map((l) => (l.id === id ? { ...l, ...p } : l)) })
  const addLoot = (): void =>
    patch({ loot: [...config.loot, { id: newLootEntryId(), itemName: '', probability: 0.5, minQty: 1, maxQty: 1 }] })
  const removeLoot = (id: string): void => patch({ loot: config.loot.filter((l) => l.id !== id) })

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    try {
      const properties = writeEnemyConfig(entity.properties, config)
      const updated = await WorldEditorService.updateEntity({ worldId: entity.worldId, patch: { properties } })
      updateEntity(entity.worldId, updated)
      setDirty(false)
    } catch (error) {
      window.alert(`No se pudo guardar el enemigo: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="absolute inset-0 z-[1400] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="flex max-h-full w-[600px] max-w-full flex-col overflow-hidden rounded-lg border border-surface-border bg-surface-1 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-surface-border px-4 py-3">
          <Swords size={16} className="text-accent" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-slate-100">{config.enemyName || entity.name}</div>
            <div className="text-[11px] text-slate-500">
              Enemigo · {ENEMY_CATEGORY_LABELS[config.category]} · Nv {config.stats.level}
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
                <div key={i}>
                  {e.severity === 'warning' ? '⚠ ' : '✕ '}
                  {e.message}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-1 border-b border-surface-border px-2 pt-2">
          {(['stats', 'gps', 'loot', 'spawn', 'probar'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-t px-3 py-1.5 text-xs ${
                tab === t ? 'bg-surface-2 text-slate-100' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'stats' ? 'Estadísticas' : t === 'gps' ? 'GPS' : t === 'loot' ? 'Loot' : t === 'spawn' ? 'Spawn' : 'Probar'}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {tab === 'stats' && <StatsTab config={config} patch={patch} patchStats={patchStats} />}
          {tab === 'gps' && <GpsTab gps={config.gps} patchGps={patchGps} />}
          {tab === 'loot' && <LootTab loot={config.loot} patchLoot={patchLoot} addLoot={addLoot} removeLoot={removeLoot} />}
          {tab === 'spawn' && <SpawnTab spawn={config.spawn} patchSpawn={patchSpawn} />}
          {tab === 'probar' && <TestTab config={config} />}
        </div>

        <div className="flex items-center gap-2 border-t border-surface-border px-4 py-3">
          <span className="text-[11px] text-slate-500">
            {config.loot.length} loot · vida {config.stats.hp} · daño {config.stats.damage}
          </span>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !dirty}
            className="ml-auto flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
          >
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

function NumField({ label, value, onChange, min = 0, step = 1 }: { label: string; value: number; onChange(n: number): void; min?: number; step?: number }): JSX.Element {
  return (
    <Field label={label}>
      <input type="number" min={min} step={step} value={value} onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))} className={inputClass} />
    </Field>
  )
}

function StatsTab({
  config,
  patch,
  patchStats
}: {
  config: EnemyConfig
  patch(p: Partial<EnemyConfig>): void
  patchStats(p: Partial<EnemyStats>): void
}): JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Nombre del enemigo">
          <input value={config.enemyName} onChange={(e) => patch({ enemyName: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Categoría">
          <select value={config.category} onChange={(e) => patch({ category: e.target.value as EnemyCategory })} className={inputClass}>
            {(Object.keys(ENEMY_CATEGORY_LABELS) as EnemyCategory[]).map((c) => (
              <option key={c} value={c}>
                {ENEMY_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <NumField label="Nivel" min={1} value={config.stats.level} onChange={(n) => patchStats({ level: n })} />
        <NumField label="Vida" min={1} value={config.stats.hp} onChange={(n) => patchStats({ hp: n })} />
        <NumField label="Daño" value={config.stats.damage} onChange={(n) => patchStats({ damage: n })} />
        <NumField label="Defensa" value={config.stats.defense} onChange={(n) => patchStats({ defense: n })} />
        <NumField label="Velocidad" value={config.stats.speed} step={0.1} onChange={(n) => patchStats({ speed: n })} />
        <NumField label="Experiencia" value={config.stats.xp} onChange={(n) => patchStats({ xp: n })} />
      </div>
    </div>
  )
}

function GpsTab({ gps, patchGps }: { gps: EnemyGpsRanges; patchGps(p: Partial<EnemyGpsRanges>): void }): JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <NumField label="Visible (m)" value={gps.visibleRadiusM} onChange={(n) => patchGps({ visibleRadiusM: n })} />
        <NumField label="Visión (m)" value={gps.visionRadiusM} onChange={(n) => patchGps({ visionRadiusM: n })} />
        <NumField label="Persecución (m)" value={gps.pursuitRadiusM} onChange={(n) => patchGps({ pursuitRadiusM: n })} />
        <NumField label="Ataque (m)" value={gps.attackRadiusM} onChange={(n) => patchGps({ attackRadiusM: n })} />
        <NumField label="Regreso (m)" value={gps.returnRadiusM} onChange={(n) => patchGps({ returnRadiusM: n })} />
        <NumField label="Tolerancia GPS (m)" value={gps.gpsToleranceM} onChange={(n) => patchGps({ gpsToleranceM: n })} />
      </div>
      <p className="text-[10px] text-slate-600">
        Recomendado: visible 150 · visión 100 · persecución 250 · ataque 30–50 · regreso 300 · tolerancia 15–25.
      </p>
    </div>
  )
}

function LootTab({
  loot,
  patchLoot,
  addLoot,
  removeLoot
}: {
  loot: LootEntry[]
  patchLoot(id: string, p: Partial<LootEntry>): void
  addLoot(): void
  removeLoot(id: string): void
}): JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[1fr_70px_52px_52px_24px] items-center gap-2 px-1 text-[10px] uppercase tracking-wide text-slate-500">
        <span>Objeto</span>
        <span>Prob. %</span>
        <span>Mín</span>
        <span>Máx</span>
        <span />
      </div>
      {loot.length === 0 && (
        <div className="rounded-md border border-dashed border-surface-border px-3 py-6 text-center text-xs text-slate-500">
          Sin tabla de loot. Añade objetos con su probabilidad.
        </div>
      )}
      {loot.map((entry) => (
        <div key={entry.id} className="grid grid-cols-[1fr_70px_52px_52px_24px] items-center gap-2">
          <input value={entry.itemName} placeholder="Nombre" onChange={(e) => patchLoot(entry.id, { itemName: e.target.value })} className={inputClass} />
          <input
            type="number"
            min={0}
            max={100}
            value={Math.round(entry.probability * 100)}
            onChange={(e) => patchLoot(entry.id, { probability: Math.min(1, Math.max(0, (Number(e.target.value) || 0) / 100)) })}
            className={inputClass}
          />
          <input
            type="number"
            min={1}
            value={entry.minQty}
            onChange={(e) => patchLoot(entry.id, { minQty: Math.max(1, Number(e.target.value) || 1) })}
            className={inputClass}
          />
          <input
            type="number"
            min={entry.minQty}
            value={entry.maxQty}
            onChange={(e) => patchLoot(entry.id, { maxQty: Math.max(entry.minQty, Number(e.target.value) || entry.minQty) })}
            className={inputClass}
          />
          <button type="button" onClick={() => removeLoot(entry.id)} className="rounded p-1 text-slate-500 hover:bg-surface-2 hover:text-red-400">
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <button type="button" onClick={addLoot} className="mt-1 flex items-center justify-center gap-1.5 rounded-md border border-dashed border-surface-border px-3 py-1.5 text-xs text-slate-300 hover:bg-surface-2">
        <Plus size={13} /> Añadir objeto
      </button>
    </div>
  )
}

function SpawnTab({ spawn, patchSpawn }: { spawn: EnemySpawnConfig; patchSpawn(p: Partial<EnemySpawnConfig>): void }): JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-2">
      <NumField label="Aparición mín (s)" value={spawn.spawnMinSeconds} onChange={(n) => patchSpawn({ spawnMinSeconds: n })} />
      <NumField label="Aparición máx (s)" value={spawn.spawnMaxSeconds} onChange={(n) => patchSpawn({ spawnMaxSeconds: n })} />
      <NumField label="Enemigos mín" min={1} value={spawn.minEnemyCount} onChange={(n) => patchSpawn({ minEnemyCount: n })} />
      <NumField label="Enemigos máx" min={1} value={spawn.maxEnemyCount} onChange={(n) => patchSpawn({ maxEnemyCount: n })} />
      <NumField label="Máx activos" min={1} value={spawn.maxActiveEnemies} onChange={(n) => patchSpawn({ maxActiveEnemies: n })} />
      <NumField label="Radio compartido (m)" value={spawn.sharedRadiusM} onChange={(n) => patchSpawn({ sharedRadiusM: n })} />
      <NumField label="Cooldown (s)" value={spawn.cooldownSeconds} onChange={(n) => patchSpawn({ cooldownSeconds: n })} />
    </div>
  )
}

function TestTab({ config }: { config: EnemyConfig }): JSX.Element {
  const [distanceM, setDistanceM] = useState(90)
  const [state, setState] = useState<EnemyAiState>('idle')
  const [drops, setDrops] = useState<LootDrop[] | null>(null)

  const step = (): void => setState((s) => nextEnemyState(s, distanceM, config.gps))
  const doRollLoot = (): void => setDrops(rollLoot(config.loot))

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md border border-surface-border bg-surface-2/40 p-3">
        <div className="mb-2 flex items-center gap-2">
          <Play size={12} className="text-accent" />
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Probar IA (distancia → estado)</span>
        </div>
        <div className="flex items-end gap-2">
          <Field label="Distancia jugador (m)">
            <input type="number" value={distanceM} onChange={(e) => setDistanceM(Number(e.target.value) || 0)} className={inputClass} />
          </Field>
          <button type="button" onClick={step} className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white">
            Avanzar IA
          </button>
          <button type="button" onClick={() => setState('idle')} className="flex items-center gap-1 rounded-md border border-surface-border px-2 py-1.5 text-xs text-slate-300 hover:bg-surface-2">
            <RotateCcw size={11} /> Reset
          </button>
        </div>
        <div className="mt-2 text-xs text-slate-300">
          Estado actual: <span className="font-medium text-accent">{ENEMY_AI_STATE_LABELS[state]}</span>
        </div>
      </div>

      <div className="rounded-md border border-surface-border bg-surface-2/40 p-3">
        <div className="mb-2 flex items-center gap-2">
          <FlaskConical size={12} className="text-accent" />
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Probar loot al morir</span>
          <button type="button" onClick={doRollLoot} className="ml-auto rounded-md bg-accent px-2.5 py-1 text-[11px] font-medium text-white">
            Tirar loot
          </button>
        </div>
        {drops === null ? (
          <p className="text-[11px] text-slate-500">Pulsa "Tirar loot" para simular la caída.</p>
        ) : drops.length === 0 ? (
          <p className="text-[11px] text-slate-400">No cayó nada esta vez.</p>
        ) : (
          <ul className="text-xs text-slate-300">
            {drops.map((d, i) => (
              <li key={i}>
                • {d.itemName} ×{d.quantity}
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-[10px] text-slate-600">
        Simulación local del editor. En producción el servidor mantiene vida/estado y entrega el loot de forma idempotente.
      </p>
    </div>
  )
}
