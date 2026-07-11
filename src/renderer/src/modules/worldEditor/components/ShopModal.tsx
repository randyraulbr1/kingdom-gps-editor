import { useMemo, useState } from 'react'
import { X, Plus, Trash2, Save, Store, FlaskConical } from 'lucide-react'
import type { WorldEntityUI } from '../types'
import { WorldEditorService } from '../services/entityService'
import { useWorldEditorStore } from '../hooks/useWorldEditorStore'
import {
  readShopConfig,
  writeShopConfig,
  simulatePurchase,
  newCatalogItemId,
  SHOP_TYPE_LABELS,
  type ShopConfig,
  type ShopCatalogItem,
  type ShopType,
  type ShopStatus
} from '../content/shopConfig'

interface Props {
  entity: WorldEntityUI
  onClose(): void
}

type Tab = 'resumen' | 'catalogo' | 'probar'

const STATUS_LABELS: Record<ShopStatus, string> = {
  draft: 'Borrador',
  active: 'Activa',
  paused: 'Pausada',
  closed: 'Cerrada'
}

/**
 * Ficha funcional de una tienda del mapa (doc 17, fase A). Edita la config
 * guardada en `entity.properties.shop` y la persiste vía IPC. Incluye un
 * simulador local de compra ("Probar tienda") que no toca datos reales.
 */
export function ShopModal({ entity, onClose }: Props): JSX.Element {
  const updateEntity = useWorldEditorStore((s) => s.updateEntity)
  const [config, setConfig] = useState<ShopConfig>(() => readShopConfig(entity.properties))
  const [tab, setTab] = useState<Tab>('resumen')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const patch = (partial: Partial<ShopConfig>): void => {
    setConfig((c) => ({ ...c, ...partial }))
    setDirty(true)
  }

  const patchItem = (id: string, partial: Partial<ShopCatalogItem>): void => {
    setConfig((c) => ({ ...c, catalog: c.catalog.map((it) => (it.id === id ? { ...it, ...partial } : it)) }))
    setDirty(true)
  }

  const addItem = (): void => {
    setConfig((c) => ({
      ...c,
      catalog: [
        ...c.catalog,
        { id: newCatalogItemId(), itemName: '', buyPrice: 0, sellPrice: 0, stock: -1, requiredLevel: 0 }
      ]
    }))
    setDirty(true)
  }

  const removeItem = (id: string): void => {
    setConfig((c) => ({ ...c, catalog: c.catalog.filter((it) => it.id !== id) }))
    setDirty(true)
  }

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    try {
      const properties = writeShopConfig(entity.properties, config)
      const updated = await WorldEditorService.updateEntity({ worldId: entity.worldId, patch: { properties } })
      updateEntity(entity.worldId, updated)
      setDirty(false)
    } catch (error) {
      window.alert(`No se pudo guardar la tienda: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="absolute inset-0 z-[1400] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="flex max-h-full w-[560px] max-w-full flex-col overflow-hidden rounded-lg border border-surface-border bg-surface-1 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-surface-border px-4 py-3">
          <Store size={16} className="text-accent" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-slate-100">{entity.name}</div>
            <div className="text-[11px] text-slate-500">Tienda · {SHOP_TYPE_LABELS[config.shopType]}</div>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-surface-2 hover:text-slate-200">
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-1 border-b border-surface-border px-2 pt-2">
          {(['resumen', 'catalogo', 'probar'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-t px-3 py-1.5 text-xs capitalize ${
                tab === t ? 'bg-surface-2 text-slate-100' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'resumen' ? 'Resumen' : t === 'catalogo' ? 'Catálogo' : 'Probar tienda'}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {tab === 'resumen' && <SummaryTab config={config} patch={patch} />}
          {tab === 'catalogo' && (
            <CatalogTab config={config} patchItem={patchItem} addItem={addItem} removeItem={removeItem} />
          )}
          {tab === 'probar' && <TestTab config={config} />}
        </div>

        <div className="flex items-center gap-2 border-t border-surface-border px-4 py-3">
          <span className="text-[11px] text-slate-500">
            {config.catalog.length} producto(s) · Estado: {STATUS_LABELS[config.status]}
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

const inputClass =
  'w-full rounded-md border border-surface-border bg-surface-2 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-accent'

function SummaryTab({ config, patch }: { config: ShopConfig; patch(p: Partial<ShopConfig>): void }): JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      <Field label="Tipo de tienda">
        <select
          value={config.shopType}
          onChange={(e) => patch({ shopType: e.target.value as ShopType })}
          className={inputClass}
        >
          {(Object.keys(SHOP_TYPE_LABELS) as ShopType[]).map((t) => (
            <option key={t} value={t}>
              {SHOP_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Radio de interacción (m)">
        <input
          type="number"
          min={1}
          value={config.interactionRadiusM}
          onChange={(e) => patch({ interactionRadiusM: Math.max(1, Number(e.target.value) || 1) })}
          className={inputClass}
        />
      </Field>
      <Field label="Estado">
        <select
          value={config.status}
          onChange={(e) => patch({ status: e.target.value as ShopStatus })}
          className={inputClass}
        >
          {(Object.keys(STATUS_LABELS) as ShopStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </Field>
    </div>
  )
}

function CatalogTab({
  config,
  patchItem,
  addItem,
  removeItem
}: {
  config: ShopConfig
  patchItem(id: string, p: Partial<ShopCatalogItem>): void
  addItem(): void
  removeItem(id: string): void
}): JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[1fr_64px_64px_56px_28px] items-center gap-2 px-1 text-[10px] uppercase tracking-wide text-slate-500">
        <span>Producto</span>
        <span>Compra</span>
        <span>Venta</span>
        <span>Stock</span>
        <span />
      </div>
      {config.catalog.length === 0 && (
        <div className="rounded-md border border-dashed border-surface-border px-3 py-6 text-center text-xs text-slate-500">
          Catálogo vacío. Añade productos para que la tienda sea funcional.
        </div>
      )}
      {config.catalog.map((item) => (
        <div key={item.id} className="grid grid-cols-[1fr_64px_64px_56px_28px] items-center gap-2">
          <input
            value={item.itemName}
            placeholder="Nombre"
            onChange={(e) => patchItem(item.id, { itemName: e.target.value })}
            className={inputClass}
          />
          <input
            type="number"
            min={0}
            value={item.buyPrice}
            onChange={(e) => patchItem(item.id, { buyPrice: Math.max(0, Number(e.target.value) || 0) })}
            className={inputClass}
          />
          <input
            type="number"
            min={0}
            value={item.sellPrice}
            onChange={(e) => patchItem(item.id, { sellPrice: Math.max(0, Number(e.target.value) || 0) })}
            className={inputClass}
          />
          <input
            type="number"
            value={item.stock}
            title="-1 = ilimitado"
            onChange={(e) => patchItem(item.id, { stock: Number(e.target.value) || 0 })}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => removeItem(item.id)}
            className="flex items-center justify-center rounded p-1 text-slate-500 hover:bg-surface-2 hover:text-red-400"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="mt-1 flex items-center justify-center gap-1.5 rounded-md border border-dashed border-surface-border px-3 py-1.5 text-xs text-slate-300 hover:bg-surface-2"
      >
        <Plus size={13} /> Añadir producto
      </button>
      <p className="text-[10px] text-slate-600">Stock -1 = ilimitado. Los precios reales los valida el servidor al publicar.</p>
    </div>
  )
}

function TestTab({ config }: { config: ShopConfig }): JSX.Element {
  const [playerMoney, setPlayerMoney] = useState(100)
  const [distanceM, setDistanceM] = useState(10)
  const [playerLevel, setPlayerLevel] = useState(5)
  const [itemId, setItemId] = useState<string>(config.catalog[0]?.id ?? '')

  const item = useMemo(() => config.catalog.find((it) => it.id === itemId), [config.catalog, itemId])
  const result = item
    ? simulatePurchase({
        playerMoney,
        distanceM,
        interactionRadiusM: config.interactionRadiusM,
        item,
        playerLevel
      })
    : null

  if (config.catalog.length === 0) {
    return <div className="text-xs text-slate-500">Añade productos en la pestaña Catálogo para poder simular una compra.</div>
  }

  return (
    <div className="flex flex-col gap-3">
      <Field label="Producto">
        <select value={itemId} onChange={(e) => setItemId(e.target.value)} className={inputClass}>
          {config.catalog.map((it) => (
            <option key={it.id} value={it.id}>
              {it.itemName || '(sin nombre)'} · {it.buyPrice}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Dinero">
          <input type="number" value={playerMoney} onChange={(e) => setPlayerMoney(Number(e.target.value) || 0)} className={inputClass} />
        </Field>
        <Field label="Distancia (m)">
          <input type="number" value={distanceM} onChange={(e) => setDistanceM(Number(e.target.value) || 0)} className={inputClass} />
        </Field>
        <Field label="Nivel">
          <input type="number" value={playerLevel} onChange={(e) => setPlayerLevel(Number(e.target.value) || 0)} className={inputClass} />
        </Field>
      </div>
      {result && (
        <div
          className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${
            result.ok
              ? 'border-green-500/40 bg-green-500/10 text-green-300'
              : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
          }`}
        >
          <FlaskConical size={14} />
          <span>
            {result.message}
            {result.ok && ` · Quedan ${result.remainingMoney}`}
          </span>
        </div>
      )}
      <p className="text-[10px] text-slate-600">
        Simulación local del editor. En producción el servidor valida distancia, stock, dinero e idempotencia.
      </p>
    </div>
  )
}
