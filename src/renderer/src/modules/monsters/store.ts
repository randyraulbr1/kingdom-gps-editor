import { createContentStore } from '@renderer/shared/content/createContentStore'
import type { Monster } from '@shared-types/monster'

/** Store del módulo Monstruos, creado con la fábrica genérica del framework de contenido. */
export const useMonsterStore = createContentStore<Monster>()
