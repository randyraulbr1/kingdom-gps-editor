/**
 * Administrador de referencias (doc 19).
 *
 * Las referencias entre entidades del mapa usan `worldId` estables (nunca
 * nombres). Hoy existen dos relaciones basadas en worldId:
 *  - un paso de misión de un NPC que apunta a otro pin (`npc.quest.steps[].targetWorldId`);
 *  - un cofre que exige una misión ubicada en otro pin (`chest.requiredQuestWorldId`).
 *
 * Este servicio (lógica pura) permite responder "¿quién usa este pin?" (usado
 * por), detectar referencias rotas y desvincular referencias antes de un borrado
 * seguro. Es extensible: al añadir nuevas relaciones por worldId, se amplía
 * `collectReferences`.
 */

import { WorldEntityType, type WorldEntity } from '@shared-types/world'
import { readNpcConfig, writeNpcConfig } from './npcConfig'
import { readChestConfig, writeChestConfig } from './chestConfig'

export type RelationKind = 'npc_quest_step' | 'chest_required_quest'

export interface Reference {
  fromWorldId: string
  fromName: string
  fromType: WorldEntityType
  toWorldId: string
  relation: RelationKind
  /** Texto legible de la relación. */
  label: string
}

/** Reúne todas las referencias por worldId presentes en el mundo. */
export function collectReferences(entities: WorldEntity[]): Reference[] {
  const refs: Reference[] = []
  for (const e of entities) {
    if (e.entityType === WorldEntityType.Npc) {
      const npc = readNpcConfig(e.properties)
      for (const step of npc.quest?.steps ?? []) {
        if (step.targetWorldId) {
          refs.push({
            fromWorldId: e.worldId,
            fromName: e.name,
            fromType: e.entityType,
            toWorldId: step.targetWorldId,
            relation: 'npc_quest_step',
            label: `Paso de misión "${step.description || 'sin nombre'}"`
          })
        }
      }
    } else if (e.entityType === WorldEntityType.Chest) {
      const chest = readChestConfig(e.properties)
      if (chest.requiredQuestWorldId) {
        refs.push({
          fromWorldId: e.worldId,
          fromName: e.name,
          fromType: e.entityType,
          toWorldId: chest.requiredQuestWorldId,
          relation: 'chest_required_quest',
          label: 'Misión requerida del cofre'
        })
      }
    }
  }
  return refs
}

/** ¿Quién usa este pin? (referencias entrantes hacia `worldId`). */
export function getReferencesTo(worldId: string, entities: WorldEntity[]): Reference[] {
  return collectReferences(entities).filter((r) => r.toWorldId === worldId)
}

/** Referencias cuyo destino ya no existe (rotas). */
export function getBrokenReferences(entities: WorldEntity[]): Reference[] {
  const ids = new Set(entities.map((e) => e.worldId))
  return collectReferences(entities).filter((r) => !ids.has(r.toWorldId))
}

/** worldIds de entidades que tienen al menos una referencia saliente rota. */
export function worldIdsWithBrokenRefs(entities: WorldEntity[]): Set<string> {
  return new Set(getBrokenReferences(entities).map((r) => r.fromWorldId))
}

/**
 * Devuelve las propiedades de la entidad `from` con la referencia hacia
 * `toWorldId` eliminada (desvinculada), para la relación indicada. No muta la
 * entidad original; el llamador persiste el resultado y registra undo/redo.
 */
export function unlinkReference(from: WorldEntity, toWorldId: string, relation: RelationKind): Record<string, unknown> {
  if (relation === 'npc_quest_step' && from.entityType === WorldEntityType.Npc) {
    const npc = readNpcConfig(from.properties)
    if (npc.quest) {
      npc.quest = {
        ...npc.quest,
        steps: npc.quest.steps.map((s) => (s.targetWorldId === toWorldId ? { ...s, targetWorldId: null } : s))
      }
    }
    return writeNpcConfig(from.properties, npc)
  }
  if (relation === 'chest_required_quest' && from.entityType === WorldEntityType.Chest) {
    const chest = readChestConfig(from.properties)
    if (chest.requiredQuestWorldId === toWorldId) {
      return writeChestConfig(from.properties, { ...chest, requiredQuestWorldId: null })
    }
  }
  return from.properties
}
