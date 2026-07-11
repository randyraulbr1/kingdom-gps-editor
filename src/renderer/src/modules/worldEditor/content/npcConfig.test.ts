import { describe, it, expect } from 'vitest'
import {
  readNpcConfig,
  writeNpcConfig,
  npcPinBadge,
  simulateNpcInteraction,
  DEFAULT_NPC_CONFIG,
  type NpcConfig
} from './npcConfig'

describe('config de NPC', () => {
  it('devuelve valores por defecto cuando no hay propiedades', () => {
    expect(readNpcConfig(undefined)).toEqual(DEFAULT_NPC_CONFIG)
    expect(readNpcConfig({})).toEqual(DEFAULT_NPC_CONFIG)
  })

  it('sanea acción y radio inválidos', () => {
    const cfg = readNpcConfig({ npc: { action: 'inexistente', interactionRadiusM: 0, minLevel: -3 } })
    expect(cfg.action).toBe('talk')
    expect(cfg.interactionRadiusM).toBe(1)
    expect(cfg.minLevel).toBe(0)
  })

  it('normaliza líneas de diálogo y asigna id si falta', () => {
    const cfg = readNpcConfig({ npc: { dialogue: [{ text: 'Hola' }] } })
    expect(cfg.dialogue).toHaveLength(1)
    expect(cfg.dialogue[0].text).toBe('Hola')
    expect(cfg.dialogue[0].id).toBeTruthy()
  })

  it('round-trip: escribir y leer devuelve la misma config, conservando otras propiedades', () => {
    const config: NpcConfig = {
      displayName: 'Herrero',
      action: 'give_quest',
      interactionRadiusM: 40,
      minLevel: 3,
      dialogue: [{ id: 'l1', text: '¿Buscas trabajo?' }],
      quest: { title: 'La espada rota', description: 'Trae 3 lingotes', status: 'available' }
    }
    const props = writeNpcConfig({ shop: { x: 1 } }, config)
    expect(props.shop).toEqual({ x: 1 })
    expect(readNpcConfig(props)).toEqual(config)
  })
})

describe('indicador visual del pin NPC', () => {
  it('muestra ! con misión disponible y ? con misión lista', () => {
    expect(npcPinBadge({ ...DEFAULT_NPC_CONFIG, quest: { title: 'x', description: '', status: 'available' } })).toBe('!')
    expect(npcPinBadge({ ...DEFAULT_NPC_CONFIG, quest: { title: 'x', description: '', status: 'ready' } })).toBe('?')
  })

  it('muestra carrito para comerciante y nada para diálogo simple', () => {
    expect(npcPinBadge({ ...DEFAULT_NPC_CONFIG, action: 'open_shop' })).toBe('🛒')
    expect(npcPinBadge(DEFAULT_NPC_CONFIG)).toBeNull()
  })
})

describe('simulación de interacción NPC (Probar interacción)', () => {
  it('rechaza fuera de rango', () => {
    const r = simulateNpcInteraction({ distanceM: 100, interactionRadiusM: 25, playerLevel: 5, minLevel: 0, action: 'talk', hasDialogue: true })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('out_of_range')
  })

  it('rechaza por nivel insuficiente', () => {
    const r = simulateNpcInteraction({ distanceM: 5, interactionRadiusM: 25, playerLevel: 1, minLevel: 5, action: 'talk', hasDialogue: true })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('insufficient_level')
  })

  it('rechaza hablar sin diálogo', () => {
    const r = simulateNpcInteraction({ distanceM: 5, interactionRadiusM: 25, playerLevel: 5, minLevel: 0, action: 'talk', hasDialogue: false })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('no_dialogue')
  })

  it('acepta la interacción cuando se cumplen las condiciones', () => {
    const r = simulateNpcInteraction({ distanceM: 5, interactionRadiusM: 25, playerLevel: 5, minLevel: 0, action: 'give_quest', hasDialogue: false })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.action).toBe('give_quest')
  })
})
