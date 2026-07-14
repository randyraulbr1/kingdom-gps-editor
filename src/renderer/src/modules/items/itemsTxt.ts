/**
 * Importar / exportar Objetos como archivo de texto (.txt con JSON) y generar
 * un prompt para que una IA cree objetos en el formato correcto (con sus
 * conexiones: categoría, profesión, tipo de arma/armadura, bonos…).
 *
 * Funciones puras (con pruebas). El .txt contiene un array JSON de objetos con
 * los campos de ItemInput; así una IA lo puede generar y el editor importarlo.
 */

import {
  ITEM_CATEGORIES,
  ITEM_RARITIES,
  createEmptyItemInput,
  type Item,
  type ItemInput,
  type ItemBonus
} from '@shared-types/item'

const CATEGORIES = ITEM_CATEGORIES as readonly string[]
const RARITIES = ITEM_RARITIES as readonly string[]

function num(value: unknown, fallback: number): number {
  const n = typeof value === 'string' ? Number(value) : value
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback
}

function numOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function strOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function strArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === 'string' && v.trim() !== '')
}

function bonuses(value: unknown): ItemBonus[] {
  if (!Array.isArray(value)) return []
  const out: ItemBonus[] = []
  for (const raw of value) {
    const b = (raw ?? {}) as Record<string, unknown>
    const stat = strOrNull(b.stat)
    if (!stat) continue
    out.push({ stat, value: num(b.value, 0) })
  }
  return out
}

/** Normaliza un objeto desconocido (de la IA / del txt) a un ItemInput válido. */
export function normalizeItemInput(raw: unknown): ItemInput {
  const obj = (raw ?? {}) as Record<string, unknown>
  const base = createEmptyItemInput()
  const category = typeof obj.category === 'string' && CATEGORIES.includes(obj.category) ? obj.category : base.category
  const rarity = typeof obj.rarity === 'string' && RARITIES.includes(obj.rarity) ? obj.rarity : base.rarity
  return {
    name: typeof obj.name === 'string' && obj.name.trim() ? obj.name.trim() : base.name,
    description: typeof obj.description === 'string' ? obj.description : '',
    category: category as ItemInput['category'],
    rarity: rarity as ItemInput['rarity'],
    iconId: numOrNull(obj.iconId),
    value: Math.max(0, num(obj.value, 0)),
    weight: Math.max(0, num(obj.weight, 0)),
    stackSize: Math.max(1, Math.round(num(obj.stackSize, 1))),
    durability: numOrNull(obj.durability),
    healthRestore: numOrNull(obj.healthRestore),
    foodRestore: numOrNull(obj.foodRestore),
    manaRestore: numOrNull(obj.manaRestore),
    requiredLevel: Math.max(1, Math.round(num(obj.requiredLevel, 1))),
    requiredProfession: strOrNull(obj.requiredProfession),
    weaponType: strOrNull(obj.weaponType),
    armorType: strOrNull(obj.armorType),
    bonuses: bonuses(obj.bonuses),
    scripts: strArray(obj.scripts),
    flags: strArray(obj.flags),
    checks: strArray(obj.checks)
  }
}

/**
 * Parsea el contenido de un .txt. Acepta:
 *  - un array JSON: [ {..}, {..} ]
 *  - un objeto JSON suelto: {..}
 *  - JSONL: un objeto JSON por línea.
 */
export function parseItemsTxt(text: string): { items: ItemInput[]; errors: string[] } {
  const errors: string[] = []
  const trimmed = (text ?? '').trim()
  if (!trimmed) return { items: [], errors: ['El archivo está vacío.'] }

  // 1) Intentar como un único JSON (array u objeto).
  try {
    const parsed = JSON.parse(trimmed)
    const list = Array.isArray(parsed) ? parsed : [parsed]
    return { items: list.map(normalizeItemInput), errors }
  } catch {
    // 2) Intentar JSONL (una línea = un objeto).
  }

  const items: ItemInput[] = []
  const lines = trimmed.split(/\r?\n/)
  lines.forEach((line, i) => {
    const l = line.trim()
    if (!l || l.startsWith('//') || l.startsWith('#')) return
    try {
      items.push(normalizeItemInput(JSON.parse(l)))
    } catch {
      errors.push(`Línea ${i + 1}: no es JSON válido y se omitió.`)
    }
  })
  if (items.length === 0 && errors.length === 0) {
    errors.push('No se encontró ningún objeto. Usa un array JSON o un objeto JSON por línea.')
  }
  return { items, errors }
}

/** Convierte los objetos actuales a un .txt (array JSON legible) para exportar. */
export function serializeItemsTxt(items: Item[]): string {
  const clean = items.map((it) => ({
    name: it.name,
    description: it.description,
    category: it.category,
    rarity: it.rarity,
    value: it.value,
    weight: it.weight,
    stackSize: it.stackSize,
    durability: it.durability,
    healthRestore: it.healthRestore,
    foodRestore: it.foodRestore,
    manaRestore: it.manaRestore,
    requiredLevel: it.requiredLevel,
    requiredProfession: it.requiredProfession,
    weaponType: it.weaponType,
    armorType: it.armorType,
    bonuses: it.bonuses,
    scripts: it.scripts,
    flags: it.flags,
    checks: it.checks
  }))
  return JSON.stringify(clean, null, 2)
}

/**
 * Prompt para pegar a una IA (ChatGPT, Claude…) para que genere objetos en el
 * formato exacto que este editor importa, con todas sus conexiones.
 */
export function buildItemsPrompt(count = 10): string {
  const ejemplo: ItemInput = {
    ...createEmptyItemInput(),
    name: 'Espada de hierro',
    description: 'Una espada resistente forjada en hierro.',
    category: 'weapon',
    rarity: 'uncommon',
    value: 120,
    weight: 3.5,
    stackSize: 1,
    durability: 100,
    requiredLevel: 5,
    requiredProfession: 'guerrero',
    weaponType: 'sword',
    bonuses: [
      { stat: 'attack', value: 12 },
      { stat: 'critChance', value: 3 }
    ],
    flags: ['equipable'],
    scripts: [],
    checks: []
  }

  return [
    `Genera ${count} objetos distintos para un juego RPG, en formato JSON.`,
    '',
    'Devuelve SOLO un array JSON (sin texto extra, sin explicaciones, sin markdown).',
    'Cada objeto debe tener EXACTAMENTE estos campos:',
    '',
    '- name (texto): nombre del objeto.',
    '- description (texto): descripción corta.',
    `- category (texto): una de: ${CATEGORIES.join(', ')}.`,
    `- rarity (texto): una de: ${RARITIES.join(', ')}.`,
    '- value (número): precio en monedas.',
    '- weight (número): peso.',
    '- stackSize (número entero ≥ 1): cuántos se apilan.',
    '- durability (número o null): durabilidad; null si no aplica.',
    '- healthRestore, foodRestore, manaRestore (número o null): lo que restaura al usarlo; null si no aplica.',
    '- requiredLevel (número entero ≥ 1): nivel requerido.',
    '- requiredProfession (texto o null): profesión requerida (ej. "guerrero", "mago") o null.',
    '- weaponType (texto o null): tipo de arma (ej. "sword", "bow") si category es weapon; si no, null.',
    '- armorType (texto o null): tipo de armadura (ej. "helmet", "chest") si category es armor; si no, null.',
    '- bonuses (array): bonificaciones como [{ "stat": "attack", "value": 12 }]. [] si no tiene.',
    '- flags (array de texto): etiquetas (ej. "equipable", "quest"). [] si no tiene.',
    '- scripts (array de texto): ids de scripts asociados. [] si no tiene.',
    '- checks (array de texto): condiciones. [] si no tiene.',
    '',
    'Reglas de coherencia (conexiones):',
    '- Si category = "weapon", pon weaponType y bonuses de ataque.',
    '- Si category = "armor", pon armorType y bonuses de defensa.',
    '- Si category = "food", pon foodRestore y/o healthRestore, y durability = null.',
    '- rarity más alta ⇒ mayor value y mejores bonuses.',
    '',
    'Ejemplo de UN objeto válido:',
    JSON.stringify(ejemplo, null, 2),
    '',
    `Ahora genera el array con los ${count} objetos. Guarda el resultado en un archivo .txt e impórtalo en el editor.`
  ].join('\n')
}
