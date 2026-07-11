/**
 * Servicio del renderer para las zonas (polígonos) del Editor de Mundo.
 * Envuelve window.api.worldZones.
 */

import type { WorldZone, CreateWorldZoneRequest, UpdateWorldZoneRequest } from '@shared-types/world'

function getApi() {
  if (!window.api?.worldZones) {
    throw new Error('worldZones API no está disponible. ¿Estás en el renderer?')
  }
  return window.api.worldZones
}

export class ZoneService {
  static async create(request: CreateWorldZoneRequest): Promise<WorldZone> {
    return getApi().create(request)
  }

  static async update(request: UpdateWorldZoneRequest): Promise<WorldZone> {
    return getApi().update(request)
  }

  static async delete(zoneId: string): Promise<void> {
    return getApi().delete(zoneId)
  }

  static async list(): Promise<WorldZone[]> {
    return getApi().list()
  }
}
