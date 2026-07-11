import { ContentModulePanel, type ContentModuleConfig } from '@renderer/shared/content/ContentModulePanel'
import type { ContentColumn } from '@renderer/shared/content/contentTypes'
import { ITEM_RARITIES } from '@shared-types/item'
import { WEAPON_CLASSES, createEmptyWeaponInput, type Weapon } from '@shared-types/weapon'
import { useWeaponsStore } from '../store'
import { WeaponInspector } from './WeaponInspector'

const TABLE_COLUMNS: ContentColumn<Weapon>[] = [
  { header: 'Daño', render: (weapon) => weapon.damage },
  { header: 'Vel.', render: (weapon) => weapon.attackSpeed },
  { header: 'Alcance', render: (weapon) => weapon.range },
  { header: 'Nivel', render: (weapon) => weapon.requiredLevel }
]

const CONFIG: ContentModuleConfig<Weapon> = {
  labelPlural: 'armas',
  createLabel: 'Nueva arma',
  searchPlaceholder: 'Buscar armas...',
  emptyText: 'Sin armas. Usa "Nueva arma" para crear la primera.',
  categoryOptions: WEAPON_CLASSES,
  rarityOptions: ITEM_RARITIES,
  tableColumns: TABLE_COLUMNS,
  onExport: () => void window.api.export.weapons()
}

/** Panel del módulo Armas: todo el módulo se reduce a esta composición sobre el framework de contenido. */
export function WeaponsPanel(): JSX.Element {
  return (
    <ContentModulePanel
      useStore={useWeaponsStore}
      api={window.api.weapons}
      createEmpty={createEmptyWeaponInput}
      config={CONFIG}
      inspector={<WeaponInspector />}
    />
  )
}
