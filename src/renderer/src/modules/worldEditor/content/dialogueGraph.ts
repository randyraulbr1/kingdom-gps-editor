/**
 * Diálogo como grafo de nodos conectados (doc 20).
 *
 * Cada nodo tiene un texto y varias opciones de respuesta. Cada opción puede
 * llevar a otro nodo (`nextNodeId`) y/o disparar un efecto (iniciar misión,
 * avanzar/completar misión, abrir tienda, entregar objeto, cerrar). El editor
 * dibuja estas conexiones y valida que ninguna opción apunte a un nodo borrado
 * (rutas rotas), tal como pide la especificación.
 */

export type DialogueEffect =
  | 'none'
  | 'start_quest'
  | 'advance_quest'
  | 'complete_quest'
  | 'open_shop'
  | 'give_item'
  | 'end'

export const DIALOGUE_EFFECT_LABELS: Record<DialogueEffect, string> = {
  none: 'Sin efecto',
  start_quest: 'Iniciar misión',
  advance_quest: 'Avanzar misión',
  complete_quest: 'Completar misión',
  open_shop: 'Abrir tienda',
  give_item: 'Entregar objeto',
  end: 'Cerrar diálogo'
}

export interface DialogueOption {
  id: string
  label: string
  /** Nodo destino; null = la opción no continúa (p. ej. solo dispara un efecto o cierra). */
  nextNodeId: string | null
  effect: DialogueEffect
}

export interface DialogueNode {
  id: string
  text: string
  options: DialogueOption[]
}

export interface DialogueGraph {
  /** Nodo inicial; null si el grafo está vacío. */
  startNodeId: string | null
  nodes: DialogueNode[]
}

export const EMPTY_DIALOGUE_GRAPH: DialogueGraph = { startNodeId: null, nodes: [] }

const EFFECTS: DialogueEffect[] = ['none', 'start_quest', 'advance_quest', 'complete_quest', 'open_shop', 'give_item', 'end']

function randomId(prefix: string): string {
  const globalCrypto = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
  if (globalCrypto?.randomUUID) return globalCrypto.randomUUID()
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export const newNodeId = (): string => randomId('node')
export const newOptionId = (): string => randomId('opt')

function normalizeOption(raw: unknown): DialogueOption {
  const obj = (raw ?? {}) as Record<string, unknown>
  return {
    id: typeof obj.id === 'string' && obj.id ? obj.id : newOptionId(),
    label: typeof obj.label === 'string' ? obj.label : 'Continuar',
    nextNodeId: typeof obj.nextNodeId === 'string' ? obj.nextNodeId : null,
    effect: EFFECTS.includes(obj.effect as DialogueEffect) ? (obj.effect as DialogueEffect) : 'none'
  }
}

function normalizeNode(raw: unknown): DialogueNode {
  const obj = (raw ?? {}) as Record<string, unknown>
  return {
    id: typeof obj.id === 'string' && obj.id ? obj.id : newNodeId(),
    text: typeof obj.text === 'string' ? obj.text : '',
    options: Array.isArray(obj.options) ? obj.options.map(normalizeOption) : []
  }
}

/**
 * Convierte una lista de líneas simples (formato antiguo del NPC) en un grafo
 * lineal: cada línea es un nodo con una única opción "Continuar" hacia la
 * siguiente; la última cierra el diálogo.
 */
export function buildLinearGraphFromLines(lines: Array<{ id?: string; text: string }>): DialogueGraph {
  if (lines.length === 0) return { ...EMPTY_DIALOGUE_GRAPH }
  const nodes: DialogueNode[] = lines.map((line) => ({
    id: typeof line.id === 'string' && line.id ? line.id : newNodeId(),
    text: line.text,
    options: []
  }))
  for (let i = 0; i < nodes.length; i++) {
    const isLast = i === nodes.length - 1
    nodes[i].options = [
      {
        id: newOptionId(),
        label: isLast ? 'Cerrar' : 'Continuar',
        nextNodeId: isLast ? null : nodes[i + 1].id,
        effect: isLast ? 'end' : 'none'
      }
    ]
  }
  return { startNodeId: nodes[0].id, nodes }
}

/** Lee (y sanea) un grafo desde un valor desconocido; migra líneas antiguas si hace falta. */
export function normalizeDialogueGraph(raw: unknown, legacyLines?: Array<{ id?: string; text: string }>): DialogueGraph {
  if (raw && typeof raw === 'object' && Array.isArray((raw as Record<string, unknown>).nodes)) {
    const obj = raw as Record<string, unknown>
    const nodes = (obj.nodes as unknown[]).map(normalizeNode)
    const startNodeId =
      typeof obj.startNodeId === 'string' && nodes.some((n) => n.id === obj.startNodeId)
        ? (obj.startNodeId as string)
        : (nodes[0]?.id ?? null)
    return { startNodeId, nodes }
  }
  if (legacyLines && legacyLines.length > 0) return buildLinearGraphFromLines(legacyLines)
  return { ...EMPTY_DIALOGUE_GRAPH }
}

export interface DialogueValidationError {
  nodeId: string
  optionId?: string
  code: 'no_start' | 'broken_link' | 'empty_text'
  message: string
}

/** Valida el grafo: nodo inicial válido, sin enlaces rotos, sin texto vacío. */
export function validateDialogueGraph(graph: DialogueGraph): DialogueValidationError[] {
  const errors: DialogueValidationError[] = []
  if (graph.nodes.length === 0) return errors
  const ids = new Set(graph.nodes.map((n) => n.id))
  if (!graph.startNodeId || !ids.has(graph.startNodeId)) {
    errors.push({ nodeId: graph.startNodeId ?? '', code: 'no_start', message: 'No hay nodo inicial válido' })
  }
  for (const node of graph.nodes) {
    if (!node.text.trim()) {
      errors.push({ nodeId: node.id, code: 'empty_text', message: 'Nodo sin texto' })
    }
    for (const option of node.options) {
      if (option.nextNodeId !== null && !ids.has(option.nextNodeId)) {
        errors.push({
          nodeId: node.id,
          optionId: option.id,
          code: 'broken_link',
          message: `La opción "${option.label}" apunta a un nodo que no existe`
        })
      }
    }
  }
  return errors
}

/** Devuelve el nodo destino y el efecto al elegir una opción. */
export function advanceDialogue(
  graph: DialogueGraph,
  optionId: string
): { nextNode: DialogueNode | null; effect: DialogueEffect } | null {
  for (const node of graph.nodes) {
    const option = node.options.find((o) => o.id === optionId)
    if (option) {
      const nextNode = option.nextNodeId ? graph.nodes.find((n) => n.id === option.nextNodeId) ?? null : null
      return { nextNode, effect: option.effect }
    }
  }
  return null
}

export function getStartNode(graph: DialogueGraph): DialogueNode | null {
  if (!graph.startNodeId) return null
  return graph.nodes.find((n) => n.id === graph.startNodeId) ?? null
}
