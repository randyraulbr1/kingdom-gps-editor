/**
 * Configuración de una tienda asociada a un pin del mapa (doc 17).
 *
 * Se guarda dentro de `WorldEntity.properties.shop`, que ya se persiste en
 * SQLite y viaja por el IPC, de modo que no hace falta una tabla nueva en esta
 * fase A (crear tienda desde el mapa, abrir ficha, catálogo local). La
 * sincronización con servidor y el stock compartido son fases posteriores.
 */

export type ShopType = 'potions' | 'weapons' | 'armor' | 'resources' | 'food' | 'general' | 'custom'

export type ShopStatus = 'draft' | 'active' | 'paused' | 'closed'

/** Una fila del catálogo local de la tienda. */
export interface ShopCatalogItem {
  /** ID local de la fila (no es el ID del objeto del juego). */
  id: string
  itemName: string
  buyPrice: number
  sellPrice: number
  /** Existencias; -1 significa ilimitado. */
  stock: number
  requiredLevel: number
}

export interface ShopConfig {
  shopType: ShopType
  /** Radio en metros dentro del cual el jugador puede abrir la tienda. */
  interactionRadiusM: number
  status: ShopStatus
  catalog: ShopCatalogItem[]
}

export const SHOP_TYPE_LABELS: Record<ShopType, string> = {
  potions: 'Farmacia / pociones',
  weapons: 'Armas',
  armor: 'Armaduras',
  resources: 'Recursos',
  food: 'Comida',
  general: 'General',
  custom: 'Personalizada'
}

export const DEFAULT_SHOP_CONFIG: ShopConfig = {
  shopType: 'general',
  interactionRadiusM: 30,
  status: 'draft',
  catalog: []
}

function toNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

/** Genera un ID local para una fila de catálogo. */
export function newCatalogItemId(): string {
  const globalCrypto = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
  if (globalCrypto?.randomUUID) return globalCrypto.randomUUID()
  return `row_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/** Normaliza una fila de catálogo desconocida a una válida. */
function normalizeItem(raw: unknown): ShopCatalogItem {
  const obj = (raw ?? {}) as Record<string, unknown>
  return {
    id: typeof obj.id === 'string' && obj.id ? obj.id : newCatalogItemId(),
    itemName: typeof obj.itemName === 'string' ? obj.itemName : '',
    buyPrice: Math.max(0, toNumber(obj.buyPrice, 0)),
    sellPrice: Math.max(0, toNumber(obj.sellPrice, 0)),
    stock: toNumber(obj.stock, -1),
    requiredLevel: Math.max(0, toNumber(obj.requiredLevel, 0))
  }
}

const SHOP_TYPES: ShopType[] = ['potions', 'weapons', 'armor', 'resources', 'food', 'general', 'custom']
const SHOP_STATUSES: ShopStatus[] = ['draft', 'active', 'paused', 'closed']

/** Lee (y sanea) la config de tienda desde las propiedades de una entidad. */
export function readShopConfig(properties: Record<string, unknown> | undefined | null): ShopConfig {
  const shop = (properties?.shop ?? {}) as Record<string, unknown>
  const shopType = SHOP_TYPES.includes(shop.shopType as ShopType)
    ? (shop.shopType as ShopType)
    : DEFAULT_SHOP_CONFIG.shopType
  const status = SHOP_STATUSES.includes(shop.status as ShopStatus)
    ? (shop.status as ShopStatus)
    : DEFAULT_SHOP_CONFIG.status
  const catalog = Array.isArray(shop.catalog) ? shop.catalog.map(normalizeItem) : []
  return {
    shopType,
    interactionRadiusM: Math.max(1, toNumber(shop.interactionRadiusM, DEFAULT_SHOP_CONFIG.interactionRadiusM)),
    status,
    catalog
  }
}

/** Devuelve un nuevo objeto de propiedades con la config de tienda escrita. */
export function writeShopConfig(
  properties: Record<string, unknown> | undefined | null,
  config: ShopConfig
): Record<string, unknown> {
  return { ...(properties ?? {}), shop: config }
}

export interface PurchaseSimInput {
  playerMoney: number
  /** Distancia del jugador al pin, en metros. */
  distanceM: number
  interactionRadiusM: number
  item: Pick<ShopCatalogItem, 'itemName' | 'buyPrice' | 'stock' | 'requiredLevel'>
  playerLevel: number
}

export type PurchaseSimResult =
  | { ok: true; remainingMoney: number; message: string }
  | { ok: false; reason: 'out_of_range' | 'insufficient_level' | 'out_of_stock' | 'insufficient_money'; message: string }

/**
 * Simula una compra en el editor (doc 17, "Probar tienda"). No toca dinero ni
 * inventario reales: en producción el servidor es la fuente de verdad. Sirve
 * para validar la ficha antes de publicar.
 */
export function simulatePurchase(input: PurchaseSimInput): PurchaseSimResult {
  if (input.distanceM > input.interactionRadiusM) {
    const falta = Math.ceil(input.distanceM - input.interactionRadiusM)
    return { ok: false, reason: 'out_of_range', message: `Fuera de rango: acércate ${falta} m` }
  }
  if (input.playerLevel < input.item.requiredLevel) {
    return { ok: false, reason: 'insufficient_level', message: `Nivel insuficiente (requiere ${input.item.requiredLevel})` }
  }
  if (input.item.stock === 0) {
    return { ok: false, reason: 'out_of_stock', message: 'Sin existencias' }
  }
  if (input.playerMoney < input.item.buyPrice) {
    return { ok: false, reason: 'insufficient_money', message: 'Dinero insuficiente' }
  }
  return {
    ok: true,
    remainingMoney: input.playerMoney - input.item.buyPrice,
    message: `Compra correcta: ${input.item.itemName || 'objeto'}`
  }
}
