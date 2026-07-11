import { describe, it, expect } from 'vitest'
import {
  readResourceConfig,
  writeResourceConfig,
  validateResourceConfig,
  simulateGather,
  DEFAULT_RESOURCE_CONFIG,
  type ResourceConfig
} from './resourceConfig'

describe('config de recurso', () => {
  it('devuelve valores por defecto sin propiedades', () => {
    expect(readResourceConfig(undefined)).toEqual(DEFAULT_RESOURCE_CONFIG)
    expect(readResourceConfig({})).toEqual(DEFAULT_RESOURCE_CONFIG)
  })

  it('sanea categoría, rareza, modo y cantidades', () => {
    const cfg = readResourceConfig({ resource: { category: 'x', rarity: 'y', availabilityMode: 'z', minQty: 5, maxQty: 2 } })
    expect(cfg.category).toBe('wood')
    expect(cfg.rarity).toBe('common')
    expect(cfg.availabilityMode).toBe('personal')
    expect(cfg.maxQty).toBe(5)
  })

  it('round-trip conserva otras propiedades', () => {
    const config: ResourceConfig = { ...DEFAULT_RESOURCE_CONFIG, resourceName: 'Roble', category: 'wood', maxQty: 3 }
    const props = writeResourceConfig({ chest: { a: 1 } }, config)
    expect(props.chest).toEqual({ a: 1 })
    expect(readResourceConfig(props)).toEqual(config)
  })
})

describe('validación del recurso', () => {
  it('exige recurso asignado', () => {
    expect(validateResourceConfig(DEFAULT_RESOURCE_CONFIG).some((e) => e.code === 'no_resource_name')).toBe(true)
  })

  it('detecta radio menor que la tolerancia GPS', () => {
    const cfg: ResourceConfig = { ...DEFAULT_RESOURCE_CONFIG, resourceName: 'Agua', interactionRadiusM: 5 }
    expect(validateResourceConfig(cfg, 10).some((e) => e.code === 'radius_too_small')).toBe(true)
  })

  it('exige respawn > 0 salvo uso único', () => {
    const shared: ResourceConfig = { ...DEFAULT_RESOURCE_CONFIG, resourceName: 'Mineral', respawnSeconds: 0, availabilityMode: 'shared' }
    expect(validateResourceConfig(shared).some((e) => e.code === 'invalid_respawn')).toBe(true)
    const single: ResourceConfig = { ...shared, availabilityMode: 'single' }
    expect(validateResourceConfig(single).some((e) => e.code === 'invalid_respawn')).toBe(false)
  })
})

describe('simulación de recolección', () => {
  const cfg: ResourceConfig = { ...DEFAULT_RESOURCE_CONFIG, resourceName: 'Roble', minQty: 2, maxQty: 2, probability: 1, requiredTool: 'Hacha' }
  const base = { distanceM: 5, interactionRadiusM: 20, playerLevel: 5, minLevel: 0, requiredTool: 'Hacha', hasRequiredTool: true, inventoryFull: false, usesLeft: -1 }

  it('rechaza fuera de rango', () => {
    const r = simulateGather(cfg, { ...base, distanceM: 100 }, () => 0)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('out_of_range')
  })

  it('rechaza sin la herramienta requerida', () => {
    const r = simulateGather(cfg, { ...base, hasRequiredTool: false }, () => 0)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('missing_tool')
  })

  it('rechaza si está agotado', () => {
    const r = simulateGather(cfg, { ...base, usesLeft: 0 }, () => 0)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('exhausted')
  })

  it('rechaza con inventario lleno', () => {
    const r = simulateGather(cfg, { ...base, inventoryFull: true }, () => 0)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('inventory_full')
  })

  it('recolecta la cantidad configurada cuando todo se cumple', () => {
    const r = simulateGather(cfg, base, () => 0)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.quantity).toBe(2)
  })

  it('puede no obtener nada si la probabilidad no se cumple', () => {
    const lowProb: ResourceConfig = { ...cfg, probability: 0.1 }
    const r = simulateGather(lowProb, base, () => 0.9)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.quantity).toBe(0)
  })
})
