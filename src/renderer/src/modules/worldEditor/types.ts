/**
 * Tipos específicos del renderer para World Editor.
 * Se combinan con tipos compartidos de shared-types/world.ts
 */

import type {
  WorldEntity,
  WorldEntityType,
  Position,
  MapMode
} from '@shared-types/world'
import type { ClipboardEntry } from './utils/clipboard'

/**
 * Estado expandido de una entidad en el renderer.
 * Incluye información UI que no se sincroniza con servidor.
 */
export interface WorldEntityUI extends WorldEntity {
  /** Si está seleccionada en la UI */
  isSelected?: boolean
  /** Si está siendo editada inline */
  isEditing?: boolean
  /** Errores de validación si los hay */
  validationErrors?: Record<string, string>
  /** Información de iconografía */
  iconUrl?: string
  iconName?: string
  /** Nombre legible del tipo de entidad */
  typeLabel?: string
}

/**
 * Estado del editor de mundo.
 * Gestiona selecciones, filtros, vistas, etc.
 */
export interface WorldEditorState {
  // Datos
  entities: WorldEntityUI[]
  selectedEntityId: string | null

  // Mapa
  mapMode: MapMode
  mapCenter: Position | null
  mapZoom: number

  // UI
  layerVisibility: Record<WorldEntityType, boolean>
  layerLocked: Record<WorldEntityType, boolean>
  layerOpacity: Record<WorldEntityType, number>

  // Interacción
  contextMenu: {
    visible: boolean
    position: Position | null
    entityId: string | null
  }
  inspectorOpen: boolean
  layersOpen: boolean
  filterText: string

  /** Portapapeles interno del editor (copiar/cortar/pegar, doc 28). */
  clipboard: ClipboardEntry | null

  // Estado de carga
  isLoading: boolean
  isSaving: boolean
  error: string | null
}

/**
 * Acciones sobre el estado.
 */
export interface WorldEditorActions {
  // Entidades
  addEntity(entity: WorldEntityUI): void
  updateEntity(worldId: string, patch: Partial<WorldEntityUI>): void
  removeEntity(worldId: string): void
  selectEntity(worldId: string | null): void
  duplicateEntity(worldId: string): void

  // Portapapeles interno (doc 28)
  setClipboard(entry: ClipboardEntry | null): void

  // Mapa
  setMapMode(mode: MapMode): void
  setMapCenter(pos: Position): void
  setMapZoom(zoom: number): void

  // Capas
  toggleLayerVisibility(type: WorldEntityType): void
  toggleLayerLock(type: WorldEntityType): void
  setLayerOpacity(type: WorldEntityType, opacity: number): void

  // UI
  openContextMenu(pos: Position, entityId: string | null): void
  closeContextMenu(): void
  setInspectorOpen(open: boolean): void
  setLayersOpen(open: boolean): void
  setFilterText(text: string): void

  // Estado
  setLoading(loading: boolean): void
  setSaving(saving: boolean): void
  setError(error: string | null): void

  // Batch
  loadEntities(entities: WorldEntity[]): void
  reset(): void
}

/**
 * Hook store completo.
 */
export type WorldEditorStore = WorldEditorState & WorldEditorActions
