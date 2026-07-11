import { useState } from 'react'
import { X, Plus, Trash2, Save, MessageSquare, FlaskConical } from 'lucide-react'
import type { WorldEntityUI } from '../types'
import { WorldEditorService } from '../services/entityService'
import { useWorldEditorStore } from '../hooks/useWorldEditorStore'
import {
  readNpcConfig,
  writeNpcConfig,
  simulateNpcInteraction,
  newDialogueLineId,
  NPC_ACTION_LABELS,
  type NpcConfig,
  type NpcAction,
  type NpcQuestStatus,
  type DialogueLine
} from '../content/npcConfig'

interface Props {
  entity: WorldEntityUI
  onClose(): void
}

type Tab = 'identidad' | 'dialogo' | 'mision' | 'probar'

const QUEST_STATUS_LABELS: Record<NpcQuestStatus, string> = {
  none: 'Sin misión',
  available: 'Disponible (!)',
  ready: 'Lista para entregar (?)'
}

const inputClass =
  'w-full rounded-md border border-surface-border bg-surface-2 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-accent'

/**
 * Ficha funcional de un NPC del mapa (doc 20). Edita la config guardada en
 * `entity.properties.npc` y la persiste vía IPC. Incluye un simulador local de
 * interacción ("Probar interacción") que no cambia estado real.
 */
export function NpcModal({ entity, onClose }: Props): JSX.Element {
  const updateEntity = useWorldEditorStore((s) => s.updateEntity)
  const [config, setConfig] = useState<NpcConfig>(() => readNpcConfig(entity.properties))
  const [tab, setTab] = useState<Tab>('identidad')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const patch = (partial: Partial<NpcConfig>): void => {
    setConfig((c) => ({ ...c, ...partial }))
    setDirty(true)
  }

  const patchLine = (id: string, text: string): void => {
    setConfig((c) => ({ ...c, dialogue: c.dialogue.map((l) => (l.id === id ? { ...l, text } : l)) }))
    setDirty(true)
  }

  const addLine = (): void => {
    setConfig((c) => ({ ...c, dialogue: [...c.dialogue, { id: newDialogueLineId(), text: '' }] }))
    setDirty(true)
  }

  const removeLine = (id: string): void => {
    setConfig((c) => ({ ...c, dialogue: c.dialogue.filter((l) => l.id !== id) }))
    setDirty(true)
  }

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    try {
      const properties = writeNpcConfig(entity.properties, config)
      const updated = await WorldEditorService.updateEntity({ worldId: entity.worldId, patch: { properties } })
      updateEntity(entity.worldId, updated)
      setDirty(false)
    } catch (error) {
      window.alert(`No se pudo guardar el NPC: ${error instanceof Error ? error.message : String(error)}`)
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
          <MessageSquare size={16} className="text-accent" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-slate-100">{config.displayName || entity.name}</div>
            <div className="text-[11px] text-slate-500">NPC · {NPC_ACTION_LABELS[config.action]}</div>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-surface-2 hover:text-slate-200">
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-1 border-b border-surface-border px-2 pt-2">
          {(['identidad', 'dialogo', 'mision', 'probar'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-t px-3 py-1.5 text-xs ${
                tab === t ? 'bg-surface-2 text-slate-100' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'identidad' ? 'Identidad' : t === 'dialogo' ? 'Diálogo' : t === 'mision' ? 'Misión' : 'Probar'}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {tab === 'identidad' && <IdentityTab config={config} patch={patch} entityName={entity.name} />}
          {tab === 'dialogo' && (
            <DialogueTab dialogue={config.dialogue} patchLine={patchLine} addLine={addLine} removeLine={removeLine} />
          )}
          {tab === 'mision' && <QuestTab config={config} patch={patch} />}
          {tab === 'probar' && <TestTab config={config} />}
        </div>

        <div className="flex items-center gap-2 border-t border-surface-border px-4 py-3">
          <span className="text-[11px] text-slate-500">
            {config.dialogue.length} línea(s){config.quest ? ` · Misión: ${QUEST_STATUS_LABELS[config.quest.status]}` : ''}
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

function IdentityTab({
  config,
  patch,
  entityName
}: {
  config: NpcConfig
  patch(p: Partial<NpcConfig>): void
  entityName: string
}): JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      <Field label="Nombre mostrado">
        <input
          value={config.displayName}
          placeholder={entityName}
          onChange={(e) => patch({ displayName: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Acción principal">
        <select value={config.action} onChange={(e) => patch({ action: e.target.value as NpcAction })} className={inputClass}>
          {(Object.keys(NPC_ACTION_LABELS) as NpcAction[]).map((a) => (
            <option key={a} value={a}>
              {NPC_ACTION_LABELS[a]}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Radio interacción (m)">
          <input
            type="number"
            min={1}
            value={config.interactionRadiusM}
            onChange={(e) => patch({ interactionRadiusM: Math.max(1, Number(e.target.value) || 1) })}
            className={inputClass}
          />
        </Field>
        <Field label="Nivel mínimo">
          <input
            type="number"
            min={0}
            value={config.minLevel}
            onChange={(e) => patch({ minLevel: Math.max(0, Number(e.target.value) || 0) })}
            className={inputClass}
          />
        </Field>
      </div>
    </div>
  )
}

function DialogueTab({
  dialogue,
  patchLine,
  addLine,
  removeLine
}: {
  dialogue: DialogueLine[]
  patchLine(id: string, text: string): void
  addLine(): void
  removeLine(id: string): void
}): JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      {dialogue.length === 0 && (
        <div className="rounded-md border border-dashed border-surface-border px-3 py-6 text-center text-xs text-slate-500">
          Sin diálogo. Añade líneas para que el NPC pueda hablar.
        </div>
      )}
      {dialogue.map((line, index) => (
        <div key={line.id} className="flex items-start gap-2">
          <span className="mt-2 w-5 shrink-0 text-right text-[10px] text-slate-500">{index + 1}</span>
          <textarea
            value={line.text}
            rows={2}
            placeholder="Texto de la línea…"
            onChange={(e) => patchLine(line.id, e.target.value)}
            className={`${inputClass} resize-none`}
          />
          <button
            type="button"
            onClick={() => removeLine(line.id)}
            className="mt-1 flex items-center justify-center rounded p-1 text-slate-500 hover:bg-surface-2 hover:text-red-400"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addLine}
        className="mt-1 flex items-center justify-center gap-1.5 rounded-md border border-dashed border-surface-border px-3 py-1.5 text-xs text-slate-300 hover:bg-surface-2"
      >
        <Plus size={13} /> Añadir línea
      </button>
    </div>
  )
}

function QuestTab({ config, patch }: { config: NpcConfig; patch(p: Partial<NpcConfig>): void }): JSX.Element {
  const quest = config.quest
  if (!quest) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <p className="text-xs text-slate-500">Este NPC no tiene misión asignada.</p>
        <button
          type="button"
          onClick={() => patch({ quest: { title: '', description: '', status: 'available' } })}
          className="flex items-center gap-1.5 rounded-md border border-surface-border px-3 py-1.5 text-xs text-slate-200 hover:bg-surface-2"
        >
          <Plus size={13} /> Añadir misión
        </button>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      <Field label="Título de la misión">
        <input value={quest.title} onChange={(e) => patch({ quest: { ...quest, title: e.target.value } })} className={inputClass} />
      </Field>
      <Field label="Descripción">
        <textarea
          value={quest.description}
          rows={3}
          onChange={(e) => patch({ quest: { ...quest, description: e.target.value } })}
          className={`${inputClass} resize-none`}
        />
      </Field>
      <Field label="Estado">
        <select
          value={quest.status}
          onChange={(e) => patch({ quest: { ...quest, status: e.target.value as NpcQuestStatus } })}
          className={inputClass}
        >
          {(Object.keys(QUEST_STATUS_LABELS) as NpcQuestStatus[]).map((s) => (
            <option key={s} value={s}>
              {QUEST_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </Field>
      <button
        type="button"
        onClick={() => patch({ quest: null })}
        className="flex items-center gap-1.5 self-start rounded-md border border-red-500/40 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
      >
        <Trash2 size={13} /> Quitar misión
      </button>
    </div>
  )
}

function TestTab({ config }: { config: NpcConfig }): JSX.Element {
  const [distanceM, setDistanceM] = useState(10)
  const [playerLevel, setPlayerLevel] = useState(5)

  const result = simulateNpcInteraction({
    distanceM,
    interactionRadiusM: config.interactionRadiusM,
    playerLevel,
    minLevel: config.minLevel,
    action: config.action,
    hasDialogue: config.dialogue.length > 0
  })

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Distancia (m)">
          <input type="number" value={distanceM} onChange={(e) => setDistanceM(Number(e.target.value) || 0)} className={inputClass} />
        </Field>
        <Field label="Nivel">
          <input type="number" value={playerLevel} onChange={(e) => setPlayerLevel(Number(e.target.value) || 0)} className={inputClass} />
        </Field>
      </div>
      <div
        className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${
          result.ok
            ? 'border-green-500/40 bg-green-500/10 text-green-300'
            : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
        }`}
      >
        <FlaskConical size={14} />
        <span>{result.message}</span>
      </div>
      <p className="text-[10px] text-slate-600">
        Simulación local del editor. En producción el servidor valida distancia, condiciones y recompensas.
      </p>
    </div>
  )
}
