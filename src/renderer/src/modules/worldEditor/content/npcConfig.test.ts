import { describe, it, expect } from 'vitest'
import {
  readNpcConfig,
  writeNpcConfig,
  npcPinBadge,
  simulateNpcInteraction,
  validateNpcReferences,
  DEFAULT_NPC_CONFIG,
  type NpcConfig
} from './npcConfig'
import { buildLinearGraphFromLines } from './dialogueGraph'

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

  it('migra líneas de diálogo antiguas a un grafo lineal', () => {
    const cfg = readNpcConfig({ npc: { dialogue: [{ text: 'Hola' }, { text: 'Adiós' }] } })
    expect(cfg.dialogue.nodes).toHaveLength(2)
    expect(cfg.dialogue.startNodeId).toBe(cfg.dialogue.nodes[0].id)
    expect(cfg.dialogue.nodes[0].options[0].nextNodeId).toBe(cfg.dialogue.nodes[1].id)
  })

  it('lee un grafo de diálogo ya existente sin volver a migrar', () => {
    const dialogue = buildLinearGraphFromLines([{ id: 'n1', text: 'A' }])
    const cfg = readNpcConfig({ npc: { dialogue } })
    expect(cfg.dialogue.nodes[0].id).toBe('n1')
  })

  it('round-trip: escribir y leer devuelve la misma config, conservando otras propiedades', () => {
    const config: NpcConfig = {
      displayName: 'Herrero',
      action: 'give_quest',
      interactionRadiusM: 40,
      minLevel: 3,
      dialogue: buildLinearGraphFromLines([{ id: 'l1', text: '¿Buscas trabajo?' }]),
      quest: {
        title: 'La espada rota',
        description: 'Trae 3 lingotes',
        status: 'available',
        steps: [{ id: 's1', description: 'Ir a la mina', targetWorldId: 'w_mina' }]
      }
    }
    const props = writeNpcConfig({ shop: { x: 1 } }, config)
    expect(props.shop).toEqual({ x: 1 })
    expect(readNpcConfig(props)).toEqual(config)
  })
})

describe('indicador visual del pin NPC', () => {
  it('muestra ! con misión disponible y ? con misión lista', () => {
    expect(npcPinBadge({ ...DEFAULT_NPC_CONFIG, quest: { title: 'x', description: '', status: 'available', steps: [] } })).toBe('!')
    expect(npcPinBadge({ ...DEFAULT_NPC_CONFIG, quest: { title: 'x', description: '', status: 'ready', steps: [] } })).toBe('?')
  })

  it('muestra carrito para comerciante y nada para diálogo simple', () => {
    expect(npcPinBadge({ ...DEFAULT_NPC_CONFIG, action: 'open_shop' })).toBe('🛒')
    expect(npcPinBadge(DEFAULT_NPC_CONFIG)).toBeNull()
  })
})

describe('validación de referencias del NPC', () => {
  it('marca un paso de misión cuyo pin objetivo ya no existe', () => {
    const config: NpcConfig = {
      ...DEFAULT_NPC_CONFIG,
      quest: { title: 'x', description: '', status: 'available', steps: [{ id: 's1', description: 'Ir', targetWorldId: 'w_borrado' }] }
    }
    const errors = validateNpcReferences(config, new Set(['w_otro']))
    expect(errors.some((e) => e.code === 'quest_step_missing_target')).toBe(true)
  })

  it('no marca error si el pin objetivo existe', () => {
    const config: NpcConfig = {
      ...DEFAULT_NPC_CONFIG,
      action: 'give_quest', // evita el aviso de "hablar sin diálogo"
      quest: { title: 'x', description: '', status: 'available', steps: [{ id: 's1', description: 'Ir', targetWorldId: 'w1' }] }
    }
    expect(validateNpcReferences(config, new Set(['w1']))).toHaveLength(0)
  })

  it('avisa si la acción es hablar pero no hay diálogo', () => {
    const errors = validateNpcReferences({ ...DEFAULT_NPC_CONFIG, action: 'talk' }, new Set())
    expect(errors.some((e) => e.code === 'no_dialogue_for_talk')).toBe(true)
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
