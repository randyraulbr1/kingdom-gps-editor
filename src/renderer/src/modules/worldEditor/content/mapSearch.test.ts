import { describe, it, expect } from 'vitest'
import { searchWorld, entityTypeLabel } from './mapSearch'
import { WorldEntityType, WorldSyncStatus, type WorldEntity, type WorldZone, type EnemyRoute } from '@shared-types/world'

function entity(overrides: Partial<WorldEntity> = {}): WorldEntity {
  return {
    worldId: 'w1',
    entityType: WorldEntityType.Shop,
    entityId: null,
    name: 'Herrería del Norte',
    position: { lat: 1, lng: 2 },
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

const zone: WorldZone = {
  zoneId: 'z1',
  name: 'Centro',
  color: '#fff',
  points: [{ lat: 0, lng: 0 }],
  properties: {},
  createdAt: '',
  updatedAt: '',
  deletedAt: null
}

const route: EnemyRoute = {
  routeId: 'r1',
  name: 'Bosque oscuro',
  color: '#ef4444',
  points: [{ lat: 0, lng: 0 }, { lat: 1, lng: 1 }],
  properties: {},
  createdAt: '',
  updatedAt: '',
  deletedAt: null
}

describe('búsqueda global del mapa', () => {
  const world = { entities: [entity()], zones: [zone], routes: [route] }

  it('cadena vacía no devuelve resultados', () => {
    expect(searchWorld('   ', world)).toHaveLength(0)
  })

  it('encuentra por nombre (subcadena, sin distinguir mayúsculas)', () => {
    const r = searchWorld('herrería', world)
    expect(r[0].kind).toBe('entity')
    expect(r[0].name).toBe('Herrería del Norte')
  })

  it('encuentra por ID exacto', () => {
    expect(searchWorld('z1', world).some((r) => r.kind === 'zone')).toBe(true)
  })

  it('encuentra por nombre de tipo', () => {
    const r = searchWorld('tienda', world)
    expect(r.some((x) => x.kind === 'entity')).toBe(true)
  })

  it('encuentra zonas y rutas por su nombre', () => {
    expect(searchWorld('bosque', world).some((r) => r.kind === 'route')).toBe(true)
    expect(searchWorld('centro', world).some((r) => r.kind === 'zone')).toBe(true)
  })

  it('respeta el límite de resultados', () => {
    const many = Array.from({ length: 30 }, (_, i) => entity({ worldId: `w${i}`, name: `Tienda ${i}` }))
    expect(searchWorld('tienda', { entities: many, zones: [], routes: [] }, 10)).toHaveLength(10)
  })

  it('entityTypeLabel traduce el tipo', () => {
    expect(entityTypeLabel(WorldEntityType.Npc)).toBe('NPC')
  })
})
