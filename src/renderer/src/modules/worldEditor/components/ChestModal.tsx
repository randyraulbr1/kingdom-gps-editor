import { useMemo, useState } from 'react'
import { X, Plus, Trash2, Save, Package, FlaskConical, AlertTriangle } from 'lucide-react'
import type { WorldEntityUI } from '../types'
import { WorldEditorService } from '../services/entityService'
import { useWorldEditorStore } from '../hooks/useWorldEditorStore'
import { newLootEntryId, type LootEntry } from '../content/lootTable'
import {
  readChestConfig,
  writeChestConfig,
  validateChestConfig,
  simulateOpenChest,
  rollChestReward,
  REWARD_SHARING_LABELS,
  type ChestConfig,
  type RewardSharing,
  type ChestRewardRoll
} from '../content/chestConfig'

interface Props {
  entity: WorldEntityUI
  onClose(): void
}

type Tab = 'recompensa' | 'loot' | 'condiciones' | 'probar'

const inputClass =
  'w-full rounded-md border border-surface-border bg-surface-2 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-accent'

/**
 * Ficha funcional de un cofre del mapa (doc 22). Edita `properties.chest` y lo
 * persiste vía IPC. Simula la apertura (rango/nivel/doble apertura) y el cálculo
 * de recompensa (objetos + monedas + experiencia).
 */
export function ChestModal({ entity, onClose }: Props): JSX.Element {
  const updateEntity = useWorldEditorStore((s) => s.updateEntity)
  const allEntities = useWorldEditorStore((s) => s.entities)
  const [config, setConfig] = useState<ChestConfig>(() => readChestConfig(entity.properties))
  const [tab, setTab] = useState<Tab>('recompensa')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const existingWorldIds = useMemo(() => new Set(allEntities.map((e) => e.worldId)), [allEntities])
  const questOptions = useMemo(
    () => allEntities.filter((e) => e.worldId !== entity.worldId).map((e) => ({ id: e.worldId, name: e.name })),
    [allEntities, entity.worldId]
  )
  const errors = validateChestConfig(config, existingWorldIds)

  const patch = (partial: Partial<ChestConfig>): void => {
    setConfig((c) => ({ ...c, ...partial }))
    setDirty(true)
  }
  const patchLoot = (id: string, p: Partial<LootEntry>): void =>
    patch({ loot: config.loot.map((l) => (l.id === id ? { ...l, ...p } : l)) })
  const addLoot = (): void =>
    patch({ loot: [...config.loot, { id: newLootEntryId(), itemName: '', probability: 0.5, minQty: 1, maxQty: 1 }] })
  const removeLoot = (id: string): void => patch({ loot: config.loot.filter((l) => l.id !== id) })

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    try {
      const properties = writeChestConfig(entity.properties, config)
      const updated = await WorldEditorService.updateEntity({ worldId: entity.worldId, patch: { properties } })
      updateEntity(entity.worldId, updated)
      setDirty(false)
    } catch (error) {
      window.alert(`No se pudo guardar el cofre: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="absolute inset-0 z-[1400] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="flex max-h-full w-[580px] max-w-full flex-col overflow-hidden rounded-lg border border-surface-border bg-surface-1 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-surface-border px-4 py-3">
          <Package size={16} className="text-accent" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-slate-100">{entity.name}</div>
            <div className="text-[11px] text-slate-500">Cofre · {config.singleUse ? 'un solo uso' : `repetible (${config.respawnSeconds}s)`}</div>
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
          {(['recompensa', 'loot', 'condiciones', 'probar'] as Tab[]).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-t px-3 py-1.5 text-xs capitalize ${tab === t ? 'bg-surface-2 text-slate-100' : 'text-slate-400 hover:text-slate-200'}`}>
              {t === 'probar' ? 'Probar' : t}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {tab === 'recompensa' && <RewardTab config={config} patch={patch} />}
          {tab === 'loot' && <LootTab loot={config.loot} patchLoot={patchLoot} addLoot={addLoot} removeLoot={removeLoot} />}
          {tab === 'condiciones' && <ConditionsTab config={config} patch={patch} questOptions={questOptions} />}
          {tab === 'probar' && <TestTab config={config} />}
        </div>

        <div className="flex items-center gap-2 border-t border-surface-border px-4 py-3">
          <span className="text-[11px] text-slate-500">
            {config.loot.length} loot · {config.maxCoins > 0 ? `${config.minCoins}-${config.maxCoins} monedas` : 'sin monedas'}
          </span>
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

function RewardTab({ config, patch }: { config: ChestConfig; patch(p: Partial<ChestConfig>): void }): JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <NumField label="Monedas mín" value={config.minCoins} onChange={(n) => patch({ minCoins: n })} />
        <NumField label="Monedas máx" value={config.maxCoins} onChange={(n) => patch({ maxCoins: Math.max(config.minCoins, n) })} />
        <NumField label="Exp mín" value={config.minXp} onChange={(n) => patch({ minXp: n })} />
        <NumField label="Exp máx" value={config.maxXp} onChange={(n) => patch({ maxXp: Math.max(config.minXp, n) })} />
      </div>
      <Field label="Reparto">
        <select value={config.sharing} onChange={(e) => patch({ sharing: e.target.value as RewardSharing })} className={inputClass}>
          {(Object.keys(REWARD_SHARING_LABELS) as RewardSharing[]).map((s) => (
            <option key={s} value={s}>
              {REWARD_SHARING_LABELS[s]}
            </option>
          ))}
        </select>
      </Field>
      <p className="text-[10px] text-slate-600">El cofre puede entregar objetos (pestaña Loot), monedas y/o experiencia.</p>
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
        <div className="rounded-md border border-dashed border-surface-border px-3 py-6 text-center text-xs text-slate-500">Sin objetos. El cofre puede dar solo monedas/experiencia, o añade objetos aquí.</div>
      )}
      {loot.map((entry) => (
        <div key={entry.id} className="grid grid-cols-[1fr_70px_52px_52px_24px] items-center gap-2">
          <input value={entry.itemName} placeholder="Nombre" onChange={(e) => patchLoot(entry.id, { itemName: e.target.value })} className={inputClass} />
          <input type="number" min={0} max={100} value={Math.round(entry.probability * 100)} onChange={(e) => patchLoot(entry.id, { probability: Math.min(1, Math.max(0, (Number(e.target.value) || 0) / 100)) })} className={inputClass} />
          <input type="number" min={1} value={entry.minQty} onChange={(e) => patchLoot(entry.id, { minQty: Math.max(1, Number(e.target.value) || 1) })} className={inputClass} />
          <input type="number" min={entry.minQty} value={entry.maxQty} onChange={(e) => patchLoot(entry.id, { maxQty: Math.max(entry.minQty, Number(e.target.value) || entry.minQty) })} className={inputClass} />
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

function ConditionsTab({
  config,
  patch,
  questOptions
}: {
  config: ChestConfig
  patch(p: Partial<ChestConfig>): void
  questOptions: Array<{ id: string; name: string }>
}): JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <NumField label="Radio interacción (m)" min={1} value={config.interactionRadiusM} onChange={(n) => patch({ interactionRadiusM: Math.max(1, n) })} />
        <NumField label="Nivel mínimo" value={config.minLevel} onChange={(n) => patch({ minLevel: n })} />
      </div>
      <Field label="Misión requerida (opcional)">
        <select value={config.requiredQuestWorldId ?? ''} onChange={(e) => patch({ requiredQuestWorldId: e.target.value || null })} className={inputClass}>
          <option value="">(ninguna)</option>
          {questOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </Field>
      <label className="flex items-center gap-2 text-xs text-slate-200">
        <input type="checkbox" checked={config.singleUse} onChange={(e) => patch({ singleUse: e.target.checked })} />
        Uso único (si se desmarca, reaparece)
      </label>
      {!config.singleUse && (
        <NumField label="Reaparición (s)" value={config.respawnSeconds} onChange={(n) => patch({ respawnSeconds: n })} />
      )}
    </div>
  )
}

function TestTab({ config }: { config: ChestConfig }): JSX.Element {
  const [distanceM, setDistanceM] = useState(5)
  const [playerLevel, setPlayerLevel] = useState(5)
  const [alreadyOpened, setAlreadyOpened] = useState(false)
  const [reward, setReward] = useState<ChestRewardRoll | null>(null)

  const result = simulateOpenChest({
    distanceM,
    interactionRadiusM: config.interactionRadiusM,
    playerLevel,
    minLevel: config.minLevel,
    alreadyOpened,
    singleUse: config.singleUse
  })

  const open = (): void => {
    if (result.ok) {
      setReward(rollChestReward(config))
      if (config.singleUse) setAlreadyOpened(true)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <NumField label="Distancia (m)" value={distanceM} onChange={setDistanceM} />
        <NumField label="Nivel" value={playerLevel} onChange={setPlayerLevel} />
      </div>
      <label className="flex items-center gap-2 text-xs text-slate-300">
        <input type="checkbox" checked={alreadyOpened} onChange={(e) => setAlreadyOpened(e.target.checked)} />
        Ya fue abierto
      </label>
      <div className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${result.ok ? 'border-green-500/40 bg-green-500/10 text-green-300' : 'border-amber-500/40 bg-amber-500/10 text-amber-300'}`}>
        <FlaskConical size={14} />
        <span>{result.message}</span>
      </div>
      <button type="button" onClick={open} disabled={!result.ok} className="self-start rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40">
        Abrir cofre (simular)
      </button>
      {reward && (
        <div className="rounded-md border border-surface-border bg-surface-2/40 p-3 text-xs text-slate-300">
          <div className="mb-1 font-medium text-slate-200">Recompensa obtenida:</div>
          {reward.coins > 0 && <div>• {reward.coins} monedas</div>}
          {reward.xp > 0 && <div>• {reward.xp} experiencia</div>}
          {reward.items.map((d, i) => (
            <div key={i}>
              • {d.itemName} ×{d.quantity}
            </div>
          ))}
          {reward.coins === 0 && reward.xp === 0 && reward.items.length === 0 && <div className="text-slate-500">No cayó nada esta vez.</div>}
        </div>
      )}
      <p className="text-[10px] text-slate-600">Simulación local. En producción el servidor bloquea doble apertura y entrega de forma idempotente.</p>
    </div>
  )
}
