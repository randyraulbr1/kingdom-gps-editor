/**
 * Servicio que comunica el renderer con los handlers de worldEditor del main process.
 * Envuelve las llamadas a window.api.worldEditor en una abstracción limpia.
 */

import type {
  WorldEntity,
  CreateWorldEntityRequest,
  UpdateWorldEntityRequest,
  MoveWorldEntityRequest,
  DeleteWorldEntityRequest,
  WorldEntityQuery,
  PublishWorldRequest,
  PublishWorldSummary,
  WorldSyncStatus_Response,
  WorldExportData,
  ConflictResolution
} from '@shared-types/world'

/**
 * Obtener la API de worldEditor de manera segura.
 * En desarrollo: usa window.api si está disponible.
 * En tests: puede ser mocked.
 */
function getApi() {
  if (!window.api?.worldEditor) {
    throw new Error('worldEditor API no está disponible. ¿Estás en el renderer?')
  }
  return window.api.worldEditor
}

/**
 * Servicio del lado del renderer.
 */
export class WorldEditorService {
  /**
   * Crear una nueva entidad en el mundo.
   */
  static async createEntity(request: CreateWorldEntityRequest): Promise<WorldEntity> {
    return getApi().createEntity(request)
  }

  /**
   * Actualizar una entidad existente.
   */
  static async updateEntity(request: UpdateWorldEntityRequest): Promise<WorldEntity> {
    return getApi().updateEntity(request)
  }

  /**
   * Mover una entidad a nueva posición.
   */
  static async moveEntity(request: MoveWorldEntityRequest): Promise<WorldEntity> {
    return getApi().moveEntity(request)
  }

  /**
   * Eliminar una entidad (soft delete).
   */
  static async deleteEntity(request: DeleteWorldEntityRequest): Promise<void> {
    return getApi().deleteEntity(request)
  }

  /**
   * Obtener una entidad por worldId.
   */
  static async getEntity(worldId: string): Promise<WorldEntity | undefined> {
    return getApi().getEntity(worldId)
  }

  /**
   * Listar entidades con filtros opcionales.
   */
  static async queryEntities(query: WorldEntityQuery): Promise<{ items: WorldEntity[]; total: number }> {
    return getApi().queryEntities(query)
  }

  /**
   * Listar todas las entidades de un tipo específico.
   */
  static async listByType(entityType: string): Promise<WorldEntity[]> {
    return getApi().listByType(entityType)
  }

  /**
   * Cambiar estado habilitado/deshabilitado de una entidad.
   */
  static async toggleEntity(worldId: string): Promise<WorldEntity> {
    return getApi().toggleEntity(worldId)
  }

  /**
   * Duplicar una entidad.
   */
  static async duplicateEntity(worldId: string): Promise<WorldEntity> {
    return getApi().duplicateEntity(worldId)
  }

  /**
   * Obtener resumen de cambios pendientes de publicar.
   */
  static async getPublishSummary(): Promise<PublishWorldSummary> {
    return getApi().getPublishSummary()
  }

  /**
   * Publicar cambios al servidor (FASE C).
   */
  static async publishChanges(request: PublishWorldRequest): Promise<{ published: number; failed: number }> {
    return getApi().publishChanges(request)
  }

  /**
   * Obtener estado actual de sincronización.
   */
  static async getSyncStatus(): Promise<WorldSyncStatus_Response> {
    return getApi().getSyncStatus()
  }

  /**
   * Reintentar entidades que fallaron (FASE C).
   */
  static async retryFailed(): Promise<{ retried: number }> {
    return getApi().retryFailed()
  }

  /**
   * Resolver un conflicto (FASE D).
   */
  static async resolveConflict(resolution: ConflictResolution): Promise<WorldEntity> {
    return getApi().resolveConflict(resolution)
  }

  /**
   * Exportar mundo a JSON.
   */
  static async exportWorld(): Promise<WorldExportData> {
    return getApi().exportWorld()
  }

  /**
   * Limpiar cambios no sincronizados (FASE C).
   */
  static async clearUnsyncedChanges(worldIds: string[]): Promise<void> {
    return getApi().clearUnsyncedChanges(worldIds)
  }
}
