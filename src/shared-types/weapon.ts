import type { ItemRarity, ItemBonus, IconRegion } from './item'

export type WeaponClass =
  | 'sword'
  | 'axe'
  | 'mace'
  | 'dagger'
  | 'spear'
  | 'bow'
  | 'crossbow'
  | 'staff'
  | 'wand'
  | 'shield'
  | 'misc'

export interface Weapon {
  id: number
  name: string
  description: string
  /** Clase de arma; hace de "categoría" para el framework de contenido. */
  category: WeaponClass
  rarity: ItemRarity
  iconId: number | null
  iconRef: IconRegion | null
  /** Daño base por golpe. */
  damage: number
  /** Golpes por segundo. */
  attackSpeed: number
  /** Alcance en metros. */
  range: number
  /** Probabilidad de crítico (0-100). */
  critChance: number
  value: number
  weight: number
  requiredLevel: number
  requiredProfession: string | null
  bonuses: ItemBonus[]
  scripts: string[]
  flags: string[]
  checks: string[]
  createdAt: string
  updatedAt: string
}

export type WeaponInput = Omit<Weapon, 'id' | 'createdAt' | 'updatedAt'>

export interface WeaponQuery {
  search?: string
  /** string (no WeaponClass) para ser compatible con la query genérica del framework. */
  category?: string
  rarity?: ItemRarity
  limit?: number
  offset?: number
}

export const WEAPON_CLASSES: WeaponClass[] = [
  'sword',
  'axe',
  'mace',
  'dagger',
  'spear',
  'bow',
  'crossbow',
  'staff',
  'wand',
  'shield',
  'misc'
]

export function createEmptyWeaponInput(): WeaponInput {
  return {
    name: 'Nueva arma',
    description: '',
    category: 'sword',
    rarity: 'common',
    iconId: null,
    iconRef: null,
    damage: 1,
    attackSpeed: 1,
    range: 1,
    critChance: 0,
    value: 0,
    weight: 1,
    requiredLevel: 1,
    requiredProfession: null,
    bonuses: [],
    scripts: [],
    flags: [],
    checks: []
  }
}
