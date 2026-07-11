import { ContentModulePanel, type ContentModuleConfig } from '@renderer/shared/content/ContentModulePanel'
import type { ContentColumn } from '@renderer/shared/content/contentTypes'
import { ITEM_CATEGORIES, ITEM_RARITIES, createEmptyItemInput, type Item } from '@shared-types/item'
import { useItemsStore } from '../store'
import { ItemInspector } from './ItemInspector'

const TABLE_COLUMNS: ContentColumn<Item>[] = [
  { header: 'Valor', render: (item) => item.value },
  { header: 'Peso', render: (item) => item.weight },
  { header: 'Nivel', render: (item) => item.requiredLevel }
]

const CONFIG: ContentModuleConfig<Item> = {
  labelPlural: 'objetos',
  createLabel: 'Nuevo objeto',
  searchPlaceholder: 'Buscar objetos...',
  emptyText: 'Sin objetos. Usa "Nuevo objeto" para crear el primero.',
  categoryOptions: ITEM_CATEGORIES,
  rarityOptions: ITEM_RARITIES,
  tableColumns: TABLE_COLUMNS,
  onExport: () => void window.api.export.items()
}

/**
 * Panel del módulo Objetos, migrado al framework de contenido genérico (antes
 * era la implementación "a mano" que sirvió de referencia para Armas y
 * Armaduras). Misma composición que WeaponsPanel/ArmorPanel.
 */
export function ItemsPanel(): JSX.Element {
  return (
    <ContentModulePanel
      useStore={useItemsStore}
      api={window.api.items}
      createEmpty={createEmptyItemInput}
      config={CONFIG}
      inspector={<ItemInspector />}
    />
  )
}
