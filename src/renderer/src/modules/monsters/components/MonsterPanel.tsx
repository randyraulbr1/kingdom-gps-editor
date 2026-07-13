import { ContentModulePanel, type ContentModuleConfig } from '@renderer/shared/content/ContentModulePanel'
import type { ContentColumn } from '@renderer/shared/content/contentTypes'
import { ITEM_RARITIES } from '@shared-types/item'
import { MONSTER_CATEGORIES, createEmptyMonsterInput, type Monster } from '@shared-types/monster'
import { useMonsterStore } from '../store'
import { MonsterInspector } from './MonsterInspector'

const TABLE_COLUMNS: ContentColumn<Monster>[] = [
  { header: 'Nivel', render: (m) => m.level },
  { header: 'Vida', render: (m) => m.hp },
  { header: 'Daño', render: (m) => m.damage },
  { header: 'XP', render: (m) => m.xpReward }
]

const CONFIG: ContentModuleConfig<Monster> = {
  labelPlural: 'monstruos',
  createLabel: 'Nuevo monstruo',
  searchPlaceholder: 'Buscar monstruos...',
  emptyText: 'Sin monstruos. Usa "Nuevo monstruo" para crear el primero.',
  categoryOptions: MONSTER_CATEGORIES,
  rarityOptions: ITEM_RARITIES,
  tableColumns: TABLE_COLUMNS,
  onExport: () => void window.api.export.monsters()
}

/** Panel del módulo Monstruos (bestiario): composición sobre el framework de contenido. */
export function MonsterPanel(): JSX.Element {
  return (
    <ContentModulePanel
      useStore={useMonsterStore}
      api={window.api.monsters}
      createEmpty={createEmptyMonsterInput}
      config={CONFIG}
      inspector={<MonsterInspector />}
    />
  )
}
