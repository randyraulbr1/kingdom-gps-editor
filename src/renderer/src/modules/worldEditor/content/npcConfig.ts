/**
 * Configuración de un NPC asociado a un pin del mapa (doc 20).
 *
 * Se guarda dentro de `WorldEntity.properties.npc`. En esta fase el editor
 * mantiene el diálogo y una misión sencilla localmente (borrador). La conexión
 * con módulos NPC/Diálogos/Misiones dedicados y la validación en servidor son
 * fases posteriores; aquí el pin ya deja de ser decorativo y abre una
 * interacción real configurable.
 */

/** Acción principal al interactuar con el NPC. */
export type NpcAction = 'talk' | 'give_quest' | 'continue_quest' | 'complete_quest' | 'open_shop' | 'heal' | 'info'

/** Estado de la misión asociada, usado también para el indicador visual del pin. */
export type NpcQuestStatus = 'none' | 'available' | 'ready'

export interface DialogueLine {
  id: string
  text: string
}

export interface NpcQuest {
  title: string
  description: string
  status: NpcQuestStatus
}

export interface NpcConfig {
  /** Nombre mostrado en la interacción (puede diferir del nombre del pin). */
  displayName: string
  action: NpcAction
  /** Radio en metros para poder interactuar. */
  interactionRadiusM: number
  /** Nivel mínimo del jugador para interactuar (0 = sin requisito). */
  minLevel: number
  dialogue: DialogueLine[]
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
  dialogue: [],
  quest: null
}

const NPC_ACTIONS: NpcAction[] = ['talk', 'give_quest', 'continue_quest', 'complete_quest', 'open_shop', 'heal', 'info']
const QUEST_STATUSES: NpcQuestStatus[] = ['none', 'available', 'ready']

function toNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function newDialogueLineId(): string {
  const globalCrypto = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
  if (globalCrypto?.randomUUID) return globalCrypto.randomUUID()
  return `line_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function normalizeLine(raw: unknown): DialogueLine {
  const obj = (raw ?? {}) as Record<string, unknown>
  return {
    id: typeof obj.id === 'string' && obj.id ? obj.id : newDialogueLineId(),
    text: typeof obj.text === 'string' ? obj.text : ''
  }
}

function normalizeQuest(raw: unknown): NpcQuest | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  const status = QUEST_STATUSES.includes(obj.status as NpcQuestStatus) ? (obj.status as NpcQuestStatus) : 'available'
  return {
    title: typeof obj.title === 'string' ? obj.title : '',
    description: typeof obj.description === 'string' ? obj.description : '',
    status
  }
}

/** Lee (y sanea) la config de NPC desde las propiedades de una entidad. */
export function readNpcConfig(properties: Record<string, unknown> | undefined | null): NpcConfig {
  const npc = (properties?.npc ?? {}) as Record<string, unknown>
  const action = NPC_ACTIONS.includes(npc.action as NpcAction) ? (npc.action as NpcAction) : DEFAULT_NPC_CONFIG.action
  return {
    displayName: typeof npc.displayName === 'string' ? npc.displayName : '',
    action,
    interactionRadiusM: Math.max(1, toNumber(npc.interactionRadiusM, DEFAULT_NPC_CONFIG.interactionRadiusM)),
    minLevel: Math.max(0, toNumber(npc.minLevel, 0)),
    dialogue: Array.isArray(npc.dialogue) ? npc.dialogue.map(normalizeLine) : [],
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
 * `?` lista para entregar, `🛒` comerciante, punto gris si solo dialoga.
 */
export function npcPinBadge(config: NpcConfig): string | null {
  if (config.quest?.status === 'available') return '!'
  if (config.quest?.status === 'ready') return '?'
  if (config.action === 'open_shop') return '🛒'
  return null
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
