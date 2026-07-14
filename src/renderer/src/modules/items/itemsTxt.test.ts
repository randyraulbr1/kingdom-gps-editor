import { describe, it, expect } from 'vitest'
import { parseItemsTxt, serializeItemsTxt, normalizeItemInput, buildItemsPrompt } from './itemsTxt'

describe('itemsTxt · normalizeItemInput', () => {
  it('rellena valores por defecto y saneados', () => {
    const item = normalizeItemInput({ name: 'Poción', category: 'food', foodRestore: 20 })
    expect(item.name).toBe('Poción')
    expect(item.category).toBe('food')
    expect(item.foodRestore).toBe(20)
    expect(item.rarity).toBe('common')
    expect(item.stackSize).toBe(1)
    expect(item.bonuses).toEqual([])
  })

  it('descarta categoría/rareza inválidas usando el valor por defecto', () => {
    const item = normalizeItemInput({ name: 'X', category: 'zzz', rarity: 'mitica' })
    expect(item.category).toBe('misc')
    expect(item.rarity).toBe('common')
  })

  it('normaliza bonuses y descarta los que no tienen stat', () => {
    const item = normalizeItemInput({ name: 'Espada', bonuses: [{ stat: 'attack', value: 10 }, { value: 5 }, { stat: 'crit' }] })
    expect(item.bonuses).toEqual([{ stat: 'attack', value: 10 }, { stat: 'crit', value: 0 }])
  })

  it('convierte campos numéricos que vienen como texto', () => {
    const item = normalizeItemInput({ name: 'Y', value: '150', weight: '2.5', requiredLevel: '7' })
    expect(item.value).toBe(150)
    expect(item.weight).toBe(2.5)
    expect(item.requiredLevel).toBe(7)
  })
})

describe('itemsTxt · parseItemsTxt', () => {
  it('parsea un array JSON', () => {
    const { items, errors } = parseItemsTxt('[{"name":"A"},{"name":"B","category":"weapon"}]')
    expect(errors).toEqual([])
    expect(items.map((i) => i.name)).toEqual(['A', 'B'])
    expect(items[1].category).toBe('weapon')
  })

  it('parsea un objeto JSON suelto', () => {
    const { items } = parseItemsTxt('{"name":"Solo"}')
    expect(items).toHaveLength(1)
    expect(items[0].name).toBe('Solo')
  })

  it('parsea JSONL (un objeto por línea) y omite líneas inválidas', () => {
    const txt = '{"name":"A"}\n// comentario\nno-json\n{"name":"C"}'
    const { items, errors } = parseItemsTxt(txt)
    expect(items.map((i) => i.name)).toEqual(['A', 'C'])
    expect(errors.length).toBe(1)
  })

  it('reporta error con archivo vacío', () => {
    const { items, errors } = parseItemsTxt('   ')
    expect(items).toEqual([])
    expect(errors.length).toBe(1)
  })
})

describe('itemsTxt · serializeItemsTxt (ida y vuelta)', () => {
  it('lo exportado se puede volver a importar', () => {
    const original = [
      { id: 1, name: 'Espada', description: 'd', category: 'weapon', rarity: 'rare', iconId: null, value: 100, weight: 3, stackSize: 1, durability: 50, healthRestore: null, foodRestore: null, manaRestore: null, requiredLevel: 5, requiredProfession: 'guerrero', weaponType: 'sword', armorType: null, bonuses: [{ stat: 'attack', value: 12 }], scripts: [], flags: ['equipable'], checks: [], createdAt: '', updatedAt: '' }
    ]
    // @ts-expect-error test fixture con la forma de Item
    const txt = serializeItemsTxt(original)
    const { items } = parseItemsTxt(txt)
    expect(items[0].name).toBe('Espada')
    expect(items[0].weaponType).toBe('sword')
    expect(items[0].bonuses).toEqual([{ stat: 'attack', value: 12 }])
    expect(items[0].flags).toEqual(['equipable'])
  })
})

describe('itemsTxt · buildItemsPrompt', () => {
  it('incluye el número pedido y las categorías válidas', () => {
    const prompt = buildItemsPrompt(25)
    expect(prompt).toContain('25 objetos')
    expect(prompt).toContain('weapon')
    expect(prompt).toContain('array JSON')
  })
})
