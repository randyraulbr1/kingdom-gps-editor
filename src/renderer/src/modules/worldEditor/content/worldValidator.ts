/**
 * Validador central del mundo (doc 24).
 *
 * Reúne en una sola lista los avisos de todas las entidades, zonas y rutas,
 * reutilizando los validadores por tipo. Clasifica cada aviso en error crítico,
 * advertencia o información, y aporta la posición para poder "ir al elemento".
 * No publica nada: solo diagnostica. La corrección automática, el versionado y
 * el rollback son fases posteriores.
 */

import { WorldEntityType, type WorldEntity, type WorldZone, type EnemyRoute, type Position } from '@shared-types/world'
import { readShopConfig, validateShopConfig } from './shopConfig'
import { readNpcConfig, validateNpcReferences } from './npcConfig'
import { readEnemyConfig, validateEnemyConfig } from './enemyConfig'
import { readChestConfig, validateChestConfig } from './chestConfig'
import { readResourceConfig, validateResourceConfig } from './resourceConfig'
import { readRouteConfig, validateRoute } from './enemyRoute'

export type IssueSeverity = 'error' | 'warning' | 'info'
export type IssueTargetKind = 'entity' | 'zone' | 'route'

export interface ValidationIssue {
  id: string
  severity: IssueSeverity
  /** Módulo legible (Tienda, NPC, Ruta, Zona, Mapa…). */
  module: string
  targetKind: IssueTargetKind
  targetId: string
  targetName: string
  message: string
  position?: Position
}

export interface WorldValidationSummary {
  errors: number
  warnings: number
  info: number
  /** Nº total de elementos revisados (entidades + zonas + rutas). */
  reviewed: number
  /** Porcentaje de elementos sin error crítico. */
  validPercent: number
  issues: ValidationIssue[]
}

const ENTITY_TYPE_LABELS: Partial<Record<WorldEntityType, string>> = {
  [WorldEntityType.Shop]: 'Tienda',
  [WorldEntityType.Npc]: 'NPC',
  [WorldEntityType.Enemy]: 'Monstruo',
  [WorldEntityType.Chest]: 'Cofre',
  [WorldEntityType.Resource]: 'Recurso',
  [WorldEntityType.Object]: 'Objeto',
  [WorldEntityType.Marker]: 'Pin',
  [WorldEntityType.Quest]: 'Misión',
  [WorldEntityType.Event]: 'Evento'
}

function isValidPosition(p: Position): boolean {
  return (
    typeof p?.lat === 'number' &&
    typeof p?.lng === 'number' &&
    p.lat >= -90 &&
    p.lat <= 90 &&
    p.lng >= -180 &&
    p.lng <= 180
  )
}

export interface ValidateWorldInput {
  entities: WorldEntity[]
  zones: WorldZone[]
  routes: EnemyRoute[]
}

/** Analiza todo el mundo y devuelve el resumen de validación (doc 24). */
export function validateWorld(input: ValidateWorldInput): WorldValidationSummary {
  const issues: ValidationIssue[] = []
  const existingWorldIds = new Set(input.entities.map((e) => e.worldId))
  let seq = 0
  const push = (
    severity: IssueSeverity,
    module: string,
    targetKind: IssueTargetKind,
    targetId: string,
    targetName: string,
    message: string,
    position?: Position
  ): void => {
    issues.push({ id: `iss_${seq++}`, severity, module, targetKind, targetId, targetName, message, position })
  }

  // ---- Detección de pines duplicados (misma posición + tipo + referencia) ----
  const seen = new Map<string, string>()
  for (const e of input.entities) {
    const key = `${e.entityType}|${e.position.lat.toFixed(6)}|${e.position.lng.toFixed(6)}|${e.entityId ?? ''}`
    if (seen.has(key)) {
      push('warning', 'Mapa', 'entity', e.worldId, e.name, 'Pin duplicado en la misma posición y con la misma referencia', e.position)
    } else {
      seen.set(key, e.worldId)
    }
  }

  // ---- Validación por entidad ----
  for (const e of input.entities) {
    const module = ENTITY_TYPE_LABELS[e.entityType] ?? 'Pin'
    if (!isValidPosition(e.position)) {
      push('error', 'Mapa', 'entity', e.worldId, e.name, 'Coordenadas inválidas', e.position)
    }

    switch (e.entityType) {
      case WorldEntityType.Shop:
        for (const err of validateShopConfig(readShopConfig(e.properties))) {
          push('error', module, 'entity', e.worldId, e.name, err.message, e.position)
        }
        break
      case WorldEntityType.Npc:
        for (const err of validateNpcReferences(readNpcConfig(e.properties), existingWorldIds)) {
          push('error', module, 'entity', e.worldId, e.name, err.message, e.position)
        }
        break
      case WorldEntityType.Enemy:
        for (const err of validateEnemyConfig(readEnemyConfig(e.properties))) {
          push(err.severity, module, 'entity', e.worldId, e.name, err.message, e.position)
        }
        break
      case WorldEntityType.Chest:
        for (const err of validateChestConfig(readChestConfig(e.properties), existingWorldIds)) {
          push('error', module, 'entity', e.worldId, e.name, err.message, e.position)
        }
        break
      case WorldEntityType.Resource:
        for (const err of validateResourceConfig(readResourceConfig(e.properties))) {
          push('error', module, 'entity', e.worldId, e.name, err.message, e.position)
        }
        break
      default:
        break
    }
  }

  // ---- Zonas ----
  for (const z of input.zones) {
    const center = z.points[0]
    if (z.points.length < 3) {
      push('error', 'Zona', 'zone', z.zoneId, z.name, 'La zona tiene menos de 3 puntos (polígono inválido)', center)
    }
    if (!z.name.trim()) {
      push('warning', 'Zona', 'zone', z.zoneId, z.name || '(sin nombre)', 'La zona no tiene nombre', center)
    }
  }

  // ---- Rutas de enemigos ----
  for (const r of input.routes) {
    const center = r.points[0]
    for (const err of validateRoute(r.points, readRouteConfig(r.properties))) {
      push(err.severity, 'Ruta', 'route', r.routeId, r.name, err.message, center)
    }
  }

  const errors = issues.filter((i) => i.severity === 'error').length
  const warnings = issues.filter((i) => i.severity === 'warning').length
  const info = issues.filter((i) => i.severity === 'info').length
  const reviewed = input.entities.length + input.zones.length + input.routes.length
  const targetsWithError = new Set(issues.filter((i) => i.severity === 'error').map((i) => i.targetId))
  const validPercent = reviewed > 0 ? Math.round((100 * (reviewed - targetsWithError.size)) / reviewed) : 100

  return { errors, warnings, info, reviewed, validPercent, issues }
}
