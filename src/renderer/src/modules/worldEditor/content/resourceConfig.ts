/**
 * Configuración de un recurso recolectable en el mapa (doc 23).
 *
 * Se guarda en `WorldEntity.properties.resource`. Cubre la fase local del editor:
 * cantidades, radio, respawn, herramienta/nivel requeridos, modo de disponibilidad
 * y un simulador de recolección. La validación real (distancia, inventario, doble
 * entrega) la hace el servidor en fases posteriores.
 */

export type ResourceCategory = 'wood' | 'stone' | 'ore' | 'plant' | 'water' | 'food' | 'other'
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
/** Modos de disponibilidad (doc 23). */
export type AvailabilityMode = 'personal' | 'shared' | 'group' | 'single'

export const RESOURCE_CATEGORY_LABELS: Record<ResourceCategory, string> = {
  wood: 'Madera',
  stone: 'Piedra',
  ore: 'Mineral',
  plant: 'Planta',
  water: 'Agua',
  food: 'Comida',
  other: 'Otro'
}

export const RARITY_LABELS: Record<Rarity, string> = {
  common: 'Común',
  uncommon: 'Poco común',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Legendario'
}

export const AVAILABILITY_LABELS: Record<AvailabilityMode, string> = {
  personal: 'Personal (estado por jugador)',
  shared: 'Compartido (desaparece para todos)',
  group: 'Por grupo cercano',
  single: 'Uso único (permanente)'
}

export interface ResourceConfig {
  resourceName: string
  category: ResourceCategory
  rarity: Rarity
  minQty: number
  maxQty: number
  /** Probabilidad de obtención 0..1. */
  probability: number
  /** Herramienta requerida (nombre); '' = ninguna. */
  requiredTool: string
  minLevel: number
  gatherSeconds: number
  respawnSeconds: number
  interactionRadiusM: number
  /** Máximo de recolecciones por jugador antes de agotarse; 0 = ilimitado. */
  maxUses: number
  availabilityMode: AvailabilityMode
}

export const DEFAULT_RESOURCE_CONFIG: ResourceConfig = {
  resourceName: '',
  category: 'wood',
  rarity: 'common',
  minQty: 1,
  maxQty: 1,
  probability: 1,
  requiredTool: '',
  minLevel: 0,
  gatherSeconds: 3,
  respawnSeconds: 300,
  interactionRadiusM: 20,
  maxUses: 0,
  availabilityMode: 'personal'
}

const CATEGORIES: ResourceCategory[] = ['wood', 'stone', 'ore', 'plant', 'water', 'food', 'other']
const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']
const MODES: AvailabilityMode[] = ['personal', 'shared', 'group', 'single']

function num(value: unknown, fallback: number, min = -Infinity): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : fallback
  return Math.max(min, n)
}

export function readResourceConfig(properties: Record<string, unknown> | undefined | null): ResourceConfig {
  const r = (properties?.resource ?? {}) as Record<string, unknown>
  const d = DEFAULT_RESOURCE_CONFIG
  const minQty = Math.max(1, Math.round(num(r.minQty, d.minQty, 1)))
  return {
    resourceName: typeof r.resourceName === 'string' ? r.resourceName : '',
    category: CATEGORIES.includes(r.category as ResourceCategory) ? (r.category as ResourceCategory) : d.category,
    rarity: RARITIES.includes(r.rarity as Rarity) ? (r.rarity as Rarity) : d.rarity,
    minQty,
    maxQty: Math.max(minQty, Math.round(num(r.maxQty, minQty))),
    probability: Math.min(1, Math.max(0, num(r.probability, d.probability))),
    requiredTool: typeof r.requiredTool === 'string' ? r.requiredTool : '',
    minLevel: Math.max(0, num(r.minLevel, d.minLevel)),
    gatherSeconds: Math.max(0, num(r.gatherSeconds, d.gatherSeconds)),
    respawnSeconds: Math.max(0, num(r.respawnSeconds, d.respawnSeconds)),
    interactionRadiusM: Math.max(1, num(r.interactionRadiusM, d.interactionRadiusM)),
    maxUses: Math.max(0, Math.round(num(r.maxUses, d.maxUses))),
    availabilityMode: MODES.includes(r.availabilityMode as AvailabilityMode) ? (r.availabilityMode as AvailabilityMode) : d.availabilityMode
  }
}

export function writeResourceConfig(
  properties: Record<string, unknown> | undefined | null,
  config: ResourceConfig
): Record<string, unknown> {
  return { ...(properties ?? {}), resource: config }
}

export interface ResourceValidationError {
  code: 'no_resource_name' | 'invalid_qty' | 'invalid_respawn' | 'radius_too_small'
  message: string
}

/** Valida la config del recurso (doc 23). `gpsToleranceM` opcional para el radio mínimo. */
export function validateResourceConfig(config: ResourceConfig, gpsToleranceM = 10): ResourceValidationError[] {
  const errors: ResourceValidationError[] = []
  if (!config.resourceName.trim()) {
    errors.push({ code: 'no_resource_name', message: 'El pin no tiene recurso asignado' })
  }
  if (config.minQty > config.maxQty) {
    errors.push({ code: 'invalid_qty', message: 'La cantidad mínima supera a la máxima' })
  }
  if (config.availabilityMode !== 'single' && config.respawnSeconds <= 0) {
    errors.push({ code: 'invalid_respawn', message: 'El tiempo de respawn debe ser mayor que 0 (salvo uso único)' })
  }
  if (config.interactionRadiusM < gpsToleranceM) {
    errors.push({ code: 'radius_too_small', message: `El radio (${config.interactionRadiusM} m) es menor que la tolerancia GPS (${gpsToleranceM} m)` })
  }
  return errors
}

export interface GatherSimInput {
  distanceM: number
  interactionRadiusM: number
  playerLevel: number
  minLevel: number
  requiredTool: string
  hasRequiredTool: boolean
  inventoryFull: boolean
  usesLeft: number // -1 = ilimitado
}

export type GatherSimResult =
  | { ok: true; quantity: number; message: string }
  | { ok: false; reason: 'out_of_range' | 'insufficient_level' | 'missing_tool' | 'inventory_full' | 'exhausted'; message: string }

/**
 * Simula la recolección del recurso en el editor (doc 23). `rng` inyectable para
 * pruebas deterministas. No modifica inventario real.
 */
export function simulateGather(config: ResourceConfig, input: GatherSimInput, rng: () => number = Math.random): GatherSimResult {
  if (input.distanceM > input.interactionRadiusM) {
    const falta = Math.ceil(input.distanceM - input.interactionRadiusM)
    return { ok: false, reason: 'out_of_range', message: `Fuera de rango: acércate ${falta} m` }
  }
  if (input.playerLevel < input.minLevel) {
    return { ok: false, reason: 'insufficient_level', message: `Nivel insuficiente (requiere ${input.minLevel})` }
  }
  if (input.requiredTool.trim() && !input.hasRequiredTool) {
    return { ok: false, reason: 'missing_tool', message: `Necesitas: ${input.requiredTool}` }
  }
  if (input.usesLeft === 0) {
    return { ok: false, reason: 'exhausted', message: 'Recurso agotado' }
  }
  if (input.inventoryFull) {
    return { ok: false, reason: 'inventory_full', message: 'Inventario lleno' }
  }
  // Cantidad obtenida (respeta probabilidad de obtención).
  if (rng() >= config.probability) {
    return { ok: true, quantity: 0, message: 'No se obtuvo nada esta vez' }
  }
  const quantity = config.minQty + Math.floor(rng() * (config.maxQty - config.minQty + 1))
  return { ok: true, quantity, message: `Recolectado: ${config.resourceName || 'recurso'} ×${quantity}` }
}
