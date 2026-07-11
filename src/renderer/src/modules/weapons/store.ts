import { createContentStore } from '@renderer/shared/content/createContentStore'
import type { Weapon } from '@shared-types/weapon'

/** Store del módulo Armas, creado con la fábrica genérica del framework de contenido. */
export const useWeaponsStore = createContentStore<Weapon>()
