import { describe, it, expect } from 'vitest'
import {
  readRouteConfig,
  writeRouteConfig,
  routeLengthMeters,
  pickWeightedEntry,
  estimatedSpawnEvents,
  validateRoute,
  simulateRouteRun,
  DEFAULT_ROUTE_CONFIG,
  type EnemyRouteConfig,
  type EnemyRouteEntry
} from './enemyRoute'

const entries: EnemyRouteEntry[] = [
  { id: 'w', enemyName: 'Lobo', weight: 70, levelMin: 3, levelMax: 5, minCount: 1, maxCount: 3 },
  { id: 'a', enemyName: 'Lobo alfa', weight: 30, levelMin: 6, levelMax: 8, minCount: 1, maxCount: 1 }
]

describe('config de ruta de enemigos', () => {
  it('devuelve valores por defecto sin propiedades', () => {
    expect(readRouteConfig(undefined)).toEqual(DEFAULT_ROUTE_CONFIG)
    expect(readRouteConfig({})).toEqual(DEFAULT_ROUTE_CONFIG)
  })

  it('sanea estado y modo inválidos, y normaliza entradas', () => {
    const cfg = readRouteConfig({ status: 'x', spawnMode: 'y', entries: [{ enemyName: 'Rata', weight: 1, levelMin: 5, levelMax: 2 }] })
    expect(cfg.status).toBe('draft')
    expect(cfg.spawnMode).toBe('on_enter')
    expect(cfg.entries[0].levelMax).toBe(5) // corregido a >= min
    expect(cfg.entries[0].id).toBeTruthy()
  })

  it('round-trip: escribir y leer devuelve la misma config', () => {
    const config: EnemyRouteConfig = { ...DEFAULT_ROUTE_CONFIG, status: 'active', spawnMode: 'by_distance', entries }
    expect(readRouteConfig(writeRouteConfig(config))).toEqual(config)
  })
})

describe('longitud del trazado', () => {
  it('suma los segmentos en metros', () => {
    // ~111.3 km entre (0,0) y (0,1); la ruta tiene 2 segmentos iguales aprox.
    const length = routeLengthMeters([
      { lat: 0, lng: 0 },
      { lat: 0, lng: 1 },
      { lat: 0, lng: 2 }
    ])
    expect(length).toBeGreaterThan(200000)
    expect(length).toBeLessThan(230000)
  })

  it('0 con menos de 2 puntos', () => {
    expect(routeLengthMeters([{ lat: 0, lng: 0 }])).toBe(0)
  })
})

describe('selección ponderada', () => {
  it('elige la primera entrada cuando rng cae en su rango', () => {
    expect(pickWeightedEntry(entries, () => 0)?.enemyName).toBe('Lobo')
  })

  it('elige la segunda entrada cuando rng cae al final', () => {
    expect(pickWeightedEntry(entries, () => 0.99)?.enemyName).toBe('Lobo alfa')
  })

  it('devuelve null sin entradas válidas', () => {
    expect(pickWeightedEntry([{ id: 'x', enemyName: '', weight: 0, levelMin: 1, levelMax: 1, minCount: 1, maxCount: 1 }])).toBeNull()
  })
})

describe('estimación de eventos de spawn', () => {
  it('1 al entrar', () => {
    expect(estimatedSpawnEvents({ ...DEFAULT_ROUTE_CONFIG, spawnMode: 'on_enter' }, 1000)).toBe(1)
  })
  it('por distancia divide la longitud', () => {
    expect(estimatedSpawnEvents({ ...DEFAULT_ROUTE_CONFIG, spawnMode: 'by_distance', spawnDistanceM: 150 }, 600)).toBe(4)
  })
})

describe('validación de ruta', () => {
  it('exige al menos 2 puntos y enemigos', () => {
    const codes = validateRoute([{ lat: 0, lng: 0 }], DEFAULT_ROUTE_CONFIG).map((e) => e.code)
    expect(codes).toContain('too_few_points')
    expect(codes).toContain('no_enemies')
  })

  it('sin errores con puntos y enemigos válidos', () => {
    const cfg: EnemyRouteConfig = { ...DEFAULT_ROUTE_CONFIG, entries }
    const errors = validateRoute([{ lat: 0, lng: 0 }, { lat: 1, lng: 1 }], cfg)
    expect(errors.filter((e) => e.severity === 'error')).toHaveLength(0)
  })
})

describe('simulación de recorrido', () => {
  it('genera eventos de spawn con enemigo, nivel y cantidad', () => {
    const cfg: EnemyRouteConfig = { ...DEFAULT_ROUTE_CONFIG, spawnMode: 'by_distance', spawnDistanceM: 100000, entries }
    const events = simulateRouteRun([{ lat: 0, lng: 0 }, { lat: 0, lng: 2 }], cfg, () => 0)
    expect(events.length).toBeGreaterThan(0)
    expect(events[0].enemyName).toBe('Lobo')
    expect(events[0].level).toBe(3)
    expect(events[0].count).toBe(1)
  })
})
