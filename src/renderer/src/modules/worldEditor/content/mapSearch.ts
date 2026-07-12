/**
 * Búsqueda global del mapa (doc 26).
 *
 * Localiza pines, zonas y rutas por nombre, tipo o ID interno. Es lógica pura
 * (sin React) para poder probarla; la UI usa el resultado para centrar el mapa
 * y abrir el inspector del elemento elegido.
 */

import { WorldEntityType, type WorldEntity, type WorldZone, type EnemyRoute, type Position } from '@shared-types/world'

export type SearchResultKind = 'entity' | 'zone' | 'route'

export interface SearchResult {
  kind: SearchResultKind
  id: string
  name: string
  /** Texto secundario (tipo legible, nº de puntos, etc.). */
  subtitle: string
  position?: Position
}

const ENTITY_TYPE_LABELS: Record<WorldEntityType, string> = {
  [WorldEntityType.Object]: 'Objeto',
  [WorldEntityType.Enemy]: 'Monstruo',
  [WorldEntityType.Npc]: 'NPC',
  [WorldEntityType.Chest]: 'Cofre',
  [WorldEntityType.Shop]: 'Tienda',
  [WorldEntityType.Quest]: 'Misión',
  [WorldEntityType.Resource]: 'Recurso',
  [WorldEntityType.Plant]: 'Planta',
  [WorldEntityType.Event]: 'Evento',
  [WorldEntityType.Zone]: 'Zona',
  [WorldEntityType.SpawnPoint]: 'Punto de spawn',
  [WorldEntityType.Building]: 'Construcción',
  [WorldEntityType.Teleporter]: 'Teletransportador',
  [WorldEntityType.Marker]: 'Pin'
}

export function entityTypeLabel(type: WorldEntityType): string {
  return ENTITY_TYPE_LABELS[type] ?? type
}

export interface SearchWorldInput {
  entities: WorldEntity[]
  zones: WorldZone[]
  routes: EnemyRoute[]
}

/**
 * Busca en todo el mundo. Coincide por nombre (subcadena, sin distinguir
 * mayúsculas), por ID exacto y por el nombre del tipo de entidad. Devuelve como
 * máximo `limit` resultados (por defecto 20).
 */
export function searchWorld(query: string, input: SearchWorldInput, limit = 20): SearchResult[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const results: SearchResult[] = []

  const matches = (haystack: string): boolean => haystack.toLowerCase().includes(q)

  for (const e of input.entities) {
    const typeLabel = entityTypeLabel(e.entityType)
    if (matches(e.name) || e.worldId.toLowerCase() === q || matches(typeLabel)) {
      results.push({
        kind: 'entity',
        id: e.worldId,
        name: e.name,
        subtitle: typeLabel,
        position: e.position
      })
    }
    if (results.length >= limit) return results
  }

  for (const z of input.zones) {
    if (matches(z.name) || z.zoneId.toLowerCase() === q || matches('zona')) {
      results.push({ kind: 'zone', id: z.zoneId, name: z.name || '(zona sin nombre)', subtitle: 'Zona', position: z.points[0] })
    }
    if (results.length >= limit) return results
  }

  for (const r of input.routes) {
    if (matches(r.name) || r.routeId.toLowerCase() === q || matches('ruta')) {
      results.push({ kind: 'route', id: r.routeId, name: r.name || '(ruta sin nombre)', subtitle: 'Ruta de enemigos', position: r.points[0] })
    }
    if (results.length >= limit) return results
  }

  return results
}
