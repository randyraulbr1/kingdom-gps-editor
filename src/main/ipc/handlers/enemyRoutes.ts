/**
 * IPC handlers para las rutas de enemigos (polilíneas) del Editor de Mundo (doc 14).
 * Persistido en SQLite vía EnemyRouteRepository.
 */

import { ipcMain } from 'electron'
import { projectManager } from '../../projects/ProjectManager'
import { EnemyRouteRepository } from '../../worldEditor/enemyRouteRepository'
import type { CreateEnemyRouteRequest, UpdateEnemyRouteRequest } from '@shared-types/world'

function getRepository(): EnemyRouteRepository {
  return new EnemyRouteRepository(projectManager.getDb())
}

export function registerEnemyRouteHandlers(): void {
  ipcMain.handle('enemyRoutes:create', (_event, request: CreateEnemyRouteRequest) => getRepository().create(request))

  ipcMain.handle('enemyRoutes:update', (_event, request: UpdateEnemyRouteRequest) => getRepository().update(request))

  ipcMain.handle('enemyRoutes:delete', (_event, routeId: string) => getRepository().softDelete(routeId))

  ipcMain.handle('enemyRoutes:list', () => getRepository().list())
}
