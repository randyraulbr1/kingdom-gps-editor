/**
 * Configuración y lógica de las rutas de enemigos (doc 14).
 *
 * La geometría (puntos) vive en la propia entidad `EnemyRoute`; la lista
 * ponderada de enemigos y los parámetros de activación/spawn se guardan en
 * `EnemyRoute.properties` y se leen/escriben aquí de forma saneada. Incluye la
 * lógica pura para longitud del trazado, selección ponderada, estimación de
 * enemigos, validación y simulación del recorrido de un jugador.
 */

import type { Position } from '@shared-types/world'
import { distanceMeters } from '../utils/geo'

export type EnemyRouteStatus = 'draft' | 'active' | 'paused' | 'disabled'
export type RouteSpawnMode = 'on_enter' | 'by_distance' | 'by_time' | 'checkpoints'

export const ROUTE_STATUS_LABELS: Record<EnemyRouteStatus, string> = {
  draft: 'Borrador',
  active: 'Activa',
  paused: 'Pausada',
  disabled: 'Desactivada'
}

export const SPAWN_MODE_LABELS: Record<RouteSpawnMode, string> = {
  on_enter: 'Al entrar en la ruta',
  by_distance: 'Por distancia recorrida',
  by_time: 'Por tiempo',
  checkpoints: 'Por puntos de control'
}

export interface EnemyRouteEntry {
  id: string
  enemyName: string
  /** Peso relativo para la selección aleatoria. */
  weight: number
  levelMin: number
  levelMax: number
  minCount: number
  maxCount: number
}

export interface EnemyRouteConfig {
  status: EnemyRouteStatus
  activationRadiusM: number
  spawnMode: RouteSpawnMode
  /** Segundos entre oleadas (modo por tiempo). */
  spawnIntervalSeconds: number
  /** Metros recorridos entre spawns (modo por distancia). */
  spawnDistanceM: number
  cooldownSeconds: number
  minPlayerLevel: number
  /** 0 = sin máximo. */
  maxPlayerLevel: number
  maxActiveEnemies: number
  entries: EnemyRouteEntry[]
}

export const DEFAULT_ROUTE_CONFIG: EnemyRouteConfig = {
  status: 'draft',
  activationRadiusM: 30,
  spawnMode: 'on_enter',
  spawnIntervalSeconds: 180,
  spawnDistanceM: 150,
  cooldownSeconds: 300,
  minPlayerLevel: 0,
  maxPlayerLevel: 0,
  maxActiveEnemies: 5,
  entries: []
}

const STATUSES: EnemyRouteStatus[] = ['draft', 'active', 'paused', 'disabled']
const MODES: RouteSpawnMode[] = ['on_enter', 'by_distance', 'by_time', 'checkpoints']

function num(value: unknown, fallback: number, min = -Infinity): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : fallback
  return Math.max(min, n)
}

function randomId(prefix: string): string {
  const globalCrypto = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
  if (globalCrypto?.randomUUID) return globalCrypto.randomUUID()
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export const newRouteEntryId = (): string => randomId('rentry')

function normalizeEntry(raw: unknown): EnemyRouteEntry {
  const obj = (raw ?? {}) as Record<string, unknown>
  const levelMin = Math.max(1, Math.round(num(obj.levelMin, 1)))
  const levelMax = Math.max(levelMin, Math.round(num(obj.levelMax, levelMin)))
  const minCount = Math.max(1, Math.round(num(obj.minCount, 1)))
  const maxCount = Math.max(minCount, Math.round(num(obj.maxCount, minCount)))
  return {
    id: typeof obj.id === 'string' && obj.id ? obj.id : newRouteEntryId(),
    enemyName: typeof obj.enemyName === 'string' ? obj.enemyName : '',
    weight: Math.max(0, num(obj.weight, 1)),
    levelMin,
    levelMax,
    minCount,
    maxCount
  }
}

export function readRouteConfig(properties: Record<string, unknown> | undefined | null): EnemyRouteConfig {
  const p = (properties ?? {}) as Record<string, unknown>
  const d = DEFAULT_ROUTE_CONFIG
  return {
    status: STATUSES.includes(p.status as EnemyRouteStatus) ? (p.status as EnemyRouteStatus) : d.status,
    activationRadiusM: Math.max(1, num(p.activationRadiusM, d.activationRadiusM)),
    spawnMode: MODES.includes(p.spawnMode as RouteSpawnMode) ? (p.spawnMode as RouteSpawnMode) : d.spawnMode,
    spawnIntervalSeconds: Math.max(1, num(p.spawnIntervalSeconds, d.spawnIntervalSeconds)),
    spawnDistanceM: Math.max(1, num(p.spawnDistanceM, d.spawnDistanceM)),
    cooldownSeconds: Math.max(0, num(p.cooldownSeconds, d.cooldownSeconds)),
    minPlayerLevel: Math.max(0, num(p.minPlayerLevel, d.minPlayerLevel)),
    maxPlayerLevel: Math.max(0, num(p.maxPlayerLevel, d.maxPlayerLevel)),
    maxActiveEnemies: Math.max(1, Math.round(num(p.maxActiveEnemies, d.maxActiveEnemies))),
    entries: Array.isArray(p.entries) ? p.entries.map(normalizeEntry) : []
  }
}

/** Devuelve las propiedades listas para persistir (la config es plana en properties). */
export function writeRouteConfig(config: EnemyRouteConfig): Record<string, unknown> {
  return { ...config }
}

/** Longitud total del trazado en metros (suma de segmentos). */
export function routeLengthMeters(points: Position[]): number {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    total += distanceMeters(points[i - 1], points[i])
  }
  return total
}

/** Selección ponderada de una entrada de enemigo. rng inyectable para pruebas. */
export function pickWeightedEntry(entries: EnemyRouteEntry[], rng: () => number = Math.random): EnemyRouteEntry | null {
  const valid = entries.filter((e) => e.enemyName.trim() && e.weight > 0)
  if (valid.length === 0) return null
  const total = valid.reduce((sum, e) => sum + e.weight, 0)
  let r = rng() * total
  for (const entry of valid) {
    r -= entry.weight
    if (r < 0) return entry
  }
  return valid[valid.length - 1]
}

/** Nº de eventos de spawn estimados al recorrer toda la ruta, según el modo. */
export function estimatedSpawnEvents(config: EnemyRouteConfig, lengthM: number): number {
  switch (config.spawnMode) {
    case 'on_enter':
      return 1
    case 'by_distance':
      return Math.max(1, Math.floor(lengthM / config.spawnDistanceM))
    case 'checkpoints':
      return Math.max(1, config.entries.length)
    case 'by_time':
      // Sin velocidad del jugador no se puede estimar por tiempo; se asume 1 por tramo.
      return 1
    default:
      return 1
  }
}

export interface RouteValidationError {
  code: 'too_few_points' | 'no_enemies' | 'invalid_level_range' | 'invalid_player_levels'
  message: string
  severity: 'error' | 'warning'
}

export function validateRoute(points: Position[], config: EnemyRouteConfig): RouteValidationError[] {
  const errors: RouteValidationError[] = []
  if (points.length < 2) {
    errors.push({ code: 'too_few_points', message: 'La ruta necesita al menos 2 puntos', severity: 'error' })
  }
  const validEntries = config.entries.filter((e) => e.enemyName.trim())
  if (validEntries.length === 0) {
    errors.push({ code: 'no_enemies', message: 'La ruta no tiene enemigos asignados', severity: 'error' })
  }
  for (const entry of validEntries) {
    if (entry.levelMin > entry.levelMax) {
      errors.push({ code: 'invalid_level_range', message: `"${entry.enemyName}": nivel mínimo mayor que el máximo`, severity: 'error' })
      break
    }
  }
  if (config.maxPlayerLevel > 0 && config.minPlayerLevel > config.maxPlayerLevel) {
    errors.push({ code: 'invalid_player_levels', message: 'El nivel mínimo del jugador supera al máximo', severity: 'error' })
  }
  return errors
}

export interface RouteSpawnEvent {
  atMeters: number
  enemyName: string
  level: number
  count: number
}

/**
 * Simula el recorrido de un jugador por la ruta y devuelve los eventos de spawn
 * que ocurrirían (doc 14, "Simular jugador"). No crea nada real. rng inyectable.
 */
export function simulateRouteRun(
  points: Position[],
  config: EnemyRouteConfig,
  rng: () => number = Math.random
): RouteSpawnEvent[] {
  const lengthM = routeLengthMeters(points)
  const events: RouteSpawnEvent[] = []
  const count = estimatedSpawnEvents(config, lengthM)
  for (let i = 0; i < count; i++) {
    const entry = pickWeightedEntry(config.entries, rng)
    if (!entry) break
    const level = entry.levelMin + Math.floor(rng() * (entry.levelMax - entry.levelMin + 1))
    const amount = entry.minCount + Math.floor(rng() * (entry.maxCount - entry.minCount + 1))
    const atMeters = count === 1 ? 0 : Math.round((lengthM / (count - 1)) * i)
    events.push({ atMeters, enemyName: entry.enemyName, level, count: amount })
  }
  return events
}
