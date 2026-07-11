import { describe, it, expect } from 'vitest'
import {
  readShopConfig,
  writeShopConfig,
  simulatePurchase,
  DEFAULT_SHOP_CONFIG,
  type ShopConfig
} from './shopConfig'

describe('config de tienda', () => {
  it('devuelve valores por defecto cuando no hay propiedades', () => {
    expect(readShopConfig(undefined)).toEqual(DEFAULT_SHOP_CONFIG)
    expect(readShopConfig({})).toEqual(DEFAULT_SHOP_CONFIG)
  })

  it('sanea tipos y radios inválidos', () => {
    const cfg = readShopConfig({ shop: { shopType: 'inexistente', interactionRadiusM: -5, status: 'x' } })
    expect(cfg.shopType).toBe('general')
    expect(cfg.interactionRadiusM).toBe(1)
    expect(cfg.status).toBe('draft')
  })

  it('normaliza filas de catálogo y les asigna id si falta', () => {
    const cfg = readShopConfig({
      shop: { catalog: [{ itemName: 'Poción', buyPrice: 10, sellPrice: 5, stock: 3, requiredLevel: 2 }] }
    })
    expect(cfg.catalog).toHaveLength(1)
    expect(cfg.catalog[0].itemName).toBe('Poción')
    expect(cfg.catalog[0].id).toBeTruthy()
  })

  it('escribe la config bajo la clave shop conservando otras propiedades', () => {
    const config: ShopConfig = { ...DEFAULT_SHOP_CONFIG, shopType: 'potions' }
    const props = writeShopConfig({ npc: { foo: 1 } }, config)
    expect((props.shop as ShopConfig).shopType).toBe('potions')
    expect(props.npc).toEqual({ foo: 1 })
  })

  it('round-trip: escribir y leer devuelve la misma config', () => {
    const config: ShopConfig = {
      shopType: 'weapons',
      interactionRadiusM: 50,
      status: 'active',
      catalog: [{ id: 'r1', itemName: 'Espada', buyPrice: 100, sellPrice: 40, stock: -1, requiredLevel: 5 }]
    }
    expect(readShopConfig(writeShopConfig(null, config))).toEqual(config)
  })
})

describe('simulación de compra (Probar tienda)', () => {
  const item = { itemName: 'Poción', buyPrice: 20, stock: 5, requiredLevel: 1 }

  it('rechaza si el jugador está fuera del radio', () => {
    const r = simulatePurchase({ playerMoney: 100, distanceM: 80, interactionRadiusM: 30, item, playerLevel: 5 })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('out_of_range')
  })

  it('rechaza por nivel insuficiente', () => {
    const r = simulatePurchase({
      playerMoney: 100,
      distanceM: 10,
      interactionRadiusM: 30,
      item: { ...item, requiredLevel: 10 },
      playerLevel: 3
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('insufficient_level')
  })

  it('rechaza sin existencias', () => {
    const r = simulatePurchase({ playerMoney: 100, distanceM: 10, interactionRadiusM: 30, item: { ...item, stock: 0 }, playerLevel: 5 })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('out_of_stock')
  })

  it('rechaza por dinero insuficiente', () => {
    const r = simulatePurchase({ playerMoney: 5, distanceM: 10, interactionRadiusM: 30, item, playerLevel: 5 })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('insufficient_money')
  })

  it('acepta la compra y descuenta el dinero', () => {
    const r = simulatePurchase({ playerMoney: 100, distanceM: 10, interactionRadiusM: 30, item, playerLevel: 5 })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.remainingMoney).toBe(80)
  })
})
