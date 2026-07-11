/**
 * Configuración de un enemigo/monstruo asociado a un pin del mapa (doc 21).
 *
 * Se guarda dentro de `WorldEntity.properties.enemy`. Cubre la fase local del
 * editor: estadísticas, distancias GPS, tabla de loot simple, parámetros de
 * spawn, IA de cuatro estados y simuladores. La entrega real de recompensas y
 * el combate compartido son responsabilidad del servidor (fase posterior).
 */

import { normalizeLootEntry, newLootEntryId, rollLoot, type LootEntry, type LootDrop } from './lootTable'

// Reexportados para conservar la API previa (monstruos comparten las primitivas de loot).
export { newLootEntryId, rollLoot }
export type { LootEntry, LootDrop }

export type EnemyCategory = 'beast' | 'undead' | 'humanoid' | 'elemental' | 'boss' | 'other'

export const ENEMY_CATEGORY_LABELS: Record<EnemyCategory, string> = {
  beast: 'Bestia',
  undead: 'No-muerto',
  humanoid: 'Humanoide',
  elemental: 'Elemental',
  boss: 'Jefe',
  other: 'Otro'
}

export interface EnemyStats {
  level: number
  hp: number
  damage: number
  defense: number
  speed: number
  xp: number
}

/** Distancias GPS en metros que gobiernan la IA (doc 21). */
export interface EnemyGpsRanges {
  visibleRadiusM: number
  visionRadiusM: number
  pursuitRadiusM: number
  attackRadiusM: number
  returnRadiusM: number
  gpsToleranceM: number
}

export interface EnemySpawnConfig {
  spawnMinSeconds: number
  spawnMaxSeconds: number
  minEnemyCount: number
  maxEnemyCount: number
  maxActiveEnemies: number
  sharedRadiusM: number
  cooldownSeconds: number
}

export interface EnemyConfig {
  enemyName: string
  category: EnemyCategory
  stats: EnemyStats
  gps: EnemyGpsRanges
  loot: LootEntry[]
  spawn: EnemySpawnConfig
}

/** Estados de la IA inicial (doc 21). */
export type EnemyAiState = 'idle' | 'chasing' | 'attacking' | 'returning'

export const ENEMY_AI_STATE_LABELS: Record<EnemyAiState, string> = {
  idle: 'Quieto',
  chasing: 'Persiguiendo',
  attacking: 'Atacando',
  returning: 'Regresando'
}

export const DEFAULT_ENEMY_CONFIG: EnemyConfig = {
  enemyName: '',
  category: 'beast',
  stats: { level: 1, hp: 100, damage: 10, defense: 0, speed: 1, xp: 20 },
  gps: {
    visibleRadiusM: 150,
    visionRadiusM: 100,
    pursuitRadiusM: 250,
    attackRadiusM: 40,
    returnRadiusM: 300,
    gpsToleranceM: 20
  },
  loot: [],
  spawn: {
    spawnMinSeconds: 30,
    spawnMaxSeconds: 120,
    minEnemyCount: 1,
    maxEnemyCount: 3,
    maxActiveEnemies: 5,
    sharedRadiusM: 500,
    cooldownSeconds: 60
  }
}

const CATEGORIES: EnemyCategory[] = ['beast', 'undead', 'humanoid', 'elemental', 'boss', 'other']

function num(value: unknown, fallback: number, min = -Infinity): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : fallback
  return Math.max(min, n)
}

export function readEnemyConfig(properties: Record<string, unknown> | undefined | null): EnemyConfig {
  const e = (properties?.enemy ?? {}) as Record<string, unknown>
  const stats = (e.stats ?? {}) as Record<string, unknown>
  const gps = (e.gps ?? {}) as Record<string, unknown>
  const spawn = (e.spawn ?? {}) as Record<string, unknown>
  const d = DEFAULT_ENEMY_CONFIG
  return {
    enemyName: typeof e.enemyName === 'string' ? e.enemyName : '',
    category: CATEGORIES.includes(e.category as EnemyCategory) ? (e.category as EnemyCategory) : d.category,
    stats: {
      level: Math.max(1, Math.round(num(stats.level, d.stats.level, 1))),
      hp: num(stats.hp, d.stats.hp, 1),
      damage: num(stats.damage, d.stats.damage, 0),
      defense: num(stats.defense, d.stats.defense, 0),
      speed: num(stats.speed, d.stats.speed, 0),
      xp: num(stats.xp, d.stats.xp, 0)
    },
    gps: {
      visibleRadiusM: num(gps.visibleRadiusM, d.gps.visibleRadiusM, 0),
      visionRadiusM: num(gps.visionRadiusM, d.gps.visionRadiusM, 0),
      pursuitRadiusM: num(gps.pursuitRadiusM, d.gps.pursuitRadiusM, 0),
      attackRadiusM: num(gps.attackRadiusM, d.gps.attackRadiusM, 0),
      returnRadiusM: num(gps.returnRadiusM, d.gps.returnRadiusM, 0),
      gpsToleranceM: num(gps.gpsToleranceM, d.gps.gpsToleranceM, 0)
    },
    loot: Array.isArray(e.loot) ? e.loot.map(normalizeLootEntry) : [],
    spawn: {
      spawnMinSeconds: num(spawn.spawnMinSeconds, d.spawn.spawnMinSeconds, 0),
      spawnMaxSeconds: num(spawn.spawnMaxSeconds, d.spawn.spawnMaxSeconds, 0),
      minEnemyCount: Math.max(1, Math.round(num(spawn.minEnemyCount, d.spawn.minEnemyCount, 1))),
      maxEnemyCount: Math.max(1, Math.round(num(spawn.maxEnemyCount, d.spawn.maxEnemyCount, 1))),
      maxActiveEnemies: Math.max(1, Math.round(num(spawn.maxActiveEnemies, d.spawn.maxActiveEnemies, 1))),
      sharedRadiusM: num(spawn.sharedRadiusM, d.spawn.sharedRadiusM, 0),
      cooldownSeconds: num(spawn.cooldownSeconds, d.spawn.cooldownSeconds, 0)
    }
  }
}

export function writeEnemyConfig(
  properties: Record<string, unknown> | undefined | null,
  config: EnemyConfig
): Record<string, unknown> {
  return { ...(properties ?? {}), enemy: config }
}

export interface EnemyValidationError {
  code:
    | 'no_enemy_name'
    | 'invalid_level'
    | 'attack_gt_pursuit'
    | 'vision_gt_pursuit'
    | 'invalid_spawn_times'
    | 'invalid_counts'
    | 'loot_missing_item'
  message: string
  severity: 'error' | 'warning'
}

/** Valida la config del enemigo (doc 21). */
export function validateEnemyConfig(config: EnemyConfig): EnemyValidationError[] {
  const errors: EnemyValidationError[] = []
  if (!config.enemyName.trim()) {
    errors.push({ code: 'no_enemy_name', message: 'El enemigo no tiene nombre asignado', severity: 'error' })
  }
  if (config.stats.level < 1) {
    errors.push({ code: 'invalid_level', message: 'El nivel debe ser al menos 1', severity: 'error' })
  }
  if (config.gps.attackRadiusM > config.gps.pursuitRadiusM) {
    errors.push({ code: 'attack_gt_pursuit', message: 'El radio de ataque no puede ser mayor que el de persecución', severity: 'error' })
  }
  if (config.gps.visionRadiusM > config.gps.pursuitRadiusM) {
    errors.push({ code: 'vision_gt_pursuit', message: 'La visión es mayor que la persecución (confirma que es intencional)', severity: 'warning' })
  }
  if (config.spawn.spawnMinSeconds > config.spawn.spawnMaxSeconds) {
    errors.push({ code: 'invalid_spawn_times', message: 'El tiempo mínimo de aparición supera al máximo', severity: 'error' })
  }
  if (config.spawn.minEnemyCount > config.spawn.maxEnemyCount) {
    errors.push({ code: 'invalid_counts', message: 'La cantidad mínima de enemigos supera a la máxima', severity: 'error' })
  }
  for (const entry of config.loot) {
    if (!entry.itemName.trim()) {
      errors.push({ code: 'loot_missing_item', message: 'Hay una fila de loot sin objeto asignado', severity: 'error' })
      break
    }
  }
  return errors
}

/**
 * Transición de la IA según la distancia del jugador (doc 21). Usa la tolerancia
 * GPS como histéresis: solo cambia de estado si la distancia supera el umbral
 * más/menos la tolerancia, para no oscilar por imprecisión del GPS.
 */
export function nextEnemyState(current: EnemyAiState, distanceM: number, gps: EnemyGpsRanges): EnemyAiState {
  const t = gps.gpsToleranceM
  // Fuera del radio de regreso: siempre vuelve al origen.
  if (distanceM > gps.returnRadiusM + t) {
    return current === 'idle' ? 'idle' : 'returning'
  }
  // Dentro del radio de ataque: ataca.
  if (distanceM <= gps.attackRadiusM) {
    return 'attacking'
  }
  // Dentro de persecución: persigue (o mantiene ataque si estaba justo en el borde).
  if (distanceM <= gps.pursuitRadiusM - t) {
    // Solo empieza a perseguir si detecta (visión) o si ya estaba activo.
    if (current === 'chasing' || current === 'attacking') return 'chasing'
    if (distanceM <= gps.visionRadiusM) return 'chasing'
    return current === 'returning' ? 'returning' : 'idle'
  }
  // Entre persecución y regreso: si venía persiguiendo, regresa.
  if (current === 'chasing' || current === 'attacking') return 'returning'
  return current
}
