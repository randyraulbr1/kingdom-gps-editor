import type { ItemRarity } from './item'

/** Categoría de monstruo; hace de "categoría" para el framework de contenido. */
export type MonsterCategory = 'beast' | 'undead' | 'humanoid' | 'elemental' | 'dragon' | 'demon' | 'boss' | 'other'

export interface Monster {
  id: number
  name: string
  description: string
  category: MonsterCategory
  rarity: ItemRarity
  iconId: number | null
  level: number
  hp: number
  damage: number
  defense: number
  speed: number
  /** Experiencia que otorga al derrotarlo. */
  xpReward: number
  /** Monedas que otorga al derrotarlo. */
  coinReward: number
  scripts: string[]
  flags: string[]
  checks: string[]
  createdAt: string
  updatedAt: string
}

export type MonsterInput = Omit<Monster, 'id' | 'createdAt' | 'updatedAt'>

export interface MonsterQuery {
  search?: string
  /** string (no MonsterCategory) para ser compatible con la query genérica del framework. */
  category?: string
  rarity?: ItemRarity
  limit?: number
  offset?: number
}

export const MONSTER_CATEGORIES: MonsterCategory[] = [
  'beast',
  'undead',
  'humanoid',
  'elemental',
  'dragon',
  'demon',
  'boss',
  'other'
]

export function createEmptyMonsterInput(): MonsterInput {
  return {
    name: 'Nuevo monstruo',
    description: '',
    category: 'beast',
    rarity: 'common',
    iconId: null,
    level: 1,
    hp: 100,
    damage: 10,
    defense: 0,
    speed: 1,
    xpReward: 20,
    coinReward: 5,
    scripts: [],
    flags: [],
    checks: []
  }
}
