/**
 * Generador de IDs únicos para el Editor de Mundo.
 * Usa ULID (Universally Unique Lexicographically Sortable Identifier).
 */

/**
 * Generar un ULID único.
 * ULIDs son:
 * - Únicos a nivel global
 * - Ordenables alfabéticamente (timestamp + randomness)
 * - Más pequeños que UUIDs
 * - Decodificables para extraer timestamp
 */
export function generateULID(): string {
  const CROCKFORD_BASE32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

  // Timestamp en ms (48 bits, 10 caracteres)
  const timestamp = Date.now()
  const timestampBinary = (timestamp >>> 0).toString(2).padStart(48, '0')

  // Randomness (80 bits, 16 caracteres)
  const randomness = crypto.getRandomValues(new Uint8Array(10))

  // Convertir a base32
  let ulid = ''

  // Timestamp
  for (let i = 0; i < 10; i++) {
    const idx = parseInt(timestampBinary.slice(i * 5, i * 5 + 5), 2)
    ulid += CROCKFORD_BASE32[idx]
  }

  // Randomness
  for (let i = 0; i < 10; i++) {
    const byte = randomness[i]
    ulid += CROCKFORD_BASE32[(byte >>> 3) & 31]
    ulid += CROCKFORD_BASE32[(byte & 7) << 2]
  }

  return ulid.slice(0, 26)
}

/**
 * Generar múltiples ULIDs únicos.
 */
export function generateULIDs(count: number): string[] {
  const ids: string[] = []
  for (let i = 0; i < count; i++) {
    ids.push(generateULID())
  }
  return ids
}

/**
 * Extraer timestamp de un ULID.
 */
export function timestampFromULID(ulid: string): number {
  if (ulid.length < 10) {
    throw new Error('Invalid ULID')
  }

  const CROCKFORD_BASE32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
  const timestampPart = ulid.slice(0, 10)

  let timestamp = 0
  for (let i = 0; i < 10; i++) {
    const idx = CROCKFORD_BASE32.indexOf(timestampPart[i])
    timestamp = timestamp * 32 + idx
  }

  return timestamp
}
