import type { IconRecord, IconQuery, IconImportResult, IconResizeRequest } from './icon'
import type { OpenProjectInfo, RecentProjectEntry, ProjectHealthCheck } from './project'
import type { ExportRunResult } from './exporter'
import type { ChangeLogEntry } from './commands'
import type { Item, ItemInput, ItemQuery } from './item'
import type { Weapon, WeaponInput, WeaponQuery } from './weapon'
import type { Armor, ArmorInput, ArmorQuery } from './armor'
import type { Monster, MonsterInput, MonsterQuery } from './monster'
import type { UpdateCheckResult } from './updates'
import type {
  ServerConfig,
  CaptureResult,
  PublishEntityResult,
  ServerAuthStatus,
  GamePlayer,
  CreatePlayerInput,
  PlayerEditInput,
  PlayerAdminResult
} from './system'
import type {
  WorldEntity,
  CreateWorldEntityRequest,
  UpdateWorldEntityRequest,
  MoveWorldEntityRequest,
  DeleteWorldEntityRequest,
  WorldEntityQuery,
  WorldEntityListResponse,
  PublishWorldSummary,
  PublishWorldRequest,
  WorldSyncStatus_Response,
  WorldExportData,
  ConflictResolution,
  WorldZone,
  CreateWorldZoneRequest,
  UpdateWorldZoneRequest,
  EnemyRoute,
  CreateEnemyRouteRequest,
  UpdateEnemyRouteRequest,
  OsmQueryRequest,
  OsmQueryResult
} from './world'

/**
 * The full typed contract exposed by the preload script as `window.api`.
 * Renderer code must never touch Node/fs/db directly - this is the only door.
 */
export interface KingdomGpsApi {
  project: {
    create(parentDir: string, name: string): Promise<OpenProjectInfo>
    open(path: string): Promise<OpenProjectInfo>
    listRecent(): Promise<RecentProjectEntry[]>
    getCurrent(): Promise<OpenProjectInfo | null>
    checkHealth(): Promise<ProjectHealthCheck>
    backupNow(): Promise<{ path: string }>
  }
  icons: {
    list(query: IconQuery): Promise<{ items: IconRecord[]; total: number }>
    get(iconId: number): Promise<IconRecord | undefined>
    importFolder(sourceDir: string): Promise<IconImportResult>
    toggleFavorite(iconId: number): Promise<IconRecord>
    setTags(iconId: number, tags: string[]): Promise<IconRecord>
    resize(request: IconResizeRequest): Promise<IconRecord>
    listCategories(): Promise<string[]>
    listTags(): Promise<string[]>
  }
  items: {
    query(params: ItemQuery): Promise<{ items: Item[]; total: number }>
    get(id: number): Promise<Item | undefined>
    create(data: ItemInput): Promise<Item>
    update(id: number, patch: Partial<ItemInput>): Promise<Item>
    delete(id: number): Promise<void>
    bulkUpdate(ids: number[], patch: Partial<ItemInput>): Promise<Item[]>
    bulkDelete(ids: number[]): Promise<void>
    listCategories(): Promise<string[]>
  }
  weapons: {
    query(params: WeaponQuery): Promise<{ items: Weapon[]; total: number }>
    get(id: number): Promise<Weapon | undefined>
    create(data: WeaponInput): Promise<Weapon>
    update(id: number, patch: Partial<WeaponInput>): Promise<Weapon>
    delete(id: number): Promise<void>
    bulkUpdate(ids: number[], patch: Partial<WeaponInput>): Promise<Weapon[]>
    bulkDelete(ids: number[]): Promise<void>
    listCategories(): Promise<string[]>
  }
  armor: {
    query(params: ArmorQuery): Promise<{ items: Armor[]; total: number }>
    get(id: number): Promise<Armor | undefined>
    create(data: ArmorInput): Promise<Armor>
    update(id: number, patch: Partial<ArmorInput>): Promise<Armor>
    delete(id: number): Promise<void>
    bulkUpdate(ids: number[], patch: Partial<ArmorInput>): Promise<Armor[]>
    bulkDelete(ids: number[]): Promise<void>
    listCategories(): Promise<string[]>
  }
  monsters: {
    query(params: MonsterQuery): Promise<{ items: Monster[]; total: number }>
    get(id: number): Promise<Monster | undefined>
    create(data: MonsterInput): Promise<Monster>
    update(id: number, patch: Partial<MonsterInput>): Promise<Monster>
    delete(id: number): Promise<void>
    bulkUpdate(ids: number[], patch: Partial<MonsterInput>): Promise<Monster[]>
    bulkDelete(ids: number[]): Promise<void>
    listCategories(): Promise<string[]>
  }
  export: {
    icons(): Promise<ExportRunResult>
    items(): Promise<ExportRunResult>
    weapons(): Promise<ExportRunResult>
    armor(): Promise<ExportRunResult>
    monsters(): Promise<ExportRunResult>
    world(): Promise<ExportRunResult>
  }
  commandHistory: {
    listRecent(limit?: number): Promise<ChangeLogEntry[]>
    undo(): Promise<ChangeLogEntry | null>
    redo(): Promise<ChangeLogEntry | null>
  }
  worldEditor: {
    /** Crear una entidad en el mundo */
    createEntity(request: CreateWorldEntityRequest): Promise<WorldEntity>
    /** Actualizar una entidad existente */
    updateEntity(request: UpdateWorldEntityRequest): Promise<WorldEntity>
    /** Mover una entidad a nueva posición */
    moveEntity(request: MoveWorldEntityRequest): Promise<WorldEntity>
    /** Eliminar una entidad */
    deleteEntity(request: DeleteWorldEntityRequest): Promise<void>
    /** Obtener una entidad por worldId */
    getEntity(worldId: string): Promise<WorldEntity | undefined>
    /** Listar entidades con filtros opcionales */
    queryEntities(query: WorldEntityQuery): Promise<WorldEntityListResponse>
    /** Listar entidades por tipo */
    listByType(entityType: string): Promise<WorldEntity[]>
    /** Cambiar visibilidad de una entidad */
    toggleEntity(worldId: string): Promise<WorldEntity>
    /** Duplicar una entidad */
    duplicateEntity(worldId: string): Promise<WorldEntity>
    /** Subir un pin al mundo/servidor (verde si entra, rojo si falla) */
    publishEntity(worldId: string): Promise<PublishEntityResult>
    /** Obtener resumen de cambios pendientes */
    getPublishSummary(): Promise<PublishWorldSummary>
    /** Publicar cambios al servidor */
    publishChanges(request: PublishWorldRequest): Promise<{ published: number; failed: number }>
    /** Obtener estado de sincronización */
    getSyncStatus(): Promise<WorldSyncStatus_Response>
    /** Reintentar fallos de sincronización */
    retryFailed(): Promise<{ retried: number }>
    /** Resolver conflicto */
    resolveConflict(resolution: ConflictResolution): Promise<WorldEntity>
    /** Exportar mundo a JSON */
    exportWorld(): Promise<WorldExportData>
    /** Limpiar cambios locales sin sincronizar */
    clearUnsyncedChanges(worldIds: string[]): Promise<void>
  }
  worldZones: {
    /** Crear una zona (polígono) */
    create(request: CreateWorldZoneRequest): Promise<WorldZone>
    /** Actualizar una zona existente */
    update(request: UpdateWorldZoneRequest): Promise<WorldZone>
    /** Eliminar (soft delete) una zona */
    delete(zoneId: string): Promise<void>
    /** Listar todas las zonas activas */
    list(): Promise<WorldZone[]>
  }
  enemyRoutes: {
    /** Crear una ruta de enemigos (polilínea) */
    create(request: CreateEnemyRouteRequest): Promise<EnemyRoute>
    /** Actualizar una ruta existente */
    update(request: UpdateEnemyRouteRequest): Promise<EnemyRoute>
    /** Eliminar (soft delete) una ruta */
    delete(routeId: string): Promise<void>
    /** Listar todas las rutas activas */
    list(): Promise<EnemyRoute[]>
  }
  osm: {
    /** Consultar lugares reales de OpenStreetMap dentro de un polígono */
    queryPlaces(request: OsmQueryRequest): Promise<OsmQueryResult>
  }
  updates: {
    /** Versión actual de la app. */
    getVersion(): Promise<string>
    /** Comprueba si hay una versión nueva publicada. */
    check(): Promise<UpdateCheckResult>
    /** Descarga la actualización y reinicia para instalarla. */
    downloadAndInstall(): Promise<{ ok: boolean; message?: string }>
  }
  capture: {
    /** Captura la ventana y la guarda con nombre único (captura-N.png). */
    window(): Promise<CaptureResult>
  }
  server: {
    /** Config del servidor del juego (URL + credenciales de admin). */
    get(): Promise<ServerConfig>
    set(config: ServerConfig): Promise<void>
    /** Prueba las credenciales iniciando sesión (auth automática). */
    checkAuth(): Promise<ServerAuthStatus>
  }
  players: {
    /** Lista de jugadores reales con sus datos de partida. */
    list(): Promise<GamePlayer[]>
    /** Crea una cuenta de jugador. */
    create(input: CreatePlayerInput): Promise<PlayerAdminResult>
    /** Limpia todas las cuentas dejando solo la de admin (respaldada antes). */
    clearAll(): Promise<PlayerAdminResult>
    /** Edita los datos de partida de un jugador. */
    edit(input: PlayerEditInput): Promise<PlayerAdminResult>
    /** Cambia la contraseña de un jugador. */
    setPassword(id: string, password: string): Promise<PlayerAdminResult>
    /** Banea o desbanea un jugador. */
    ban(id: string, ban: boolean): Promise<PlayerAdminResult>
    /** Elimina un jugador (queda en papelera recuperable). */
    delete(id: string): Promise<PlayerAdminResult>
  }
  dialog: {
    pickFolder(): Promise<string | null>
  }
  windowControls: {
    minimize(): Promise<void>
    toggleMaximize(): Promise<void>
    close(): Promise<void>
  }
}

declare global {
  interface Window {
    api: KingdomGpsApi
  }
}
