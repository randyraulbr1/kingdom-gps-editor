import { describe, it, expect } from 'vitest'
import { validateWorld } from './worldValidator'
import { WorldEntityType, WorldSyncStatus, type WorldEntity, type WorldZone, type EnemyRoute } from '@shared-types/world'

function entity(overrides: Partial<WorldEntity> = {}): WorldEntity {
  return {
    worldId: `w_${Math.random().toString(36).slice(2)}`,
    entityType: WorldEntityType.Marker,
    entityId: null,
    name: 'Pin',
    position: { lat: 10, lng: 20 },
    rotation: 0,
    enabled: true,
    syncStatus: WorldSyncStatus.Local,
    serverVersion: 0,
    localVersion: 1,
    properties: {},
    createdAt: '',
    updatedAt: '',
    deletedAt: null,
    lastSyncError: null,
    syncAttempts: 0,
    ...overrides
  }
}

describe('validador del mundo', () => {
  it('mundo vacío: 100% válido, sin avisos', () => {
    const s = validateWorld({ entities: [], zones: [], routes: [] })
    expect(s.errors).toBe(0)
    expect(s.reviewed).toBe(0)
    expect(s.validPercent).toBe(100)
  })

  it('tienda sin catálogo genera error crítico', () => {
    const s = validateWorld({ entities: [entity({ entityType: WorldEntityType.Shop, name: 'Tienda' })], zones: [], routes: [] })
    expect(s.errors).toBeGreaterThan(0)
    expect(s.issues.some((i) => i.module === 'Tienda' && i.message.includes('catálogo'))).toBe(true)
  })

  it('coordenadas inválidas generan error', () => {
    const s = validateWorld({ entities: [entity({ position: { lat: 999, lng: 0 } })], zones: [], routes: [] })
    expect(s.issues.some((i) => i.message.includes('Coordenadas'))).toBe(true)
  })

  it('detecta pines duplicados en la misma posición y referencia', () => {
    const common = { entityType: WorldEntityType.Object, entityId: 5, position: { lat: 1, lng: 2 } }
    const s = validateWorld({ entities: [entity(common), entity(common)], zones: [], routes: [] })
    expect(s.issues.some((i) => i.message.includes('duplicado'))).toBe(true)
  })

  it('zona con menos de 3 puntos es error; ruta sin enemigos es error', () => {
    const zone: WorldZone = {
      zoneId: 'z1',
      name: 'Z',
      color: '#fff',
      points: [{ lat: 0, lng: 0 }],
      properties: {},
      createdAt: '',
      updatedAt: '',
      deletedAt: null
    }
    const route: EnemyRoute = {
      routeId: 'r1',
      name: 'R',
      color: '#ef4444',
      points: [{ lat: 0, lng: 0 }, { lat: 1, lng: 1 }],
      properties: {},
      createdAt: '',
      updatedAt: '',
      deletedAt: null
    }
    const s = validateWorld({ entities: [], zones: [zone], routes: [route] })
    expect(s.issues.some((i) => i.targetKind === 'zone' && i.severity === 'error')).toBe(true)
    expect(s.issues.some((i) => i.targetKind === 'route' && i.message.includes('enemigos'))).toBe(true)
  })

  it('calcula porcentaje válido según elementos con error', () => {
    const ok = entity({ entityType: WorldEntityType.Marker, position: { lat: 1, lng: 1 } })
    const bad = entity({ entityType: WorldEntityType.Shop, name: 'Mala', position: { lat: 2, lng: 2 } })
    const s = validateWorld({ entities: [ok, bad], zones: [], routes: [] })
    expect(s.reviewed).toBe(2)
    expect(s.validPercent).toBe(50) // 1 de 2 elementos con error crítico
  })
})
