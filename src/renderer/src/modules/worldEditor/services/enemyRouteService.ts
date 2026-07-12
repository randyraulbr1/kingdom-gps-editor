/**
 * Servicio del renderer para las rutas de enemigos (polilíneas) del Editor de
 * Mundo (doc 14). Envuelve window.api.enemyRoutes.
 */

import type { EnemyRoute, CreateEnemyRouteRequest, UpdateEnemyRouteRequest } from '@shared-types/world'

function getApi() {
  if (!window.api?.enemyRoutes) {
    throw new Error('enemyRoutes API no está disponible. ¿Estás en el renderer?')
  }
  return window.api.enemyRoutes
}

export class EnemyRouteService {
  static async create(request: CreateEnemyRouteRequest): Promise<EnemyRoute> {
    return getApi().create(request)
  }

  static async update(request: UpdateEnemyRouteRequest): Promise<EnemyRoute> {
    return getApi().update(request)
  }

  static async delete(routeId: string): Promise<void> {
    return getApi().delete(routeId)
  }

  static async list(): Promise<EnemyRoute[]> {
    return getApi().list()
  }
}
