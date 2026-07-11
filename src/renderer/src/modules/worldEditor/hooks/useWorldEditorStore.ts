/**
 * Hook de estado global para World Editor, usando Zustand.
 * Maneja:
 * - Entidades (lista, selección, edición)
 * - Configuración de mapa
 * - Visibilidad y estado de capas
 * - Estado de UI (menús, paneles)
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { WorldEntity, WorldEntityType, Position, MapMode } from '@shared-types/world'
import type { WorldEditorStore, WorldEntityUI } from '../types'
import { WorldEntityType as EntityType, MapMode as MapModeEnum } from '@shared-types/world'

/**
 * Estado inicial.
 */
const initialState = {
  // Datos
  entities: [] as WorldEntityUI[],
  selectedEntityId: null,

  // Mapa
  mapMode: MapModeEnum.Real as MapMode,
  mapCenter: { lat: 0, lng: 0 } as Position,
  mapZoom: 10,

  // UI - Capas
  layerVisibility: {
    [EntityType.Object]: true,
    [EntityType.Enemy]: true,
    [EntityType.Npc]: true,
    [EntityType.Chest]: true,
    [EntityType.Shop]: true,
    [EntityType.Quest]: true,
    [EntityType.Resource]: true,
    [EntityType.Plant]: true,
    [EntityType.Event]: true,
    [EntityType.Zone]: true,
    [EntityType.SpawnPoint]: true,
    [EntityType.Building]: true,
    [EntityType.Teleporter]: true,
    [EntityType.Marker]: true
  } as Record<WorldEntityType, boolean>,

  layerLocked: {
    [EntityType.Object]: false,
    [EntityType.Enemy]: false,
    [EntityType.Npc]: false,
    [EntityType.Chest]: false,
    [EntityType.Shop]: false,
    [EntityType.Quest]: false,
    [EntityType.Resource]: false,
    [EntityType.Plant]: false,
    [EntityType.Event]: false,
    [EntityType.Zone]: false,
    [EntityType.SpawnPoint]: false,
    [EntityType.Building]: false,
    [EntityType.Teleporter]: false,
    [EntityType.Marker]: false
  } as Record<WorldEntityType, boolean>,

  layerOpacity: {
    [EntityType.Object]: 1,
    [EntityType.Enemy]: 1,
    [EntityType.Npc]: 1,
    [EntityType.Chest]: 1,
    [EntityType.Shop]: 1,
    [EntityType.Quest]: 1,
    [EntityType.Resource]: 1,
    [EntityType.Plant]: 1,
    [EntityType.Event]: 1,
    [EntityType.Zone]: 0.6,
    [EntityType.SpawnPoint]: 0.8,
    [EntityType.Building]: 1,
    [EntityType.Teleporter]: 1,
    [EntityType.Marker]: 1
  } as Record<WorldEntityType, number>,

  // Interacción
  contextMenu: { visible: false, position: null, entityId: null },
  inspectorOpen: true,
  layersOpen: false,
  filterText: '',

  // Estado
  isLoading: false,
  isSaving: false,
  error: null as string | null
}

/**
 * Hook store.
 */
export const useWorldEditorStore = create<WorldEditorStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // ========== Entidades ==========

        addEntity(entity: WorldEntityUI) {
          set((state) => ({
            entities: [...state.entities, entity]
          }))
        },

        updateEntity(worldId: string, patch: Partial<WorldEntityUI>) {
          set((state) => ({
            entities: state.entities.map((e) => (e.worldId === worldId ? { ...e, ...patch } : e))
          }))
        },

        removeEntity(worldId: string) {
          set((state) => ({
            entities: state.entities.filter((e) => e.worldId !== worldId),
            selectedEntityId: state.selectedEntityId === worldId ? null : state.selectedEntityId
          }))
        },

        selectEntity(worldId: string | null) {
          set({ selectedEntityId: worldId })
        },

        duplicateEntity(worldId: string) {
          const state = get()
          const original = state.entities.find((e) => e.worldId === worldId)
          if (!original) return

          const copy = {
            ...original,
            worldId: `${original.worldId}_copy_${Date.now()}`,
            name: `${original.name} (copia)`,
            isSelected: false,
            isEditing: false
          }

          set((s) => ({ entities: [...s.entities, copy] }))
        },

        // ========== Mapa ==========

        setMapMode(mode: MapMode) {
          set({ mapMode: mode })
        },

        setMapCenter(pos: Position) {
          set({ mapCenter: pos })
        },

        setMapZoom(zoom: number) {
          set({ mapZoom: zoom })
        },

        // ========== Capas ==========

        toggleLayerVisibility(type: WorldEntityType) {
          set((state) => ({
            layerVisibility: {
              ...state.layerVisibility,
              [type]: !state.layerVisibility[type]
            }
          }))
        },

        toggleLayerLock(type: WorldEntityType) {
          set((state) => ({
            layerLocked: {
              ...state.layerLocked,
              [type]: !state.layerLocked[type]
            }
          }))
        },

        setLayerOpacity(type: WorldEntityType, opacity: number) {
          set((state) => ({
            layerOpacity: {
              ...state.layerOpacity,
              [type]: Math.max(0, Math.min(1, opacity))
            }
          }))
        },

        // ========== UI ==========

        openContextMenu(pos: Position, entityId: string | null) {
          set({
            contextMenu: { visible: true, position: pos, entityId }
          })
        },

        closeContextMenu() {
          set({
            contextMenu: { visible: false, position: null, entityId: null }
          })
        },

        setInspectorOpen(open: boolean) {
          set({ inspectorOpen: open })
        },

        setLayersOpen(open: boolean) {
          set({ layersOpen: open })
        },

        setFilterText(text: string) {
          set({ filterText: text })
        },

        // ========== Estado ==========

        setLoading(loading: boolean) {
          set({ isLoading: loading })
        },

        setSaving(saving: boolean) {
          set({ isSaving: saving })
        },

        setError(error: string | null) {
          set({ error })
        },

        // ========== Batch ==========

        loadEntities(entities: WorldEntity[]) {
          set({
            entities: entities.map((e) => ({
              ...e,
              isSelected: false,
              isEditing: false
            }))
          })
        },

        reset() {
          set(initialState)
        }
      }),
      {
        name: 'worldEditor-store'
      }
    )
  )
)

/**
 * Selectores útiles.
 */
export const useSelectedEntity = () => {
  const selectedEntityId = useWorldEditorStore((s) => s.selectedEntityId)
  const entities = useWorldEditorStore((s) => s.entities)

  return entities.find((e) => e.worldId === selectedEntityId) || null
}

export const useVisibleEntities = () => {
  const entities = useWorldEditorStore((s) => s.entities)
  const layerVisibility = useWorldEditorStore((s) => s.layerVisibility)
  const filterText = useWorldEditorStore((s) => s.filterText).toLowerCase()

  return entities.filter((e) => {
    const isVisible = layerVisibility[e.entityType]
    const matchesFilter = e.name.toLowerCase().includes(filterText)
    return isVisible && matchesFilter
  })
}

export const useEntityCountByType = () => {
  const entities = useWorldEditorStore((s) => s.entities)

  return entities.reduce(
    (acc, e) => {
      acc[e.entityType] = (acc[e.entityType] || 0) + 1
      return acc
    },
    {} as Record<WorldEntityType, number>
  )
}
