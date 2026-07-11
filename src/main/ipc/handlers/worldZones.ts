/**
 * IPC handlers para las zonas (polígonos) del Editor de Mundo.
 * Persistido en SQLite vía WorldZoneRepository.
 */

import { ipcMain } from 'electron'
import { projectManager } from '../../projects/ProjectManager'
import { WorldZoneRepository } from '../../worldEditor/worldZoneRepository'
import type { CreateWorldZoneRequest, UpdateWorldZoneRequest } from '@shared-types/world'

function getRepository(): WorldZoneRepository {
  return new WorldZoneRepository(projectManager.getDb())
}

export function registerWorldZoneHandlers(): void {
  ipcMain.handle('worldZones:create', (_event, request: CreateWorldZoneRequest) => getRepository().create(request))

  ipcMain.handle('worldZones:update', (_event, request: UpdateWorldZoneRequest) => getRepository().update(request))

  ipcMain.handle('worldZones:delete', (_event, zoneId: string) => getRepository().softDelete(zoneId))

  ipcMain.handle('worldZones:list', () => getRepository().list())
}
