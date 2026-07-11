import { describe, it, expect } from 'vitest'
import {
  readEnemyConfig,
  writeEnemyConfig,
  validateEnemyConfig,
  nextEnemyState,
  rollLoot,
  DEFAULT_ENEMY_CONFIG,
  type EnemyConfig,
  type EnemyGpsRanges
} from './enemyConfig'

describe('config de enemigo', () => {
  it('devuelve valores por defecto sin propiedades', () => {
    expect(readEnemyConfig(undefined)).toEqual(DEFAULT_ENEMY_CONFIG)
    expect(readEnemyConfig({})).toEqual(DEFAULT_ENEMY_CONFIG)
  })

  it('sanea nivel, categoría y cantidades', () => {
    const cfg = readEnemyConfig({ enemy: { category: 'x', stats: { level: 0 }, spawn: { minEnemyCount: 0 } } })
    expect(cfg.category).toBe('beast')
    expect(cfg.stats.level).toBe(1)
    expect(cfg.spawn.minEnemyCount).toBe(1)
  })

  it('normaliza loot: maxQty nunca menor que minQty, probabilidad en 0..1', () => {
    const cfg = readEnemyConfig({ enemy: { loot: [{ itemName: 'Oro', probability: 5, minQty: 3, maxQty: 1 }] } })
    expect(cfg.loot[0].probability).toBe(1)
    expect(cfg.loot[0].minQty).toBe(3)
    expect(cfg.loot[0].maxQty).toBe(3)
    expect(cfg.loot[0].id).toBeTruthy()
  })

  it('round-trip conserva otras propiedades', () => {
    const config: EnemyConfig = { ...DEFAULT_ENEMY_CONFIG, enemyName: 'Lobo', stats: { ...DEFAULT_ENEMY_CONFIG.stats, level: 5 } }
    const props = writeEnemyConfig({ npc: { a: 1 } }, config)
    expect(props.npc).toEqual({ a: 1 })
    expect(readEnemyConfig(props)).toEqual(config)
  })
})

describe('validación del enemigo', () => {
  it('exige nombre y detecta ataque > persecución', () => {
    const config: EnemyConfig = {
      ...DEFAULT_ENEMY_CONFIG,
      enemyName: '',
      gps: { ...DEFAULT_ENEMY_CONFIG.gps, attackRadiusM: 400, pursuitRadiusM: 250 }
    }
    const codes = validateEnemyConfig(config).map((e) => e.code)
    expect(codes).toContain('no_enemy_name')
    expect(codes).toContain('attack_gt_pursuit')
  })

  it('marca tiempos de spawn inválidos', () => {
    const config: EnemyConfig = {
      ...DEFAULT_ENEMY_CONFIG,
      enemyName: 'Ok',
      spawn: { ...DEFAULT_ENEMY_CONFIG.spawn, spawnMinSeconds: 200, spawnMaxSeconds: 100 }
    }
    expect(validateEnemyConfig(config).some((e) => e.code === 'invalid_spawn_times')).toBe(true)
  })

  it('config por defecto con nombre no tiene errores graves', () => {
    const config: EnemyConfig = { ...DEFAULT_ENEMY_CONFIG, enemyName: 'Lobo' }
    expect(validateEnemyConfig(config).filter((e) => e.severity === 'error')).toHaveLength(0)
  })
})

describe('IA de 4 estados con tolerancia GPS', () => {
  const gps: EnemyGpsRanges = {
    visibleRadiusM: 150,
    visionRadiusM: 100,
    pursuitRadiusM: 250,
    attackRadiusM: 40,
    returnRadiusM: 300,
    gpsToleranceM: 20
  }

  it('detecta y persigue al entrar en visión', () => {
    expect(nextEnemyState('idle', 90, gps)).toBe('chasing')
  })

  it('ataca dentro del radio de ataque', () => {
    expect(nextEnemyState('chasing', 30, gps)).toBe('attacking')
  })

  it('regresa al salir de la persecución', () => {
    expect(nextEnemyState('chasing', 260, gps)).toBe('returning')
  })

  it('vuelve a idle lejos del origen tras regresar', () => {
    expect(nextEnemyState('idle', 500, gps)).toBe('idle')
  })

  it('no persigue estando quieto si el jugador está fuera de visión pero dentro de persecución', () => {
    // 120 m: dentro de persecución pero fuera de visión (100). Estando idle no debe activarse.
    expect(nextEnemyState('idle', 120, gps)).toBe('idle')
  })
})

describe('simulación de loot', () => {
  it('entrega el objeto cuando el rng cae bajo la probabilidad', () => {
    const drops = rollLoot([{ id: 'l1', itemName: 'Oro', probability: 0.5, minQty: 2, maxQty: 2 }], () => 0.1)
    expect(drops).toHaveLength(1)
    expect(drops[0]).toEqual({ itemName: 'Oro', quantity: 2 })
  })

  it('no entrega cuando el rng supera la probabilidad', () => {
    const drops = rollLoot([{ id: 'l1', itemName: 'Oro', probability: 0.2, minQty: 1, maxQty: 1 }], () => 0.9)
    expect(drops).toHaveLength(0)
  })

  it('ignora filas sin nombre de objeto', () => {
    const drops = rollLoot([{ id: 'l1', itemName: '', probability: 1, minQty: 1, maxQty: 1 }], () => 0)
    expect(drops).toHaveLength(0)
  })
})
