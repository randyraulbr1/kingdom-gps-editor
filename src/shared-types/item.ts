export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export type ItemCategory =
  | 'weapon'
  | 'armor'
  | 'tool'
  | 'resource'
  | 'food'
  | 'crop'
  | 'construction'
  | 'misc'

export interface ItemBonus {
  stat: string
  value: number
}

export interface Item {
  id: number
  name: string
  description: string
  category: ItemCategory
  rarity: ItemRarity
  iconId: number | null
  value: number
  weight: number
  stackSize: number
  durability: number | null
  healthRestore: number | null
  foodRestore: number | null
  manaRestore: number | null
  requiredLevel: number
  requiredProfession: string | null
  weaponType: string | null
  armorType: string | null
  bonuses: ItemBonus[]
  scripts: string[]
  flags: string[]
  checks: string[]
  createdAt: string
  updatedAt: string
}

/** What the caller supplies to create an item - id/createdAt/updatedAt are always server-assigned. */
export type ItemInput = Omit<Item, 'id' | 'createdAt' | 'updatedAt'>

export interface ItemQuery {
  search?: string
  /** string (no ItemCategory) para ser compatible con la query genérica del framework de contenido. */
  category?: string
  rarity?: ItemRarity
  limit?: number
  offset?: number
}

export const ITEM_CATEGORIES: ItemCategory[] = [
  'weapon',
  'armor',
  'tool',
  'resource',
  'food',
  'crop',
  'construction',
  'misc'
]

export const ITEM_RARITIES: ItemRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']

export function createEmptyItemInput(): ItemInput {
  return {
    name: 'Nuevo objeto',
    description: '',
    category: 'misc',
    rarity: 'common',
    iconId: null,
    value: 0,
    weight: 0,
    stackSize: 1,
    durability: null,
    healthRestore: null,
    foodRestore: null,
    manaRestore: null,
    requiredLevel: 1,
    requiredProfession: null,
    weaponType: null,
    armorType: null,
    bonuses: [],
    scripts: [],
    flags: [],
    checks: []
  }
}
