import { useState } from 'react'
import { X, Save, Pickaxe, FlaskConical, AlertTriangle } from 'lucide-react'
import type { WorldEntityUI } from '../types'
import { WorldEditorService } from '../services/entityService'
import { useWorldEditorStore } from '../hooks/useWorldEditorStore'
import {
  readResourceConfig,
  writeResourceConfig,
  validateResourceConfig,
  simulateGather,
  RESOURCE_CATEGORY_LABELS,
  RARITY_LABELS,
  AVAILABILITY_LABELS,
  type ResourceConfig,
  type ResourceCategory,
  type Rarity,
  type AvailabilityMode,
  type GatherSimResult
} from '../content/resourceConfig'

interface Props {
  entity: WorldEntityUI
  onClose(): void
}

type Tab = 'recurso' | 'gps' | 'probar'

const inputClass =
  'w-full rounded-md border border-surface-border bg-surface-2 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-accent'

/**
 * Ficha funcional de un recurso del mapa (doc 23). Edita `properties.resource` y
 * lo persiste vía IPC. Simula la recolección (rango/nivel/herramienta/inventario/
 * usos) sin tocar inventario real.
 */
export function ResourceModal({ entity, onClose }: Props): JSX.Element {
  const updateEntity = useWorldEditorStore((s) => s.updateEntity)
  const [config, setConfig] = useState<ResourceConfig>(() => readResourceConfig(entity.properties))
  const [tab, setTab] = useState<Tab>('recurso')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const errors = validateResourceConfig(config)

  const patch = (partial: Partial<ResourceConfig>): void => {
    setConfig((c) => ({ ...c, ...partial }))
    setDirty(true)
  }

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    try {
      const properties = writeResourceConfig(entity.properties, config)
      const updated = await WorldEditorService.updateEntity({ worldId: entity.worldId, patch: { properties } })
      updateEntity(entity.worldId, updated)
      setDirty(false)
    } catch (error) {
      window.alert(`No se pudo guardar el recurso: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="absolute inset-0 z-[1400] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="flex max-h-full w-[560px] max-w-full flex-col overflow-hidden rounded-lg border border-surface-border bg-surface-1 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-surface-border px-4 py-3">
          <Pickaxe size={16} className="text-accent" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-slate-100">{config.resourceName || entity.name}</div>
            <div className="text-[11px] text-slate-500">
              Recurso · {RESOURCE_CATEGORY_LABELS[config.category]} · {RARITY_LABELS[config.rarity]}
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
          {(['recurso', 'gps', 'probar'] as Tab[]).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-t px-3 py-1.5 text-xs capitalize ${tab === t ? 'bg-surface-2 text-slate-100' : 'text-slate-400 hover:text-slate-200'}`}>
              {t === 'gps' ? 'GPS y respawn' : t === 'probar' ? 'Probar' : 'Recurso'}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {tab === 'recurso' && <ResourceTab config={config} patch={patch} />}
          {tab === 'gps' && <GpsTab config={config} patch={patch} />}
          {tab === 'probar' && <TestTab config={config} />}
        </div>

        <div className="flex items-center gap-2 border-t border-surface-border px-4 py-3">
          <span className="text-[11px] text-slate-500">
            {config.minQty}-{config.maxQty} u · {AVAILABILITY_LABELS[config.availabilityMode].split(' ')[0]}
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

function ResourceTab({ config, patch }: { config: ResourceConfig; patch(p: Partial<ResourceConfig>): void }): JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      <Field label="Nombre del recurso">
        <input value={config.resourceName} onChange={(e) => patch({ resourceName: e.target.value })} className={inputClass} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Categoría">
          <select value={config.category} onChange={(e) => patch({ category: e.target.value as ResourceCategory })} className={inputClass}>
            {(Object.keys(RESOURCE_CATEGORY_LABELS) as ResourceCategory[]).map((c) => (
              <option key={c} value={c}>
                {RESOURCE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Rareza">
          <select value={config.rarity} onChange={(e) => patch({ rarity: e.target.value as Rarity })} className={inputClass}>
            {(Object.keys(RARITY_LABELS) as Rarity[]).map((r) => (
              <option key={r} value={r}>
                {RARITY_LABELS[r]}
              </option>
            ))}
          </select>
        </Field>
        <NumField label="Cantidad mín" min={1} value={config.minQty} onChange={(n) => patch({ minQty: Math.max(1, n) })} />
        <NumField label="Cantidad máx" min={config.minQty} value={config.maxQty} onChange={(n) => patch({ maxQty: Math.max(config.minQty, n) })} />
        <Field label="Probabilidad %">
          <input type="number" min={0} max={100} value={Math.round(config.probability * 100)} onChange={(e) => patch({ probability: Math.min(1, Math.max(0, (Number(e.target.value) || 0) / 100)) })} className={inputClass} />
        </Field>
        <Field label="Herramienta requerida">
          <input value={config.requiredTool} placeholder="(ninguna)" onChange={(e) => patch({ requiredTool: e.target.value })} className={inputClass} />
        </Field>
      </div>
    </div>
  )
}

function GpsTab({ config, patch }: { config: ResourceConfig; patch(p: Partial<ResourceConfig>): void }): JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <NumField label="Radio interacción (m)" min={1} value={config.interactionRadiusM} onChange={(n) => patch({ interactionRadiusM: Math.max(1, n) })} />
        <NumField label="Nivel mínimo" value={config.minLevel} onChange={(n) => patch({ minLevel: n })} />
        <NumField label="Tiempo recolección (s)" value={config.gatherSeconds} onChange={(n) => patch({ gatherSeconds: n })} />
        <NumField label="Respawn (s)" value={config.respawnSeconds} onChange={(n) => patch({ respawnSeconds: n })} />
        <NumField label="Máx usos (0=∞)" value={config.maxUses} onChange={(n) => patch({ maxUses: n })} />
      </div>
      <Field label="Disponibilidad">
        <select value={config.availabilityMode} onChange={(e) => patch({ availabilityMode: e.target.value as AvailabilityMode })} className={inputClass}>
          {(Object.keys(AVAILABILITY_LABELS) as AvailabilityMode[]).map((m) => (
            <option key={m} value={m}>
              {AVAILABILITY_LABELS[m]}
            </option>
          ))}
        </select>
      </Field>
    </div>
  )
}

function TestTab({ config }: { config: ResourceConfig }): JSX.Element {
  const [distanceM, setDistanceM] = useState(5)
  const [playerLevel, setPlayerLevel] = useState(5)
  const [hasTool, setHasTool] = useState(true)
  const [inventoryFull, setInventoryFull] = useState(false)
  const [result, setResult] = useState<GatherSimResult | null>(null)

  const gather = (): void => {
    setResult(
      simulateGather(config, {
        distanceM,
        interactionRadiusM: config.interactionRadiusM,
        playerLevel,
        minLevel: config.minLevel,
        requiredTool: config.requiredTool,
        hasRequiredTool: hasTool,
        inventoryFull,
        usesLeft: -1
      })
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <NumField label="Distancia (m)" value={distanceM} onChange={setDistanceM} />
        <NumField label="Nivel" value={playerLevel} onChange={setPlayerLevel} />
      </div>
      {config.requiredTool.trim() && (
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input type="checkbox" checked={hasTool} onChange={(e) => setHasTool(e.target.checked)} />
          Tengo la herramienta ({config.requiredTool})
        </label>
      )}
      <label className="flex items-center gap-2 text-xs text-slate-300">
        <input type="checkbox" checked={inventoryFull} onChange={(e) => setInventoryFull(e.target.checked)} />
        Inventario lleno
      </label>
      <button type="button" onClick={gather} className="self-start rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white">
        Recolectar (simular)
      </button>
      {result && (
        <div className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${result.ok ? 'border-green-500/40 bg-green-500/10 text-green-300' : 'border-amber-500/40 bg-amber-500/10 text-amber-300'}`}>
          <FlaskConical size={14} />
          <span>{result.message}</span>
        </div>
      )}
      <p className="text-[10px] text-slate-600">Simulación local. En producción el servidor valida distancia, inventario, herramienta y evita doble entrega.</p>
    </div>
  )
}
