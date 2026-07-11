import { createContentStore } from '@renderer/shared/content/createContentStore'
import type { Item } from '@shared-types/item'

/** Store del módulo Objetos, migrado a la fábrica genérica del framework de contenido (antes: store/itemsStore.ts a mano). */
export const useItemsStore = createContentStore<Item>()
