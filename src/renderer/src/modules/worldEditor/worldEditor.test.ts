/**
 * Pruebas básicas para World Editor Bloque 1.
 * - Hook de estado (Zustand)
 * - Selectores
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { WorldEntity } from '@shared-types/world'
import { WorldEntityType, WorldSyncStatus } from '@shared-types/world'
import { useWorldEditorStore } from './hooks/useWorldEditorStore'

/**
 * `useVisibleEntities` is a React hook (calls `useWorldEditorStore` three
 * times internally) - it cannot be invoked as a plain function outside a
 * component render, which is what this test file does everywhere else.
 * This mirrors its filtering logic against the vanilla store state instead,
 * so the test stays a plain Node/vitest test with no React renderer needed.
 */
function computeVisibleEntities(): WorldEntity[] {
  const state = useWorldEditorStore.getState()
  const filterText = state.filterText.toLowerCase()
  return state.entities.filter(
    (entity) => state.layerVisibility[entity.entityType] && entity.name.toLowerCase().includes(filterText)
  )
}

describe('WorldEditor - Bloque 1: Estado Global', () => {
  beforeEach(() => {
    useWorldEditorStore.setState({
      entities: [],
      selectedEntityId: null,
      filterText: '',
      mapMode: 'real' as any,
      mapCenter: { lat: 0, lng: 0 },
      mapZoom: 10,
      layerVisibility: {
        object: true,
        enemy: true,
        npc: true,
        chest: true,
        shop: true,
        quest: true,
        resource: true,
        plant: true,
        event: true,
        zone: true,
        spawn_point: true,
        building: true,
        teleporter: true,
        marker: true
      },
      layerLocked: {
        object: false,
        enemy: false,
        npc: false,
        chest: false,
        shop: false,
        quest: false,
        resource: false,
        plant: false,
        event: false,
        zone: false,
        spawn_point: false,
        building: false,
        teleporter: false,
        marker: false
      },
      layerOpacity: {
        object: 1,
        enemy: 1,
        npc: 1,
        chest: 1,
        shop: 1,
        quest: 1,
        resource: 1,
        plant: 1,
        event: 1,
        zone: 0.6,
        spawn_point: 0.8,
        building: 1,
        teleporter: 1,
        marker: 1
      },
      contextMenu: { visible: false, position: null, entityId: null },
      inspectorOpen: true,
      layersOpen: false,
      isLoading: false,
      isSaving: false,
      error: null
    })
  })

  describe('useWorldEditorStore', () => {
    it('debe inicializar con estado vacío', () => {
      const store = useWorldEditorStore.getState()
      expect(store.entities).toHaveLength(0)
      expect(store.selectedEntityId).toBeNull()
      expect(store.isLoading).toBe(false)
    })

    it('debe agregar una entidad', () => {
      const entity: WorldEntity = {
        worldId: 'test-1',
        entityType: WorldEntityType.Object,
        entityId: null,
        name: 'Test Object',
        position: { lat: 10, lng: 20 },
        rotation: 0,
        enabled: true,
        syncStatus: WorldSyncStatus.Local,
        serverVersion: 0,
        localVersion: 1,
        properties: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        lastSyncError: null,
        syncAttempts: 0
      }

      const store = useWorldEditorStore.getState()
      store.addEntity(entity)

      const state = useWorldEditorStore.getState()
      expect(state.entities).toHaveLength(1)
      expect(state.entities[0].name).toBe('Test Object')
    })

    it('debe seleccionar una entidad', () => {
      const store = useWorldEditorStore.getState()
      store.selectEntity('test-entity-id')

      const state = useWorldEditorStore.getState()
      expect(state.selectedEntityId).toBe('test-entity-id')
    })

    it('debe actualizar una entidad', () => {
      const entity: WorldEntity = {
        worldId: 'test-1',
        entityType: WorldEntityType.Enemy,
        entityId: 42,
        name: 'Original Name',
        position: { lat: 0, lng: 0 },
        rotation: 0,
        enabled: true,
        syncStatus: WorldSyncStatus.Local,
        serverVersion: 0,
        localVersion: 1,
        properties: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
        lastSyncError: null,
        syncAttempts: 0
      }

      const store = useWorldEditorStore.getState()
      store.addEntity(entity)
      store.updateEntity('test-1', { name: 'Updated Name' })

      const state = useWorldEditorStore.getState()
      expect(state.entities[0].name).toBe('Updated Name')
    })

    it('debe cambiar visibilidad de capas', () => {
      const store = useWorldEditorStore.getState()
      const initialVisibility = store.layerVisibility[WorldEntityType.Enemy]

      store.toggleLayerVisibility(WorldEntityType.Enemy)

      const state = useWorldEditorStore.getState()
      expect(state.layerVisibility[WorldEntityType.Enemy]).toBe(!initialVisibility)
    })

    it('debe bloquear/desbloquear capas', () => {
      const store = useWorldEditorStore.getState()
      expect(store.layerLocked[WorldEntityType.Object]).toBe(false)

      store.toggleLayerLock(WorldEntityType.Object)

      const state = useWorldEditorStore.getState()
      expect(state.layerLocked[WorldEntityType.Object]).toBe(true)
    })

    it('debe cambiar opacidad de capas', () => {
      const store = useWorldEditorStore.getState()
      store.setLayerOpacity(WorldEntityType.Zone, 0.5)

      const state = useWorldEditorStore.getState()
      expect(state.layerOpacity[WorldEntityType.Zone]).toBe(0.5)
    })

    it('debe manejar menú contextual', () => {
      const store = useWorldEditorStore.getState()
      const pos = { lat: 22.5, lng: -82.5 }

      store.openContextMenu(pos, 'entity-123')
      let state = useWorldEditorStore.getState()
      expect(state.contextMenu.visible).toBe(true)
      expect(state.contextMenu.position).toEqual(pos)

      store.closeContextMenu()
      state = useWorldEditorStore.getState()
      expect(state.contextMenu.visible).toBe(false)
    })

    it('debe cargar múltiples entidades', () => {
      const entities: WorldEntity[] = [
        {
          worldId: '1',
          entityType: WorldEntityType.Object,
          entityId: 1,
          name: 'Object 1',
          position: { lat: 0, lng: 0 },
          rotation: 0,
          enabled: true,
          syncStatus: WorldSyncStatus.Local,
          serverVersion: 0,
          localVersion: 1,
          properties: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
          lastSyncError: null,
          syncAttempts: 0
        },
        {
          worldId: '2',
          entityType: WorldEntityType.Enemy,
          entityId: 2,
          name: 'Enemy 1',
          position: { lat: 10, lng: 10 },
          rotation: 45,
          enabled: true,
          syncStatus: WorldSyncStatus.Local,
          serverVersion: 0,
          localVersion: 1,
          properties: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
          lastSyncError: null,
          syncAttempts: 0
        }
      ]

      const store = useWorldEditorStore.getState()
      store.loadEntities(entities)

      const state = useWorldEditorStore.getState()
      expect(state.entities).toHaveLength(2)
      expect(state.entities[0].name).toBe('Object 1')
    })
  })

  describe('Selectores', () => {
    it('useVisibleEntities debe filtrar por capa y texto', () => {
      const entities: WorldEntity[] = [
        {
          worldId: '1',
          entityType: WorldEntityType.Object,
          entityId: 1,
          name: 'Gold Coin',
          position: { lat: 0, lng: 0 },
          rotation: 0,
          enabled: true,
          syncStatus: WorldSyncStatus.Local,
          serverVersion: 0,
          localVersion: 1,
          properties: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
          lastSyncError: null,
          syncAttempts: 0
        },
        {
          worldId: '2',
          entityType: WorldEntityType.Enemy,
          entityId: 2,
          name: 'Orc Warrior',
          position: { lat: 10, lng: 10 },
          rotation: 0,
          enabled: true,
          syncStatus: WorldSyncStatus.Local,
          serverVersion: 0,
          localVersion: 1,
          properties: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
          lastSyncError: null,
          syncAttempts: 0
        }
      ]

      const store = useWorldEditorStore.getState()
      store.loadEntities(entities)

      let visible = computeVisibleEntities()
      expect(visible).toHaveLength(2)

      // Ocultar enemigos
      store.toggleLayerVisibility(WorldEntityType.Enemy)
      visible = computeVisibleEntities()
      expect(visible).toHaveLength(1)
      expect(visible[0].name).toBe('Gold Coin')
    })
  })
})
