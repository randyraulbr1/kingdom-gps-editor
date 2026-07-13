/**
 * IPC handlers para el módulo Editor de Mundo.
 * Persistido en SQLite vía WorldEntityRepository (condición 8 - nada de
 * datos de contenido solo-en-memoria). La sincronización con servidor
 * (Fase C/D) sigue pendiente; publishChanges/retryFailed/resolveConflict son
 * stubs documentados.
 */

import { ipcMain } from 'electron'
import { projectManager } from '../../projects/ProjectManager'
import { WorldEntityRepository } from '../../worldEditor/worldEntityRepository'
import { createCommandBus } from '../../commands/createCommandBus'
import { readServerConfig } from './systemExtras'
import { WorldSyncStatus } from '@shared-types/world'
import type {
  CreateWorldEntityRequest,
  UpdateWorldEntityRequest,
  MoveWorldEntityRequest,
  DeleteWorldEntityRequest,
  WorldEntityQuery,
  PublishWorldRequest,
  ConflictResolution
} from '@shared-types/world'
import type { PublishEntityResult } from '@shared-types/system'

function getRepository(): WorldEntityRepository {
  return new WorldEntityRepository(projectManager.getDb())
}

export function registerWorldEditorHandlers(): void {
  // ========== CRUD ==========

  ipcMain.handle('worldEditor:createEntity', async (_event, request: CreateWorldEntityRequest) => {
    const entity = await getRepository().create(request)
    await createCommandBus().recordWorldEntityCreate(entity)
    return entity
  })

  ipcMain.handle('worldEditor:updateEntity', async (_event, request: UpdateWorldEntityRequest) => {
    const repository = getRepository()
    const before = await repository.get(request.worldId)
    if (!before) throw new Error(`Entidad del mundo no encontrada: ${request.worldId}`)
    const after = await repository.update(request)
    await createCommandBus().recordWorldEntityUpdate(before, after)
    return after
  })

  ipcMain.handle('worldEditor:moveEntity', async (_event, request: MoveWorldEntityRequest) => {
    const repository = getRepository()
    const before = await repository.get(request.worldId)
    if (!before) throw new Error(`Entidad del mundo no encontrada: ${request.worldId}`)
    const after = await repository.move(request.worldId, request.position)
    await createCommandBus().recordWorldEntityMove(before, after)
    return after
  })

  ipcMain.handle('worldEditor:deleteEntity', async (_event, request: DeleteWorldEntityRequest) => {
    const repository = getRepository()
    const before = await repository.get(request.worldId)
    if (!before) throw new Error(`Entidad del mundo no encontrada: ${request.worldId}`)
    await repository.softDelete(request.worldId)
    await createCommandBus().recordWorldEntityDelete(before)
  })

  ipcMain.handle('worldEditor:toggleEntity', async (_event, worldId: string) => {
    const repository = getRepository()
    const before = await repository.get(worldId)
    if (!before) throw new Error(`Entidad del mundo no encontrada: ${worldId}`)
    const after = await repository.toggle(worldId)
    await createCommandBus().recordWorldEntityToggle(before, after)
    return after
  })

  ipcMain.handle('worldEditor:duplicateEntity', async (_event, worldId: string) => {
    const repository = getRepository()
    const original = await repository.get(worldId)
    if (!original) throw new Error(`Entidad del mundo no encontrada: ${worldId}`)
    const copy = await repository.duplicate(worldId)
    await createCommandBus().recordWorldEntityCreate(copy)
    return copy
  })

  // ========== QUERIES ==========

  ipcMain.handle('worldEditor:getEntity', (_event, worldId: string) => getRepository().get(worldId))

  ipcMain.handle('worldEditor:queryEntities', (_event, query: WorldEntityQuery) => getRepository().query(query))

  ipcMain.handle('worldEditor:listByType', (_event, entityType: string) => getRepository().listByType(entityType))

  // ========== ESTADO Y SINCRONIZACIÓN ==========

  ipcMain.handle('worldEditor:getPublishSummary', () => getRepository().getPublishSummary())

  ipcMain.handle('worldEditor:getSyncStatus', () => getRepository().getSyncStatus())

  // ========== Subir un pin al mundo/servidor ==========

  ipcMain.handle('worldEditor:publishEntity', async (_event, worldId: string): Promise<PublishEntityResult> => {
    const repository = getRepository()
    const entity = await repository.get(worldId)
    if (!entity) throw new Error(`Entidad del mundo no encontrada: ${worldId}`)

    const { url, token } = await readServerConfig()
    if (!url || !token) {
      const updated = await repository.setSyncStatus(worldId, WorldSyncStatus.Failed, 'Falta configurar el servidor o el token en Configuración.')
      return { ok: false, syncStatus: updated.syncStatus, message: 'Configura el servidor y el token en Configuración ▸ Servidor.' }
    }

    await repository.setSyncStatus(worldId, WorldSyncStatus.Syncing)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20_000)
    try {
      // Contrato de la doc 11/02: POST /api/v1/world/entities con Bearer token.
      const endpoint = `${url.replace(/\/$/, '')}/api/v1/world/entities`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(entity),
        signal: controller.signal
      })
      if (!response.ok) {
        const detail = response.status === 401 || response.status === 403 ? 'token inválido o sin permiso' : `${response.status} ${response.statusText}`
        const updated = await repository.setSyncStatus(worldId, WorldSyncStatus.Failed, detail)
        return { ok: false, syncStatus: updated.syncStatus, message: `El servidor rechazó la subida: ${detail}` }
      }
      const updated = await repository.setSyncStatus(worldId, WorldSyncStatus.Synced, null)
      return { ok: true, syncStatus: updated.syncStatus, message: 'Subido al mundo correctamente.' }
    } catch (error) {
      const message = error instanceof Error && error.name === 'AbortError' ? 'tiempo de espera agotado' : error instanceof Error ? error.message : String(error)
      const updated = await repository.setSyncStatus(worldId, WorldSyncStatus.Failed, message)
      return { ok: false, syncStatus: updated.syncStatus, message: `No se pudo subir: ${message}` }
    } finally {
      clearTimeout(timeout)
    }
  })

  // ========== STUBS PARA FASE C/D (sincronización remota masiva) ==========

  ipcMain.handle('worldEditor:publishChanges', async (_event, _request: PublishWorldRequest) => {
    return { published: 0, failed: 0 }
  })

  ipcMain.handle('worldEditor:retryFailed', async () => {
    return { retried: 0 }
  })

  ipcMain.handle('worldEditor:resolveConflict', async (_event, _resolution: ConflictResolution) => {
    throw new Error('Resolución de conflictos no implementada aún (Fase C/D - requiere servidor)')
  })

  ipcMain.handle('worldEditor:exportWorld', async () => {
    const repository = getRepository()
    const entities = await repository.getAllEntities()
    const bounds = entities.reduce(
      (acc, entity) => ({
        north: Math.max(acc.north, entity.position.lat),
        south: Math.min(acc.south, entity.position.lat),
        east: Math.max(acc.east, entity.position.lng),
        west: Math.min(acc.west, entity.position.lng)
      }),
      { north: -90, south: 90, east: -180, west: 180 }
    )
    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      metadata: {
        projectName: projectManager.getCurrentInfo()?.name ?? 'KingdomGPS',
        entityCount: entities.length,
        bounds: entities.length > 0 ? bounds : { north: 0, south: 0, east: 0, west: 0 }
      },
      entities,
      syncStatus: await repository.getSyncStatus()
    }
  })

  ipcMain.handle('worldEditor:clearUnsyncedChanges', async (_event, _worldIds: string[]) => {
    // Fase C: limpiar cambios pendientes tras una sincronización exitosa con el servidor.
  })
}
