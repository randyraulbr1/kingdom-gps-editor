import type { ItemRarity, ItemBonus } from './item'

/** Slot de equipamiento; hace de "categoría" para el framework de contenido. */
export type ArmorSlot = 'head' | 'chest' | 'legs' | 'boots' | 'gloves' | 'shield' | 'cape' | 'misc'

export interface Armor {
  id: number
  name: string
  description: string
  category: ArmorSlot
  rarity: ItemRarity
  iconId: number | null
  /** Defensa física base. */
  defense: number
  /** Resistencia mágica base. */
  magicResist: number
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

export type ArmorInput = Omit<Armor, 'id' | 'createdAt' | 'updatedAt'>

export interface ArmorQuery {
  search?: string
  /** string (no ArmorSlot) para ser compatible con la query genérica del framework. */
  category?: string
  rarity?: ItemRarity
  limit?: number
  offset?: number
}

export const ARMOR_SLOTS: ArmorSlot[] = ['head', 'chest', 'legs', 'boots', 'gloves', 'shield', 'cape', 'misc']

export function createEmptyArmorInput(): ArmorInput {
  return {
    name: 'Nueva armadura',
    description: '',
    category: 'chest',
    rarity: 'common',
    iconId: null,
    defense: 1,
    magicResist: 0,
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
