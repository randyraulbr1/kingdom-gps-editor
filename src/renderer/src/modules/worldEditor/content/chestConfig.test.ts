import { describe, it, expect } from 'vitest'
import {
  readChestConfig,
  writeChestConfig,
  validateChestConfig,
  simulateOpenChest,
  rollChestReward,
  DEFAULT_CHEST_CONFIG,
  type ChestConfig
} from './chestConfig'

describe('config de cofre', () => {
  it('devuelve valores por defecto sin propiedades', () => {
    expect(readChestConfig(undefined)).toEqual(DEFAULT_CHEST_CONFIG)
    expect(readChestConfig({})).toEqual(DEFAULT_CHEST_CONFIG)
  })

  it('sanea monedas/exp para que el máximo nunca sea menor que el mínimo', () => {
    const cfg = readChestConfig({ chest: { minCoins: 100, maxCoins: 10, minXp: 50, maxXp: 5 } })
    expect(cfg.maxCoins).toBe(100)
    expect(cfg.maxXp).toBe(50)
  })

  it('round-trip conserva otras propiedades', () => {
    const config: ChestConfig = { ...DEFAULT_CHEST_CONFIG, minCoins: 10, maxCoins: 20, singleUse: false }
    const props = writeChestConfig({ enemy: { a: 1 } }, config)
    expect(props.enemy).toEqual({ a: 1 })
    expect(readChestConfig(props)).toEqual(config)
  })
})

describe('validación del cofre', () => {
  it('marca cofre vacío (sin loot, monedas ni exp)', () => {
    expect(validateChestConfig(DEFAULT_CHEST_CONFIG).some((e) => e.code === 'empty_table')).toBe(true)
  })

  it('no marca vacío si tiene monedas', () => {
    const cfg: ChestConfig = { ...DEFAULT_CHEST_CONFIG, minCoins: 5, maxCoins: 10 }
    expect(validateChestConfig(cfg).some((e) => e.code === 'empty_table')).toBe(false)
  })

  it('detecta misión requerida inexistente', () => {
    const cfg: ChestConfig = { ...DEFAULT_CHEST_CONFIG, maxCoins: 10, requiredQuestWorldId: 'w_borrado' }
    const errors = validateChestConfig(cfg, new Set(['w_otro']))
    expect(errors.some((e) => e.code === 'missing_quest_target')).toBe(true)
  })
})

describe('simulación de apertura de cofre', () => {
  const base = { distanceM: 5, interactionRadiusM: 20, playerLevel: 5, minLevel: 0, alreadyOpened: false, singleUse: true }

  it('rechaza fuera de rango', () => {
    const r = simulateOpenChest({ ...base, distanceM: 100 })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('out_of_range')
  })

  it('rechaza por nivel', () => {
    const r = simulateOpenChest({ ...base, minLevel: 10 })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('insufficient_level')
  })

  it('bloquea doble apertura si es de un solo uso', () => {
    const r = simulateOpenChest({ ...base, alreadyOpened: true })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('already_opened')
  })

  it('permite reabrir si es repetible', () => {
    const r = simulateOpenChest({ ...base, alreadyOpened: true, singleUse: false })
    expect(r.ok).toBe(true)
  })
})

describe('recompensa del cofre', () => {
  it('calcula monedas, experiencia y objetos con rng determinista', () => {
    const cfg: ChestConfig = {
      ...DEFAULT_CHEST_CONFIG,
      minCoins: 10,
      maxCoins: 10,
      minXp: 5,
      maxXp: 5,
      loot: [{ id: 'l1', itemName: 'Gema', probability: 1, minQty: 1, maxQty: 1 }]
    }
    const roll = rollChestReward(cfg, () => 0)
    expect(roll.coins).toBe(10)
    expect(roll.xp).toBe(5)
    expect(roll.items).toEqual([{ itemName: 'Gema', quantity: 1 }])
  })
})
