import { describe, it, expect } from 'vitest'
import {
  collectReferences,
  getReferencesTo,
  getBrokenReferences,
  worldIdsWithBrokenRefs,
  unlinkReference
} from './referenceService'
import { writeNpcConfig, DEFAULT_NPC_CONFIG } from './npcConfig'
import { writeChestConfig, DEFAULT_CHEST_CONFIG } from './chestConfig'
import { WorldEntityType, WorldSyncStatus, type WorldEntity } from '@shared-types/world'

function base(overrides: Partial<WorldEntity> = {}): WorldEntity {
  return {
    worldId: 'w',
    entityType: WorldEntityType.Marker,
    entityId: null,
    name: 'X',
    position: { lat: 0, lng: 0 },
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

function npcWithStepTarget(worldId: string, targetWorldId: string): WorldEntity {
  return base({
    worldId,
    name: `NPC ${worldId}`,
    entityType: WorldEntityType.Npc,
    properties: writeNpcConfig(null, {
      ...DEFAULT_NPC_CONFIG,
      quest: { title: 'M', description: '', status: 'available', steps: [{ id: 's1', description: 'ir', targetWorldId }] }
    })
  })
}

function chestRequiring(worldId: string, requiredQuestWorldId: string): WorldEntity {
  return base({
    worldId,
    name: `Cofre ${worldId}`,
    entityType: WorldEntityType.Chest,
    properties: writeChestConfig(null, { ...DEFAULT_CHEST_CONFIG, requiredQuestWorldId })
  })
}

describe('administrador de referencias', () => {
  it('collectReferences reúne pasos de misión de NPC y misión requerida de cofre', () => {
    const target = base({ worldId: 'w_target', name: 'Objetivo' })
    const refs = collectReferences([target, npcWithStepTarget('w_npc', 'w_target'), chestRequiring('w_chest', 'w_target')])
    expect(refs).toHaveLength(2)
    expect(refs.map((r) => r.relation).sort()).toEqual(['chest_required_quest', 'npc_quest_step'])
  })

  it('getReferencesTo lista quién usa un pin (usado por)', () => {
    const entities = [base({ worldId: 'w_target' }), npcWithStepTarget('w_npc', 'w_target')]
    const used = getReferencesTo('w_target', entities)
    expect(used).toHaveLength(1)
    expect(used[0].fromWorldId).toBe('w_npc')
  })

  it('getBrokenReferences detecta referencias a pines inexistentes', () => {
    const entities = [npcWithStepTarget('w_npc', 'w_borrado')]
    const broken = getBrokenReferences(entities)
    expect(broken).toHaveLength(1)
    expect(worldIdsWithBrokenRefs(entities).has('w_npc')).toBe(true)
  })

  it('unlinkReference quita el paso de misión del NPC hacia el objetivo', () => {
    const npc = npcWithStepTarget('w_npc', 'w_target')
    const newProps = unlinkReference(npc, 'w_target', 'npc_quest_step')
    const steps = ((newProps.npc as { quest: { steps: Array<{ targetWorldId: string | null }> } }).quest.steps)
    expect(steps[0].targetWorldId).toBeNull()
  })

  it('unlinkReference quita la misión requerida del cofre', () => {
    const chest = chestRequiring('w_chest', 'w_target')
    const newProps = unlinkReference(chest, 'w_target', 'chest_required_quest')
    expect((newProps.chest as { requiredQuestWorldId: string | null }).requiredQuestWorldId).toBeNull()
  })
})
