import { describe, it, expect } from 'vitest'
import { makeClipboardEntry, buildPasteRequest } from './clipboard'
import { WorldEntityType, WorldSyncStatus } from '@shared-types/world'
import type { WorldEntityUI } from '../types'

function makeEntity(overrides: Partial<WorldEntityUI> = {}): WorldEntityUI {
  return {
    worldId: 'w1',
    entityType: WorldEntityType.Shop,
    entityId: null,
    name: 'Tienda de pruebas',
    position: { lat: 10, lng: 20 },
    rotation: 0,
    enabled: true,
    syncStatus: WorldSyncStatus.Local,
    serverVersion: 0,
    localVersion: 1,
    properties: { shop: { shopType: 'general', items: [{ id: 'a', qty: 3 }] } },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    lastSyncError: null,
    syncAttempts: 0,
    ...overrides
  }
}

describe('portapapeles interno del Editor de Mundo', () => {
  it('copia tipo, nombre, entityId y propiedades, recordando el origen', () => {
    const entry = makeClipboardEntry(makeEntity(), 'copy')
    expect(entry.mode).toBe('copy')
    expect(entry.sourceWorldId).toBe('w1')
    expect(entry.entityType).toBe(WorldEntityType.Shop)
    expect(entry.name).toBe('Tienda de pruebas')
    expect(entry.properties).toEqual({ shop: { shopType: 'general', items: [{ id: 'a', qty: 3 }] } })
  })

  it('clona las propiedades en profundidad (editar el original no altera lo copiado)', () => {
    const entity = makeEntity()
    const entry = makeClipboardEntry(entity, 'copy')
    ;(entity.properties.shop as { items: unknown[] }).items.push({ id: 'b', qty: 1 })
    expect((entry.properties.shop as { items: unknown[] }).items).toHaveLength(1)
  })

  it('al pegar en modo copy añade "(copia)" y usa la posición del clic con un ID nuevo pendiente', () => {
    const entry = makeClipboardEntry(makeEntity(), 'copy')
    const req = buildPasteRequest(entry, { lat: 1, lng: 2 })
    expect(req.name).toBe('Tienda de pruebas (copia)')
    expect(req.position).toEqual({ lat: 1, lng: 2 })
    expect(req.entityType).toBe(WorldEntityType.Shop)
    // La petición de creación no arrastra worldId ni timestamps: el main asigna uno nuevo.
    expect(req).not.toHaveProperty('worldId')
    expect(req).not.toHaveProperty('createdAt')
  })

  it('al pegar en modo cut conserva el nombre (no añade "(copia)")', () => {
    const entry = makeClipboardEntry(makeEntity(), 'cut')
    const req = buildPasteRequest(entry, { lat: 5, lng: 6 })
    expect(req.name).toBe('Tienda de pruebas')
    expect(req.position).toEqual({ lat: 5, lng: 6 })
  })
})
