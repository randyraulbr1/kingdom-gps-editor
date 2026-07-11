import { ContentModulePanel, type ContentModuleConfig } from '@renderer/shared/content/ContentModulePanel'
import type { ContentColumn } from '@renderer/shared/content/contentTypes'
import { ITEM_RARITIES } from '@shared-types/item'
import { ARMOR_SLOTS, createEmptyArmorInput, type Armor } from '@shared-types/armor'
import { useArmorStore } from '../store'
import { ArmorInspector } from './ArmorInspector'

const TABLE_COLUMNS: ContentColumn<Armor>[] = [
  { header: 'Defensa', render: (armor) => armor.defense },
  { header: 'Res. mágica', render: (armor) => armor.magicResist },
  { header: 'Nivel', render: (armor) => armor.requiredLevel }
]

const CONFIG: ContentModuleConfig<Armor> = {
  labelPlural: 'armaduras',
  createLabel: 'Nueva armadura',
  searchPlaceholder: 'Buscar armaduras...',
  emptyText: 'Sin armaduras. Usa "Nueva armadura" para crear la primera.',
  categoryOptions: ARMOR_SLOTS,
  rarityOptions: ITEM_RARITIES,
  tableColumns: TABLE_COLUMNS,
  onExport: () => void window.api.export.armor()
}

/** Panel del módulo Armaduras: todo el módulo se reduce a esta composición sobre el framework de contenido. */
export function ArmorPanel(): JSX.Element {
  return (
    <ContentModulePanel
      useStore={useArmorStore}
      api={window.api.armor}
      createEmpty={createEmptyArmorInput}
      config={CONFIG}
      inspector={<ArmorInspector />}
    />
  )
}
