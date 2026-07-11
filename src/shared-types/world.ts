/**
 * Tipos compartidos para el módulo Editor de Mundo.
 * Usado por: main (servicios, DB), preload (IPC), renderer (componentes).
 */

// ========== Enumeraciones ==========

export enum WorldEntityType {
  Object = 'object',
  Enemy = 'enemy',
  Npc = 'npc',
  Chest = 'chest',
  Shop = 'shop',
  Quest = 'quest',
  Resource = 'resource',
  Plant = 'plant',
  Event = 'event',
  Zone = 'zone',
  SpawnPoint = 'spawn_point',
  Building = 'building',
  Teleporter = 'teleporter',
  Marker = 'marker'
}

export enum WorldSyncStatus {
  /** Creado solo localmente */
  Local = 'local',
  /** Cambios pendientes de sincronizar */
  Pending = 'pending',
  /** En proceso de sincronización */
  Syncing = 'syncing',
  /** Sincronizado correctamente */
  Synced = 'synced',
  /** Fallo en sincronización (reintentable) */
  Failed = 'failed',
  /** Conflicto con versión del servidor */
  Conflict = 'conflict',
  /** Esperando eliminación en servidor */
  DeletedPending = 'deleted_pending',
  /** Eliminando en servidor */
  Deleting = 'deleting',
  /** Eliminado en servidor */
  Deleted = 'deleted',
  /** Sin conexión (recuperará al reconectar) */
  Offline = 'offline'
}

export enum WorldSyncOperation {
  Create = 'create',
  Update = 'update',
  Move = 'move',
  Delete = 'delete',
  Enable = 'enable',
  Disable = 'disable'
}

export enum MapMode {
  Real = 'real',
  Local = 'local',
  Satellite = 'satellite',
  Streets = 'streets',
  Dark = 'dark',
  GameView = 'game_view'
}

// ========== Posición y Geometría ==========

export interface Position {
  lat: number
  lng: number
}

export interface BoundingBox {
  north: number
  south: number
  east: number
  west: number
}

// ========== Entidad del Mundo ==========

export interface WorldEntity {
  /** ID único generado localmente (ULID o UUID) */
  worldId: string
  /** Tipo de entidad */
  entityType: WorldEntityType
  /** ID de la entidad original en su módulo (items, enemies, etc.) */
  entityId: number | null
  /** Nombre del elemento */
  name: string
  /** Posición en GPS */
  position: Position
  /** Rotación en grados (0-360) */
  rotation: number
  /** Si está activo */
  enabled: boolean
  /** Estado de sincronización */
  syncStatus: WorldSyncStatus
  /** Versión en servidor (para detección de conflictos) */
  serverVersion: number
  /** Versión local (para comparar) */
  localVersion: number
  /** Propiedades específicas del tipo (JSON) */
  properties: Record<string, unknown>
  /** Timestamps */
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  /** Último error de sincronización */
  lastSyncError: string | null
  /** Número de intentos de sincronización */
  syncAttempts: number
}

// ========== Request/Response para IPC ==========

export interface CreateWorldEntityRequest {
  entityType: WorldEntityType
  entityId: number | null
  name: string
  position: Position
  properties: Record<string, unknown>
}

export interface UpdateWorldEntityRequest {
  worldId: string
  patch: Partial<Omit<WorldEntity, 'worldId' | 'createdAt'>>
}

export interface MoveWorldEntityRequest {
  worldId: string
  position: Position
}

export interface DeleteWorldEntityRequest {
  worldId: string
}

export interface WorldEntityQuery {
  entityType?: WorldEntityType
  syncStatus?: WorldSyncStatus
  boundingBox?: BoundingBox
  limit?: number
  offset?: number
}

// ========== Respuestas Batch ==========

export interface WorldEntityListResponse {
  items: WorldEntity[]
  total: number
}

export interface PublishWorldSummary {
  newCount: number
  modifiedCount: number
  movedCount: number
  deletedCount: number
  failedCount: number
  conflictCount: number
}

export interface PublishWorldRequest {
  /** Publica todo o solo los seleccionados */
  selectedWorldIds?: string[]
  /** Si es vacío, publica TODO */
  publishAll: boolean
}

// ========== Sincronización ==========

export interface WorldSyncJob {
  id: number
  worldEntityId: string
  operation: WorldSyncOperation
  payloadJson: string
  status: WorldSyncStatus
  attempts: number
  nextRetryAt: string | null
  lastError: string | null
  createdAt: string
  updatedAt: string
}

export interface WorldSyncStatus_Response {
  online: boolean
  pendingCount: number
  failedCount: number
  conflictCount: number
  lastSyncAt: string | null
  nextRetryAt: string | null
}

// ========== Resolución de Conflictos ==========

export interface ConflictResolution {
  worldId: string
  choice: 'local' | 'server' | 'manual'
  mergedData?: Partial<WorldEntity>
}

// ========== Exportación ==========

export interface WorldExportData {
  version: string
  exportedAt: string
  metadata: {
    projectName: string
    entityCount: number
    bounds: BoundingBox
  }
  entities: WorldEntity[]
  syncStatus: WorldSyncStatus_Response
}

// ========== Configuración ==========

export interface WorldEditorConfig {
  mapMode: MapMode
  centerLat: number
  centerLng: number
  zoomLevel: number
  visibleLayers: Set<WorldEntityType>
  lockedLayers: Set<WorldEntityType>
  opacityByType: Map<WorldEntityType, number>
  /** URL del servidor para sincronización */
  serverUrl?: string
  /** Máximo número de reintentos automáticos */
  maxRetries: number
  /** Intervalo base para reintentos (ms) */
  retryBaseIntervalMs: number
  /** Máximo intervalo para reintentos (ms) */
  retryMaxIntervalMs: number
}

// ========== Estados de UI ==========

export interface WorldEditorUIState {
  selectedWorldId: string | null
  contextMenuPosition: Position | null
  inspectorOpen: boolean
  layersOpen: boolean
  syncQueueOpen: boolean
  filterText: string
  mapMode: MapMode
}

// ========== Para el Inspector ==========

export interface WorldEntityDetails extends WorldEntity {
  iconUrl?: string
  originalEntityName?: string
  syncMessage?: string
  canPublish: boolean
  canRetry: boolean
}

// ========== Zonas (polígonos dibujados sobre el mapa) ==========

/**
 * Una zona es un polígono de puntos GPS conectados. Sirve para acotar dónde
 * crear contenido y para consultar lugares reales de OpenStreetMap dentro de
 * su área. Persistida en SQLite (tabla `world_zones`), con id ULID pensado
 * para sobrevivir a una futura sincronización con servidor (doc 12).
 */
export interface WorldZone {
  zoneId: string
  name: string
  /** Color del relleno/borde del polígono (hex). */
  color: string
  /** Vértices del polígono, en orden. */
  points: Position[]
  properties: Record<string, unknown>
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface CreateWorldZoneRequest {
  name: string
  color: string
  points: Position[]
  properties?: Record<string, unknown>
}

export interface UpdateWorldZoneRequest {
  zoneId: string
  patch: Partial<Omit<WorldZone, 'zoneId' | 'createdAt'>>
}

// ========== Integración OpenStreetMap (Overpass) ==========

/** Categorías reales de OSM que el editor sabe consultar dentro de una zona. */
export type OsmCategoryKey = 'pharmacy' | 'hospital' | 'fuel' | 'supermarket'

/** Un lugar real devuelto por OpenStreetMap dentro de la zona consultada. */
export interface OsmPlace {
  /** Identificador OSM (tipo+id, p.ej. "node/123"). */
  osmId: string
  category: OsmCategoryKey
  name: string
  position: Position
}

export interface OsmQueryRequest {
  /** Polígono (vértices) dentro del cual buscar. */
  polygon: Position[]
  /** Categorías a consultar; si se omite, se consultan todas las conocidas. */
  categories?: OsmCategoryKey[]
}

export interface OsmQueryResult {
  places: OsmPlace[]
  /** Conteo de coincidencias por categoría (incluye las de conteo 0 pedidas). */
  countsByCategory: Record<string, number>
}
