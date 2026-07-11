import { createContentStore } from '@renderer/shared/content/createContentStore'
import type { Armor } from '@shared-types/armor'

/** Store del módulo Armaduras, creado con la fábrica genérica del framework de contenido. */
export const useArmorStore = createContentStore<Armor>()
