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
import { apiFetch, ServerError } from '../../server/gameServer'
import { buildEntityData } from '../../server/worldPayload'
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
import { WorldEntityType } from '@shared-types/world'

function getRepository(): WorldEntityRepository {
  return new WorldEntityRepository(projectManager.getDb())
}

/**
 * Mapa de tipos del editor -> tipos que acepta el servidor del juego
 * (`/api/player/world/upsert`, campos: item|enemy|treasure|shop|mission|chest).
 * Los tipos sin equivalente en el juego (NPC, evento, marcador) devuelven null
 * y se informan claramente en vez de mandar un `type` que el servidor rechaza.
 */
const GAME_TYPE_BY_ENTITY: Partial<Record<WorldEntityType, string>> = {
  [WorldEntityType.Object]: 'item',
  [WorldEntityType.Enemy]: 'enemy',
  [WorldEntityType.Chest]: 'chest',
  [WorldEntityType.Shop]: 'shop',
  [WorldEntityType.Quest]: 'mission',
  [WorldEntityType.Resource]: 'treasure'
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

    // El servidor del juego solo acepta ciertos tipos; si no hay equivalente lo decimos claro.
    const gameType = GAME_TYPE_BY_ENTITY[entity.entityType]
    if (!gameType) {
      const detail = `el juego no acepta pines de tipo "${entity.entityType}" (solo objeto, enemigo, cofre, tienda, misión y recurso)`
      const updated = await repository.setSyncStatus(worldId, WorldSyncStatus.Failed, detail)
      return { ok: false, syncStatus: updated.syncStatus, message: `No se pudo subir: ${detail}.` }
    }

    await repository.setSyncStatus(worldId, WorldSyncStatus.Syncing)
    try {
      // Contrato real del juego (server/routes/playerRoutes.js -> /api/player/world/upsert):
      // POST { id, type, x=lat, y=lng, data }. La autenticación es automática
      // (server/gameServer inicia sesión con las credenciales de admin guardadas).
      const lat = entity.position.lat
      const lng = entity.position.lng
      const data = buildEntityData(entity, gameType, lat, lng)
      await apiFetch('/api/player/world/upsert', {
        method: 'POST',
        body: { id: entity.worldId, type: gameType, x: lat, y: lng, data }
      })
      const updated = await repository.setSyncStatus(worldId, WorldSyncStatus.Synced, null)
      return { ok: true, syncStatus: updated.syncStatus, message: 'Subido al mundo correctamente (ya sale en el juego).' }
    } catch (error) {
      const message = error instanceof ServerError ? error.message : error instanceof Error ? error.message : String(error)
      const updated = await repository.setSyncStatus(worldId, WorldSyncStatus.Failed, message)
      return { ok: false, syncStatus: updated.syncStatus, message: `No se pudo subir: ${message}` }
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
