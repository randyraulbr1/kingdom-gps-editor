/**
 * Configuración de un cofre / recompensa en el mapa (doc 22).
 *
 * Se guarda en `WorldEntity.properties.chest`. Reutiliza las primitivas de
 * `lootTable.ts` (mismas tablas que los monstruos) y añade monedas, experiencia
 * y los parámetros propios del cofre: radio, nivel, misión requerida, reaparición,
 * uso único/repetible y reparto personal/compartido. La entrega real y el bloqueo
 * de doble apertura los hace el servidor; aquí se modela y se simula.
 */

import {
  normalizeLootEntry,
  rollLoot,
  hasValidLoot,
  type LootEntry,
  type LootDrop
} from './lootTable'

export type RewardSharing = 'personal' | 'shared'

export const REWARD_SHARING_LABELS: Record<RewardSharing, string> = {
  personal: 'Personal (cada jugador el suyo)',
  shared: 'Compartida (un objeto para el grupo)'
}

export interface ChestConfig {
  /** Radio de interacción GPS en metros. */
  interactionRadiusM: number
  minLevel: number
  /** worldId de un pin de misión requerido, o null. */
  requiredQuestWorldId: string | null
  /** true = un solo uso; false = repetible con reaparición. */
  singleUse: boolean
  /** Segundos hasta reaparecer (solo si repetible). */
  respawnSeconds: number
  sharing: RewardSharing
  minCoins: number
  maxCoins: number
  minXp: number
  maxXp: number
  loot: LootEntry[]
}

export const DEFAULT_CHEST_CONFIG: ChestConfig = {
  interactionRadiusM: 20,
  minLevel: 0,
  requiredQuestWorldId: null,
  singleUse: true,
  respawnSeconds: 300,
  sharing: 'personal',
  minCoins: 0,
  maxCoins: 0,
  minXp: 0,
  maxXp: 0,
  loot: []
}

const SHARINGS: RewardSharing[] = ['personal', 'shared']

function num(value: unknown, fallback: number, min = -Infinity): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : fallback
  return Math.max(min, n)
}

export function readChestConfig(properties: Record<string, unknown> | undefined | null): ChestConfig {
  const c = (properties?.chest ?? {}) as Record<string, unknown>
  const d = DEFAULT_CHEST_CONFIG
  const minCoins = num(c.minCoins, d.minCoins, 0)
  const minXp = num(c.minXp, d.minXp, 0)
  return {
    interactionRadiusM: Math.max(1, num(c.interactionRadiusM, d.interactionRadiusM)),
    minLevel: Math.max(0, num(c.minLevel, d.minLevel)),
    requiredQuestWorldId: typeof c.requiredQuestWorldId === 'string' ? c.requiredQuestWorldId : null,
    singleUse: typeof c.singleUse === 'boolean' ? c.singleUse : d.singleUse,
    respawnSeconds: Math.max(0, num(c.respawnSeconds, d.respawnSeconds)),
    sharing: SHARINGS.includes(c.sharing as RewardSharing) ? (c.sharing as RewardSharing) : d.sharing,
    minCoins,
    maxCoins: Math.max(minCoins, num(c.maxCoins, minCoins)),
    minXp,
    maxXp: Math.max(minXp, num(c.maxXp, minXp)),
    loot: Array.isArray(c.loot) ? c.loot.map(normalizeLootEntry) : []
  }
}

export function writeChestConfig(
  properties: Record<string, unknown> | undefined | null,
  config: ChestConfig
): Record<string, unknown> {
  return { ...(properties ?? {}), chest: config }
}

export interface ChestValidationError {
  code: 'empty_table' | 'invalid_coins' | 'invalid_xp' | 'loot_missing_item' | 'missing_quest_target'
  message: string
}

/** Valida la config del cofre (doc 22). */
export function validateChestConfig(config: ChestConfig, existingWorldIds?: ReadonlySet<string>): ChestValidationError[] {
  const errors: ChestValidationError[] = []
  const hasCoins = config.maxCoins > 0
  const hasXp = config.maxXp > 0
  if (!hasValidLoot(config.loot) && !hasCoins && !hasXp) {
    errors.push({ code: 'empty_table', message: 'El cofre no entrega nada: añade objetos, monedas o experiencia' })
  }
  if (config.minCoins > config.maxCoins) {
    errors.push({ code: 'invalid_coins', message: 'Las monedas mínimas superan a las máximas' })
  }
  if (config.minXp > config.maxXp) {
    errors.push({ code: 'invalid_xp', message: 'La experiencia mínima supera a la máxima' })
  }
  for (const entry of config.loot) {
    if (!entry.itemName.trim()) {
      errors.push({ code: 'loot_missing_item', message: 'Hay una fila de loot sin objeto asignado' })
      break
    }
  }
  if (config.requiredQuestWorldId && existingWorldIds && !existingWorldIds.has(config.requiredQuestWorldId)) {
    errors.push({ code: 'missing_quest_target', message: 'La misión requerida apunta a un pin que ya no existe' })
  }
  return errors
}

export interface ChestOpenSimInput {
  distanceM: number
  interactionRadiusM: number
  playerLevel: number
  minLevel: number
  alreadyOpened: boolean
  singleUse: boolean
}

export type ChestOpenSimResult =
  | { ok: true; message: string }
  | { ok: false; reason: 'out_of_range' | 'insufficient_level' | 'already_opened'; message: string }

/** Simula la apertura del cofre en el editor (doc 22). No entrega nada real. */
export function simulateOpenChest(input: ChestOpenSimInput): ChestOpenSimResult {
  if (input.distanceM > input.interactionRadiusM) {
    const falta = Math.ceil(input.distanceM - input.interactionRadiusM)
    return { ok: false, reason: 'out_of_range', message: `Fuera de rango: acércate ${falta} m` }
  }
  if (input.playerLevel < input.minLevel) {
    return { ok: false, reason: 'insufficient_level', message: `Nivel insuficiente (requiere ${input.minLevel})` }
  }
  if (input.singleUse && input.alreadyOpened) {
    return { ok: false, reason: 'already_opened', message: 'Cofre de un solo uso: ya fue abierto' }
  }
  return { ok: true, message: 'Cofre abierto' }
}

export interface ChestRewardRoll {
  items: LootDrop[]
  coins: number
  xp: number
}

/** Calcula una recompensa del cofre (objetos + monedas + experiencia). rng inyectable. */
export function rollChestReward(config: ChestConfig, rng: () => number = Math.random): ChestRewardRoll {
  const coins = config.maxCoins > 0 ? config.minCoins + Math.floor(rng() * (config.maxCoins - config.minCoins + 1)) : 0
  const xp = config.maxXp > 0 ? config.minXp + Math.floor(rng() * (config.maxXp - config.minXp + 1)) : 0
  return { items: rollLoot(config.loot, rng), coins, xp }
}
