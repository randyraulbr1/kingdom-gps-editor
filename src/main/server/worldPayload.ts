/**
 * Contrato versionado editor → servidor → juego para el blob `data` de cada
 * entidad que se sube con "Subir al mundo". Funciones puras (con pruebas) para
 * traducir la config del editor al formato exacto que el juego sabe dibujar.
 *
 * SCHEMA_VERSION sube cuando cambia el formato del blob de forma incompatible.
 */

export const WORLD_SCHEMA_VERSION = 1

/** Entidad mínima del editor que necesita el constructor de payload. */
export interface PayloadEntity {
  worldId: string
  name: string
  enabled: boolean
  properties: Record<string, unknown>
}

/** Una fila de venta en el formato del juego (tienda admin). */
export interface VendeEntry {
  id: string
  precio: number
  stock?: number
  infinito?: boolean
}

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function str(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback
}

/** Convierte una fila del catálogo del editor a una entrada `vende` del juego. */
function catalogRowToVende(row: Record<string, unknown>): VendeEntry | null {
  // El id del item en el juego: itemId si existe, si no un slug del nombre.
  const rawId = str(row.itemId, '') || slug(str(row.itemName, ''))
  if (!rawId) return null
  const precio = Math.max(0, Math.round(num(row.buyPrice, 0)))
  const stock = num(row.stock, -1)
  if (stock < 0) return { id: rawId, precio, infinito: true }
  return { id: rawId, precio, stock: Math.max(0, Math.round(stock)) }
}

/** Normaliza un texto a un id sencillo (minúsculas, sin espacios ni acentos). */
export function slug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

/** Construye el blob `data` de una TIENDA (contrato v1). */
export function buildShopData(entity: PayloadEntity, lat: number, lng: number): Record<string, unknown> {
  const shop = (entity.properties?.shop ?? {}) as Record<string, unknown>
  const catalog = Array.isArray(shop.catalog) ? shop.catalog : []
  const vende = catalog
    .map((row) => catalogRowToVende((row ?? {}) as Record<string, unknown>))
    .filter((v): v is VendeEntry => v !== null)
  const status = str(shop.status, 'active')
  const activo = entity.enabled && status !== 'paused' && status !== 'closed'
  const horario = (shop.schedule ?? shop.horario ?? null) as unknown

  return {
    id: entity.worldId,
    schemaVersion: WORLD_SCHEMA_VERSION,
    nombre: entity.name || 'Tienda',
    icono: str(shop.icon, '🏪'),
    categoria: str(shop.shopType, 'general'),
    pos: [lat, lng],
    radio: Math.max(1, num(shop.interactionRadiusM, 30)),
    activo,
    horario: horario ?? null,
    vende
  }
}

/**
 * Construye el blob `data` para cualquier tipo. Para tienda usa el mapeo
 * completo; para el resto, de momento, pasa las propiedades tal cual más los
 * campos base (id, nombre, pos, activo). Cada tipo se irá afinando en su turno.
 */
export function buildEntityData(
  entity: PayloadEntity,
  gameType: string,
  lat: number,
  lng: number
): Record<string, unknown> {
  if (gameType === 'shop') return buildShopData(entity, lat, lng)
  if (gameType === 'item') return buildItemData(entity, lat, lng)
  return {
    ...entity.properties,
    id: entity.worldId,
    schemaVersion: WORLD_SCHEMA_VERSION,
    nombre: entity.name,
    pos: [lat, lng],
    activo: entity.enabled
  }
}

/**
 * Blob `data` de un OBJETO del mapa (type item). El juego lo dibuja con
 * `_crearMarcadorObjeto`, que necesita `pos` y `items:[{id,cantidad}]`. Se
 * incluye `icono` y `nombre` para que se vea aunque el id no esté en el catálogo
 * local del juego (render de respaldo).
 */
export function buildItemData(entity: PayloadEntity, lat: number, lng: number): Record<string, unknown> {
  const obj = (entity.properties?.object ?? {}) as Record<string, unknown>
  const itemId = str(obj.itemId as string, '') || slug(entity.name) || entity.worldId
  const cantidad = Math.max(1, Math.round(num(obj.cantidad, 1)))
  return {
    id: entity.worldId,
    schemaVersion: WORLD_SCHEMA_VERSION,
    nombre: entity.name,
    icono: str(obj.icono as string, '📦'),
    pos: [lat, lng],
    activo: entity.enabled,
    cantidad,
    itemId: String(itemId),
    items: [{ id: String(itemId), cantidad }]
  }
}
