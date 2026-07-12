/**
 * IPC handler para consultar lugares reales de OpenStreetMap vía la API de
 * Overpass, dentro de un polígono (zona) del Editor de Mundo.
 *
 * La llamada de red se hace aquí, en el proceso main (no en el renderer), para
 * respetar la CSP y el principio "el renderer nunca accede directamente a la
 * red" (doc 11 - Guía de integración y calidad).
 */

import { ipcMain } from 'electron'
import type { OsmCategoryKey, OsmPlace, OsmQueryRequest, OsmQueryResult, Position } from '@shared-types/world'

/**
 * Espejos de la API de Overpass. Se prueban en orden; si uno responde con
 * error (p. ej. 406/429/504) o falla la red, se pasa al siguiente.
 */
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
]

/** Overpass (tras Cloudflare) rechaza peticiones sin un User-Agent identificativo. */
const REQUEST_HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded',
  Accept: '*/*',
  'User-Agent': 'KingdomGPS-Editor/0.1 (world editor tool)'
}

/** Filtro Overpass y etiqueta por defecto para cada categoría conocida. */
const CATEGORY_FILTERS: Record<OsmCategoryKey, { filter: string; defaultName: string }> = {
  pharmacy: { filter: '["amenity"="pharmacy"]', defaultName: 'Farmacia' },
  hospital: { filter: '["amenity"="hospital"]', defaultName: 'Hospital' },
  fuel: { filter: '["amenity"="fuel"]', defaultName: 'Gasolinera' },
  supermarket: { filter: '["shop"="supermarket"]', defaultName: 'Supermercado' },
  restaurant: { filter: '["amenity"="restaurant"]', defaultName: 'Restaurante' },
  cafe: { filter: '["amenity"="cafe"]', defaultName: 'Cafetería' },
  bank: { filter: '["amenity"="bank"]', defaultName: 'Banco' },
  atm: { filter: '["amenity"="atm"]', defaultName: 'Cajero' },
  school: { filter: '["amenity"="school"]', defaultName: 'Escuela' },
  police: { filter: '["amenity"="police"]', defaultName: 'Policía' },
  place_of_worship: { filter: '["amenity"="place_of_worship"]', defaultName: 'Templo' },
  hotel: { filter: '["tourism"="hotel"]', defaultName: 'Hotel' },
  marketplace: { filter: '["amenity"="marketplace"]', defaultName: 'Mercado' },
  bakery: { filter: '["shop"="bakery"]', defaultName: 'Panadería' },
  clothes: { filter: '["shop"="clothes"]', defaultName: 'Tienda de ropa' },
  convenience: { filter: '["shop"="convenience"]', defaultName: 'Tienda' },
  hardware: { filter: '["shop"="hardware"]', defaultName: 'Ferretería' },
  park: { filter: '["leisure"="park"]', defaultName: 'Parque' },
  drinking_water: { filter: '["amenity"="drinking_water"]', defaultName: 'Agua potable' }
}

const ALL_CATEGORIES = Object.keys(CATEGORY_FILTERS) as OsmCategoryKey[]

interface OverpassElement {
  type: string
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

/** Construye el fragmento `poly:"lat lon lat lon ..."` a partir de los vértices. */
function toPolyString(polygon: Position[]): string {
  return polygon.map((p) => `${p.lat} ${p.lng}`).join(' ')
}

/** Deduce la categoría de un elemento a partir de sus tags (prioridad shop > tourism > amenity > leisure). */
function categoryOf(tags: Record<string, string> | undefined): OsmCategoryKey | null {
  if (!tags) return null
  switch (tags.shop) {
    case 'supermarket':
      return 'supermarket'
    case 'bakery':
      return 'bakery'
    case 'clothes':
      return 'clothes'
    case 'convenience':
      return 'convenience'
    case 'hardware':
      return 'hardware'
  }
  if (tags.tourism === 'hotel') return 'hotel'
  switch (tags.amenity) {
    case 'pharmacy':
      return 'pharmacy'
    case 'hospital':
      return 'hospital'
    case 'fuel':
      return 'fuel'
    case 'restaurant':
      return 'restaurant'
    case 'cafe':
      return 'cafe'
    case 'bank':
      return 'bank'
    case 'atm':
      return 'atm'
    case 'school':
      return 'school'
    case 'police':
      return 'police'
    case 'place_of_worship':
      return 'place_of_worship'
    case 'marketplace':
      return 'marketplace'
    case 'drinking_water':
      return 'drinking_water'
  }
  if (tags.leisure === 'park') return 'park'
  return null
}

function buildQuery(polygon: Position[], categories: OsmCategoryKey[]): string {
  const poly = toPolyString(polygon)
  const clauses = categories
    .map((key) => `  nwr${CATEGORY_FILTERS[key].filter}(poly:"${poly}");`)
    .join('\n')
  return `[out:json][timeout:25];\n(\n${clauses}\n);\nout center tags;`
}

export function registerOsmHandlers(): void {
  ipcMain.handle('osm:queryPlaces', async (_event, request: OsmQueryRequest): Promise<OsmQueryResult> => {
    const categories =
      request.categories && request.categories.length > 0 ? request.categories : ALL_CATEGORIES

    if (!request.polygon || request.polygon.length < 3) {
      throw new Error('Se necesita un polígono con al menos 3 puntos para consultar OpenStreetMap.')
    }

    const query = buildQuery(request.polygon, categories)
    const body = `data=${encodeURIComponent(query)}`

    let json: { elements?: OverpassElement[] } | null = null
    let lastError = 'sin respuesta'

    for (const endpoint of OVERPASS_ENDPOINTS) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30_000)
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: REQUEST_HEADERS,
          body,
          signal: controller.signal
        })
        if (!response.ok) {
          lastError = `${endpoint} respondió ${response.status} ${response.statusText}`
          continue
        }
        json = (await response.json()) as { elements?: OverpassElement[] }
        break
      } catch (error) {
        lastError =
          error instanceof Error && error.name === 'AbortError'
            ? `${endpoint}: la consulta tardó demasiado (timeout)`
            : `${endpoint}: ${error instanceof Error ? error.message : String(error)}`
      } finally {
        clearTimeout(timeout)
      }
    }

    if (!json) {
      throw new Error(`No se pudo consultar OpenStreetMap. Último error: ${lastError}`)
    }

    const countsByCategory: Record<string, number> = {}
    for (const key of categories) countsByCategory[key] = 0

    const places: OsmPlace[] = []
    for (const element of json.elements ?? []) {
      const category = categoryOf(element.tags)
      if (!category || !categories.includes(category)) continue

      const lat = element.lat ?? element.center?.lat
      const lon = element.lon ?? element.center?.lon
      if (typeof lat !== 'number' || typeof lon !== 'number') continue

      places.push({
        osmId: `${element.type}/${element.id}`,
        category,
        name: element.tags?.name ?? CATEGORY_FILTERS[category].defaultName,
        position: { lat, lng: lon }
      })
      countsByCategory[category] = (countsByCategory[category] ?? 0) + 1
    }

    return { places, countsByCategory }
  })
}
