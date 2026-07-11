/**
 * Primitivas de tabla de loot / recompensas (doc 22), compartidas por monstruos,
 * cofres y —en el futuro— misiones y eventos, para no duplicar la lógica de
 * probabilidad y cantidades. En producción la entrega real la calcula el
 * servidor de forma idempotente; aquí solo se modela y se simula en el editor.
 */

export interface LootEntry {
  id: string
  itemName: string
  /** Probabilidad 0..1. */
  probability: number
  minQty: number
  maxQty: number
}

export interface LootDrop {
  itemName: string
  quantity: number
}

function randomId(prefix: string): string {
  const globalCrypto = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
  if (globalCrypto?.randomUUID) return globalCrypto.randomUUID()
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export const newLootEntryId = (): string => randomId('loot')

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

/** Normaliza una fila de loot desconocida a una válida. */
export function normalizeLootEntry(raw: unknown): LootEntry {
  const obj = (raw ?? {}) as Record<string, unknown>
  const minQty = Math.max(1, Math.round(num(obj.minQty, 1)))
  const maxQty = Math.max(minQty, Math.round(num(obj.maxQty, minQty)))
  return {
    id: typeof obj.id === 'string' && obj.id ? obj.id : newLootEntryId(),
    itemName: typeof obj.itemName === 'string' ? obj.itemName : '',
    probability: Math.min(1, Math.max(0, num(obj.probability, 1))),
    minQty,
    maxQty
  }
}

/** Devuelve una cantidad entera entre min y max (inclusive) usando rng en [0,1). */
function rollQuantity(min: number, max: number, rng: () => number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

/**
 * Simula la caída de loot. `rng` permite pruebas deterministas; por defecto usa
 * Math.random. Ignora filas sin objeto asignado.
 */
export function rollLoot(loot: LootEntry[], rng: () => number = Math.random): LootDrop[] {
  const drops: LootDrop[] = []
  for (const entry of loot) {
    if (!entry.itemName.trim()) continue
    if (rng() < entry.probability) {
      drops.push({ itemName: entry.itemName, quantity: rollQuantity(entry.minQty, entry.maxQty, rng) })
    }
  }
  return drops
}

/** ¿La tabla tiene al menos una fila con objeto asignado? */
export function hasValidLoot(loot: LootEntry[]): boolean {
  return loot.some((e) => e.itemName.trim().length > 0)
}
