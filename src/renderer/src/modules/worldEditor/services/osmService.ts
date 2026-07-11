/**
 * Servicio del renderer para consultar OpenStreetMap (vía el proceso main).
 * Envuelve window.api.osm.
 */

import type { OsmQueryRequest, OsmQueryResult } from '@shared-types/world'

function getApi() {
  if (!window.api?.osm) {
    throw new Error('osm API no está disponible. ¿Estás en el renderer?')
  }
  return window.api.osm
}

export class OsmService {
  static async queryPlaces(request: OsmQueryRequest): Promise<OsmQueryResult> {
    return getApi().queryPlaces(request)
  }
}
