import { useMemo, useState } from 'react'
import { X, Plus, Trash2, Save, MessageSquare, FlaskConical, AlertTriangle, Flag, RotateCcw, Play } from 'lucide-react'
import type { WorldEntityUI } from '../types'
import { WorldEditorService } from '../services/entityService'
import { useWorldEditorStore } from '../hooks/useWorldEditorStore'
import {
  readNpcConfig,
  writeNpcConfig,
  simulateNpcInteraction,
  validateNpcReferences,
  newQuestStepId,
  NPC_ACTION_LABELS,
  type NpcConfig,
  type NpcAction,
  type NpcQuestStatus,
  type QuestStep
} from '../content/npcConfig'
import {
  validateDialogueGraph,
  getStartNode,
  advanceDialogue,
  newNodeId,
  newOptionId,
  DIALOGUE_EFFECT_LABELS,
  type DialogueGraph,
  type DialogueNode,
  type DialogueOption,
  type DialogueEffect
} from '../content/dialogueGraph'

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
 * Ficha funcional de un NPC del mapa (doc 20): diálogo como grafo de nodos
 * conectados, misión con pasos que pueden apuntar a pines del mapa, validación
 * de referencias rotas y simuladores locales. Persiste en `properties.npc`.
 */
export function NpcModal({ entity, onClose }: Props): JSX.Element {
  const updateEntity = useWorldEditorStore((s) => s.updateEntity)
  const allEntities = useWorldEditorStore((s) => s.entities)
  const [config, setConfig] = useState<NpcConfig>(() => readNpcConfig(entity.properties))
  const [tab, setTab] = useState<Tab>('identidad')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  // Otros pines del mapa que un paso de misión puede usar como objetivo.
  const targetOptions = useMemo(
    () => allEntities.filter((e) => e.worldId !== entity.worldId).map((e) => ({ id: e.worldId, name: e.name, type: e.entityType })),
    [allEntities, entity.worldId]
  )
  const existingWorldIds = useMemo(() => new Set(allEntities.map((e) => e.worldId)), [allEntities])
  const refErrors = validateNpcReferences(config, existingWorldIds)

  const patch = (partial: Partial<NpcConfig>): void => {
    setConfig((c) => ({ ...c, ...partial }))
    setDirty(true)
  }
  const patchDialogue = (dialogue: DialogueGraph): void => patch({ dialogue })

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
        className="flex max-h-full w-[620px] max-w-full flex-col overflow-hidden rounded-lg border border-surface-border bg-surface-1 shadow-2xl"
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

        {refErrors.length > 0 && (
          <div className="flex items-start gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-[11px] text-amber-300">
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            <div>
              {refErrors.map((e, i) => (
                <div key={i}>{e.message}</div>
              ))}
            </div>
          </div>
        )}

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
          {tab === 'dialogo' && <DialogueTab dialogue={config.dialogue} onChange={patchDialogue} />}
          {tab === 'mision' && <QuestTab config={config} patch={patch} targetOptions={targetOptions} />}
          {tab === 'probar' && <TestTab config={config} />}
        </div>

        <div className="flex items-center gap-2 border-t border-surface-border px-4 py-3">
          <span className="text-[11px] text-slate-500">
            {config.dialogue.nodes.length} nodo(s){config.quest ? ` · ${config.quest.steps.length} paso(s)` : ''}
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
        <input value={config.displayName} placeholder={entityName} onChange={(e) => patch({ displayName: e.target.value })} className={inputClass} />
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

// ===== Diálogo (editor de grafo) =====

function DialogueTab({ dialogue, onChange }: { dialogue: DialogueGraph; onChange(g: DialogueGraph): void }): JSX.Element {
  const errors = validateDialogueGraph(dialogue)
  const brokenOptionIds = new Set(errors.filter((e) => e.code === 'broken_link').map((e) => e.optionId))

  const addNode = (): void => {
    const node: DialogueNode = { id: newNodeId(), text: '', options: [] }
    onChange({
      startNodeId: dialogue.startNodeId ?? node.id,
      nodes: [...dialogue.nodes, node]
    })
  }

  const removeNode = (id: string): void => {
    const nodes = dialogue.nodes.filter((n) => n.id !== id)
    // Limpia enlaces que apuntaban al nodo borrado para no dejar rutas rotas.
    const cleaned = nodes.map((n) => ({
      ...n,
      options: n.options.map((o) => (o.nextNodeId === id ? { ...o, nextNodeId: null } : o))
    }))
    onChange({
      startNodeId: dialogue.startNodeId === id ? (cleaned[0]?.id ?? null) : dialogue.startNodeId,
      nodes: cleaned
    })
  }

  const patchNode = (id: string, partial: Partial<DialogueNode>): void => {
    onChange({ ...dialogue, nodes: dialogue.nodes.map((n) => (n.id === id ? { ...n, ...partial } : n)) })
  }

  const setStart = (id: string): void => onChange({ ...dialogue, startNodeId: id })

  return (
    <div className="flex flex-col gap-3">
      {dialogue.nodes.length === 0 && (
        <div className="rounded-md border border-dashed border-surface-border px-3 py-6 text-center text-xs text-slate-500">
          Sin diálogo. Añade nodos conectados por opciones para que el NPC pueda conversar.
        </div>
      )}
      {dialogue.nodes.map((node, index) => (
        <NodeCard
          key={node.id}
          node={node}
          index={index}
          isStart={dialogue.startNodeId === node.id}
          allNodes={dialogue.nodes}
          brokenOptionIds={brokenOptionIds}
          onSetStart={() => setStart(node.id)}
          onRemove={() => removeNode(node.id)}
          onPatch={(partial) => patchNode(node.id, partial)}
        />
      ))}
      <button
        type="button"
        onClick={addNode}
        className="flex items-center justify-center gap-1.5 rounded-md border border-dashed border-surface-border px-3 py-1.5 text-xs text-slate-300 hover:bg-surface-2"
      >
        <Plus size={13} /> Añadir nodo
      </button>
    </div>
  )
}

function NodeCard({
  node,
  index,
  isStart,
  allNodes,
  brokenOptionIds,
  onSetStart,
  onRemove,
  onPatch
}: {
  node: DialogueNode
  index: number
  isStart: boolean
  allNodes: DialogueNode[]
  brokenOptionIds: Set<string | undefined>
  onSetStart(): void
  onRemove(): void
  onPatch(p: Partial<DialogueNode>): void
}): JSX.Element {
  const addOption = (): void => {
    const option: DialogueOption = { id: newOptionId(), label: 'Continuar', nextNodeId: null, effect: 'none' }
    onPatch({ options: [...node.options, option] })
  }
  const patchOption = (id: string, partial: Partial<DialogueOption>): void => {
    onPatch({ options: node.options.map((o) => (o.id === id ? { ...o, ...partial } : o)) })
  }
  const removeOption = (id: string): void => onPatch({ options: node.options.filter((o) => o.id !== id) })

  return (
    <div className="rounded-md border border-surface-border bg-surface-2/40 p-2.5">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Nodo {index + 1}</span>
        {isStart ? (
          <span className="rounded bg-accent-muted px-1.5 py-0.5 text-[10px] text-accent">Inicial</span>
        ) : (
          <button type="button" onClick={onSetStart} className="text-[10px] text-slate-500 hover:text-accent">
            marcar inicial
          </button>
        )}
        <button type="button" onClick={onRemove} className="ml-auto rounded p-1 text-slate-500 hover:bg-surface-2 hover:text-red-400">
          <Trash2 size={12} />
        </button>
      </div>
      <textarea
        value={node.text}
        rows={2}
        placeholder="Texto del NPC…"
        onChange={(e) => onPatch({ text: e.target.value })}
        className={`${inputClass} resize-none`}
      />
      <div className="mt-2 flex flex-col gap-1.5">
        {node.options.map((option) => (
          <div key={option.id} className="grid grid-cols-[1fr_1fr_1fr_24px] items-center gap-1.5">
            <input
              value={option.label}
              placeholder="Respuesta"
              onChange={(e) => patchOption(option.id, { label: e.target.value })}
              className={`${inputClass} ${brokenOptionIds.has(option.id) ? 'border-red-500/60' : ''}`}
            />
            <select
              value={option.nextNodeId ?? ''}
              onChange={(e) => patchOption(option.id, { nextNodeId: e.target.value || null })}
              className={inputClass}
            >
              <option value="">(cerrar)</option>
              {allNodes.map((n, i) => (
                <option key={n.id} value={n.id}>
                  → Nodo {i + 1}
                </option>
              ))}
            </select>
            <select
              value={option.effect}
              onChange={(e) => patchOption(option.id, { effect: e.target.value as DialogueEffect })}
              className={inputClass}
            >
              {(Object.keys(DIALOGUE_EFFECT_LABELS) as DialogueEffect[]).map((ef) => (
                <option key={ef} value={ef}>
                  {DIALOGUE_EFFECT_LABELS[ef]}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => removeOption(option.id)} className="rounded p-1 text-slate-500 hover:bg-surface-2 hover:text-red-400">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        <button type="button" onClick={addOption} className="self-start text-[11px] text-slate-400 hover:text-accent">
          + Añadir opción
        </button>
      </div>
    </div>
  )
}

// ===== Misión (pasos conectados al mapa) =====

function QuestTab({
  config,
  patch,
  targetOptions
}: {
  config: NpcConfig
  patch(p: Partial<NpcConfig>): void
  targetOptions: Array<{ id: string; name: string; type: string }>
}): JSX.Element {
  const quest = config.quest
  if (!quest) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <p className="text-xs text-slate-500">Este NPC no tiene misión asignada.</p>
        <button
          type="button"
          onClick={() => patch({ quest: { title: '', description: '', status: 'available', steps: [] } })}
          className="flex items-center gap-1.5 rounded-md border border-surface-border px-3 py-1.5 text-xs text-slate-200 hover:bg-surface-2"
        >
          <Plus size={13} /> Añadir misión
        </button>
      </div>
    )
  }

  const setQuest = (partial: Partial<typeof quest>): void => patch({ quest: { ...quest, ...partial } })
  const patchStep = (id: string, partial: Partial<QuestStep>): void =>
    setQuest({ steps: quest.steps.map((s) => (s.id === id ? { ...s, ...partial } : s)) })
  const addStep = (): void =>
    setQuest({ steps: [...quest.steps, { id: newQuestStepId(), description: '', targetWorldId: null }] })
  const removeStep = (id: string): void => setQuest({ steps: quest.steps.filter((s) => s.id !== id) })

  return (
    <div className="flex flex-col gap-3">
      <Field label="Título de la misión">
        <input value={quest.title} onChange={(e) => setQuest({ title: e.target.value })} className={inputClass} />
      </Field>
      <Field label="Descripción">
        <textarea value={quest.description} rows={2} onChange={(e) => setQuest({ description: e.target.value })} className={`${inputClass} resize-none`} />
      </Field>
      <Field label="Estado">
        <select value={quest.status} onChange={(e) => setQuest({ status: e.target.value as NpcQuestStatus })} className={inputClass}>
          {(Object.keys(QUEST_STATUS_LABELS) as NpcQuestStatus[]).map((s) => (
            <option key={s} value={s}>
              {QUEST_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </Field>

      <div>
        <div className="mb-1 flex items-center gap-2">
          <Flag size={12} className="text-slate-500" />
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Pasos (objetivo en el mapa)</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {quest.steps.length === 0 && <p className="text-[11px] text-slate-500">Sin pasos. Cada paso puede apuntar a un pin del mapa.</p>}
          {quest.steps.map((step, i) => (
            <div key={step.id} className="grid grid-cols-[16px_1fr_1fr_24px] items-center gap-1.5">
              <span className="text-right text-[10px] text-slate-500">{i + 1}</span>
              <input
                value={step.description}
                placeholder="Descripción del paso"
                onChange={(e) => patchStep(step.id, { description: e.target.value })}
                className={inputClass}
              />
              <select
                value={step.targetWorldId ?? ''}
                onChange={(e) => patchStep(step.id, { targetWorldId: e.target.value || null })}
                className={inputClass}
              >
                <option value="">(sin objetivo)</option>
                {targetOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
              <button type="button" onClick={() => removeStep(step.id)} className="rounded p-1 text-slate-500 hover:bg-surface-2 hover:text-red-400">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <button type="button" onClick={addStep} className="self-start text-[11px] text-slate-400 hover:text-accent">
            + Añadir paso
          </button>
        </div>
      </div>

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

// ===== Probar (recorre el diálogo + simula interacción) =====

function TestTab({ config }: { config: NpcConfig }): JSX.Element {
  const [distanceM, setDistanceM] = useState(10)
  const [playerLevel, setPlayerLevel] = useState(5)
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(() => getStartNode(config.dialogue)?.id ?? null)
  const [log, setLog] = useState<string[]>([])

  const interaction = simulateNpcInteraction({
    distanceM,
    interactionRadiusM: config.interactionRadiusM,
    playerLevel,
    minLevel: config.minLevel,
    action: config.action,
    hasDialogue: config.dialogue.nodes.length > 0
  })

  const currentNode = currentNodeId ? config.dialogue.nodes.find((n) => n.id === currentNodeId) ?? null : null

  const reset = (): void => {
    setCurrentNodeId(getStartNode(config.dialogue)?.id ?? null)
    setLog([])
  }

  const choose = (optionId: string, label: string, effect: DialogueEffect): void => {
    const step = advanceDialogue(config.dialogue, optionId)
    const notes: string[] = [`▸ ${label}`]
    if (effect !== 'none') notes.push(`   ⚡ Efecto: ${DIALOGUE_EFFECT_LABELS[effect]}`)
    if (!step || (!step.nextNode && effect === 'end')) notes.push('   — fin del diálogo —')
    setLog((l) => [...l, ...notes])
    setCurrentNodeId(step?.nextNode?.id ?? null)
  }

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
          interaction.ok ? 'border-green-500/40 bg-green-500/10 text-green-300' : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
        }`}
      >
        <FlaskConical size={14} />
        <span>{interaction.message}</span>
      </div>

      <div className="rounded-md border border-surface-border bg-surface-2/40 p-3">
        <div className="mb-2 flex items-center gap-2">
          <Play size={12} className="text-accent" />
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Recorrer diálogo</span>
          <button type="button" onClick={reset} className="ml-auto flex items-center gap-1 text-[11px] text-slate-400 hover:text-accent">
            <RotateCcw size={11} /> Reiniciar
          </button>
        </div>
        {config.dialogue.nodes.length === 0 ? (
          <p className="text-[11px] text-slate-500">No hay diálogo que recorrer.</p>
        ) : currentNode ? (
          <div className="flex flex-col gap-2">
            <p className="rounded bg-surface-1 px-2 py-1.5 text-xs text-slate-200">{currentNode.text || '(nodo sin texto)'}</p>
            <div className="flex flex-col gap-1">
              {currentNode.options.length === 0 && <span className="text-[11px] text-slate-500">(nodo sin opciones — fin)</span>}
              {currentNode.options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => choose(o.id, o.label, o.effect)}
                  className="rounded border border-surface-border px-2 py-1 text-left text-xs text-slate-200 hover:bg-surface-2"
                >
                  {o.label}
                  {o.effect !== 'none' && <span className="ml-2 text-[10px] text-accent">[{DIALOGUE_EFFECT_LABELS[o.effect]}]</span>}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-slate-500">— fin del diálogo — pulsa Reiniciar para volver a empezar.</p>
        )}
        {log.length > 0 && (
          <pre className="mt-2 max-h-24 overflow-y-auto whitespace-pre-wrap rounded bg-surface-1 px-2 py-1 text-[10px] text-slate-400">
            {log.join('\n')}
          </pre>
        )}
      </div>
      <p className="text-[10px] text-slate-600">Simulación local del editor. En producción el servidor valida distancia, condiciones y recompensas.</p>
    </div>
  )
}
