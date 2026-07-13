import { describe, it, expect } from 'vitest'
import { buildShopData, buildEntityData, slug, WORLD_SCHEMA_VERSION, type PayloadEntity } from './worldPayload'

function shopEntity(overrides: Partial<PayloadEntity> = {}, shop: Record<string, unknown> = {}): PayloadEntity {
  return {
    worldId: 'shop_1',
    name: 'Tienda del puerto',
    enabled: true,
    properties: { shop },
    ...overrides
  }
}

describe('worldPayload · slug', () => {
  it('normaliza acentos y espacios a un id simple', () => {
    expect(slug('Caña de Pescar')).toBe('cana_de_pescar')
    expect(slug('Atún')).toBe('atun')
    expect(slug('  ')).toBe('')
  })
})

describe('worldPayload · buildShopData (contrato v1)', () => {
  it('incluye los campos base del contrato', () => {
    const data = buildShopData(shopEntity(), 22.98, -82.75)
    expect(data.schemaVersion).toBe(WORLD_SCHEMA_VERSION)
    expect(data.id).toBe('shop_1')
    expect(data.nombre).toBe('Tienda del puerto')
    expect(data.pos).toEqual([22.98, -82.75])
    expect(data.icono).toBe('🏪')
    expect(data.categoria).toBe('general')
    expect(data.radio).toBe(30)
    expect(data.activo).toBe(true)
  })

  it('mapea el catálogo a vende usando itemId cuando existe', () => {
    const data = buildShopData(
      shopEntity({}, { catalog: [{ itemId: 'sardina', itemName: 'Sardina', buyPrice: 10, stock: 5 }] }),
      0,
      0
    )
    expect(data.vende).toEqual([{ id: 'sardina', precio: 10, stock: 5 }])
  })

  it('usa un slug del nombre cuando no hay itemId', () => {
    const data = buildShopData(shopEntity({}, { catalog: [{ itemName: 'Caña de pescar', buyPrice: 120, stock: 2 }] }), 0, 0)
    expect(data.vende).toEqual([{ id: 'cana_de_pescar', precio: 120, stock: 2 }])
  })

  it('convierte stock -1 en infinito', () => {
    const data = buildShopData(shopEntity({}, { catalog: [{ itemId: 'agua', buyPrice: 3, stock: -1 }] }), 0, 0)
    expect(data.vende).toEqual([{ id: 'agua', precio: 3, infinito: true }])
  })

  it('descarta filas de catálogo sin id ni nombre utilizable', () => {
    const data = buildShopData(shopEntity({}, { catalog: [{ buyPrice: 5 }, { itemId: 'x', buyPrice: 1, stock: 0 }] }), 0, 0)
    expect(data.vende).toEqual([{ id: 'x', precio: 1, stock: 0 }])
  })

  it('respeta el radio propio y el icono personalizado', () => {
    const data = buildShopData(shopEntity({}, { interactionRadiusM: 80, icon: '🛒' }), 0, 0)
    expect(data.radio).toBe(80)
    expect(data.icono).toBe('🛒')
  })

  it('marca activo=false si el estado es paused/closed o la entidad está desactivada', () => {
    expect(buildShopData(shopEntity({}, { status: 'paused' }), 0, 0).activo).toBe(false)
    expect(buildShopData(shopEntity({}, { status: 'closed' }), 0, 0).activo).toBe(false)
    expect(buildShopData(shopEntity({ enabled: false }), 0, 0).activo).toBe(false)
    expect(buildShopData(shopEntity({}, { status: 'active' }), 0, 0).activo).toBe(true)
  })
})

describe('worldPayload · buildEntityData (otros tipos)', () => {
  it('para tipos no-tienda pasa propiedades + base', () => {
    const entity: PayloadEntity = { worldId: 'e1', name: 'Lobo', enabled: true, properties: { enemy: { hp: 50 } } }
    const data = buildEntityData(entity, 'enemy', 1, 2)
    expect(data.id).toBe('e1')
    expect(data.nombre).toBe('Lobo')
    expect(data.pos).toEqual([1, 2])
    expect(data.activo).toBe(true)
    expect((data.enemy as { hp: number }).hp).toBe(50)
  })

  it('para tienda delega en buildShopData (produce vende)', () => {
    const entity = shopEntity({}, { catalog: [{ itemId: 'sardina', buyPrice: 10, stock: 1 }] })
    const data = buildEntityData(entity, 'shop', 0, 0)
    expect(data.vende).toEqual([{ id: 'sardina', precio: 10, stock: 1 }])
  })
})
