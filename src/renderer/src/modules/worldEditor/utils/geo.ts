import type { Position } from '@shared-types/world'

/**
 * Test punto-en-polígono por ray casting (par/impar). El polígono es una lista
 * de vértices {lat,lng} en orden; se asume cerrado implícitamente (el último
 * vértice se conecta con el primero).
 */
export function isPointInPolygon(point: Position, polygon: Position[]): boolean {
  if (polygon.length < 3) return false
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng
    const yi = polygon[i].lat
    const xj = polygon[j].lng
    const yj = polygon[j].lat
    const intersects =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi
    if (intersects) inside = !inside
  }
  return inside
}

/** Centroide simple (media de vértices) — útil para etiquetar una zona. */
export function polygonCentroid(polygon: Position[]): Position {
  if (polygon.length === 0) return { lat: 0, lng: 0 }
  const sum = polygon.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 }
  )
  return { lat: sum.lat / polygon.length, lng: sum.lng / polygon.length }
}
