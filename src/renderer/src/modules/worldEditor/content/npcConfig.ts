/**
 * Configuración de un NPC asociado a un pin del mapa (doc 20).
 *
 * Se guarda dentro de `WorldEntity.properties.npc`. El diálogo se modela como un
 * grafo de nodos conectados (`content/dialogueGraph.ts`) y la misión tiene pasos
 * ordenados que pueden apuntar a un pin del mapa (`targetWorldId`). El editor
 * mantiene esto localmente (borrador); la validación final de recompensas y
 * progreso es del servidor en fases posteriores.
 */

import {
  normalizeDialogueGraph,
  validateDialogueGraph,
  EMPTY_DIALOGUE_GRAPH,
  type DialogueGraph
} from './dialogueGraph'

/** Acción principal al interactuar con el NPC. */
export type NpcAction = 'talk' | 'give_quest' | 'continue_quest' | 'complete_quest' | 'open_shop' | 'heal' | 'info'

/** Estado de la misión asociada, usado también para el indicador visual del pin. */
export type NpcQuestStatus = 'none' | 'available' | 'ready'

/** Un paso de la misión; puede apuntar a un pin del mapa (worldId) como objetivo. */
export interface QuestStep {
  id: string
  description: string
  /** worldId de la entidad objetivo en el mapa, o null si el paso no tiene destino físico. */
  targetWorldId: string | null
}

export interface NpcQuest {
  title: string
  description: string
  status: NpcQuestStatus
  steps: QuestStep[]
}

export interface NpcConfig {
  /** Nombre mostrado en la interacción (puede diferir del nombre del pin). */
  displayName: string
  action: NpcAction
  /** Radio en metros para poder interactuar. */
  interactionRadiusM: number
  /** Nivel mínimo del jugador para interactuar (0 = sin requisito). */
  minLevel: number
  /** Diálogo como grafo de nodos conectados. */
  dialogue: DialogueGraph
  quest: NpcQuest | null
}

export const NPC_ACTION_LABELS: Record<NpcAction, string> = {
  talk: 'Hablar',
  give_quest: 'Entregar misión',
  continue_quest: 'Continuar misión',
  complete_quest: 'Completar misión',
  open_shop: 'Abrir tienda',
  heal: 'Curar',
  info: 'Información'
}

export const DEFAULT_NPC_CONFIG: NpcConfig = {
  displayName: '',
  action: 'talk',
  interactionRadiusM: 25,
  minLevel: 0,
  dialogue: { ...EMPTY_DIALOGUE_GRAPH },
  quest: null
}

const NPC_ACTIONS: NpcAction[] = ['talk', 'give_quest', 'continue_quest', 'complete_quest', 'open_shop', 'heal', 'info']
const QUEST_STATUSES: NpcQuestStatus[] = ['none', 'available', 'ready']

function toNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function randomId(prefix: string): string {
  const globalCrypto = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
  if (globalCrypto?.randomUUID) return globalCrypto.randomUUID()
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export const newQuestStepId = (): string => randomId('step')

function normalizeStep(raw: unknown): QuestStep {
  const obj = (raw ?? {}) as Record<string, unknown>
  return {
    id: typeof obj.id === 'string' && obj.id ? obj.id : newQuestStepId(),
    description: typeof obj.description === 'string' ? obj.description : '',
    targetWorldId: typeof obj.targetWorldId === 'string' ? obj.targetWorldId : null
  }
}

function normalizeQuest(raw: unknown): NpcQuest | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  const status = QUEST_STATUSES.includes(obj.status as NpcQuestStatus) ? (obj.status as NpcQuestStatus) : 'available'
  return {
    title: typeof obj.title === 'string' ? obj.title : '',
    description: typeof obj.description === 'string' ? obj.description : '',
    status,
    steps: Array.isArray(obj.steps) ? obj.steps.map(normalizeStep) : []
  }
}

/** Lee (y sanea) la config de NPC desde las propiedades de una entidad. */
export function readNpcConfig(properties: Record<string, unknown> | undefined | null): NpcConfig {
  const npc = (properties?.npc ?? {}) as Record<string, unknown>
  const action = NPC_ACTIONS.includes(npc.action as NpcAction) ? (npc.action as NpcAction) : DEFAULT_NPC_CONFIG.action
  // Migración: si `dialogue` es un array de líneas antiguas, se convierte a grafo.
  const legacyLines = Array.isArray(npc.dialogue)
    ? (npc.dialogue as Array<{ id?: string; text: string }>)
    : undefined
  const dialogue = normalizeDialogueGraph(npc.dialogue, legacyLines)
  return {
    displayName: typeof npc.displayName === 'string' ? npc.displayName : '',
    action,
    interactionRadiusM: Math.max(1, toNumber(npc.interactionRadiusM, DEFAULT_NPC_CONFIG.interactionRadiusM)),
    minLevel: Math.max(0, toNumber(npc.minLevel, 0)),
    dialogue,
    quest: normalizeQuest(npc.quest)
  }
}

/** Devuelve un nuevo objeto de propiedades con la config de NPC escrita. */
export function writeNpcConfig(
  properties: Record<string, unknown> | undefined | null,
  config: NpcConfig
): Record<string, unknown> {
  return { ...(properties ?? {}), npc: config }
}

/**
 * Indicador visual sobre el pin NPC (doc 20): `!` misión disponible,
 * `?` lista para entregar, `🛒` comerciante, nada si solo dialoga.
 */
export function npcPinBadge(config: NpcConfig): string | null {
  if (config.quest?.status === 'available') return '!'
  if (config.quest?.status === 'ready') return '?'
  if (config.action === 'open_shop') return '🛒'
  return null
}

export interface NpcReferenceError {
  code: 'dialogue_broken_link' | 'quest_step_missing_target' | 'no_dialogue_for_talk'
  message: string
}

/**
 * Valida las referencias del NPC (doc 20): enlaces de diálogo rotos y pasos de
 * misión cuyo pin objetivo ya no existe en el mapa. `existingWorldIds` son los
 * worldId de las entidades actuales del mundo.
 */
export function validateNpcReferences(config: NpcConfig, existingWorldIds: ReadonlySet<string>): NpcReferenceError[] {
  const errors: NpcReferenceError[] = []
  for (const err of validateDialogueGraph(config.dialogue)) {
    if (err.code === 'broken_link') {
      errors.push({ code: 'dialogue_broken_link', message: err.message })
    }
  }
  if (config.action === 'talk' && config.dialogue.nodes.length === 0) {
    errors.push({ code: 'no_dialogue_for_talk', message: 'La acción es "Hablar" pero no hay diálogo asignado' })
  }
  if (config.quest) {
    for (const step of config.quest.steps) {
      if (step.targetWorldId && !existingWorldIds.has(step.targetWorldId)) {
        errors.push({
          code: 'quest_step_missing_target',
          message: `El paso "${step.description || 'sin nombre'}" apunta a un pin que ya no existe`
        })
      }
    }
  }
  return errors
}

export interface NpcInteractionSimInput {
  distanceM: number
  interactionRadiusM: number
  playerLevel: number
  minLevel: number
  action: NpcAction
  hasDialogue: boolean
}

export type NpcInteractionSimResult =
  | { ok: true; action: NpcAction; message: string }
  | { ok: false; reason: 'out_of_range' | 'insufficient_level' | 'no_dialogue'; message: string }

/**
 * Simula la interacción con el NPC en el editor (doc 20, "Probar interacción").
 * No cambia estado real: el servidor valida distancia, condiciones y recompensas
 * en producción.
 */
export function simulateNpcInteraction(input: NpcInteractionSimInput): NpcInteractionSimResult {
  if (input.distanceM > input.interactionRadiusM) {
    const falta = Math.ceil(input.distanceM - input.interactionRadiusM)
    return { ok: false, reason: 'out_of_range', message: `Fuera de rango: acércate ${falta} m` }
  }
  if (input.playerLevel < input.minLevel) {
    return { ok: false, reason: 'insufficient_level', message: `Nivel insuficiente (requiere ${input.minLevel})` }
  }
  if (input.action === 'talk' && !input.hasDialogue) {
    return { ok: false, reason: 'no_dialogue', message: 'El NPC no tiene diálogo asignado' }
  }
  return { ok: true, action: input.action, message: `Interacción: ${NPC_ACTION_LABELS[input.action]}` }
}
