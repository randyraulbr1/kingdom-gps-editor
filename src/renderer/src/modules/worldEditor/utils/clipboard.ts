/**
 * Portapapeles interno del Editor de Mundo (doc 28).
 *
 * Independiente del portapapeles del sistema operativo. Guarda una copia
 * profunda de la configuración de la entidad para que editar el original
 * después no altere lo copiado. Al pegar:
 *  - en modo "copy" se genera una entidad nueva (ID nuevo) conservando la
 *    configuración, colocada en las coordenadas del clic derecho;
 *  - en modo "cut" se mueve la entidad original (mismo ID), sin crear copia.
 *
 * Nunca se copian: ID interno, historial, fechas ni estado de sincronización;
 * eso lo asigna el proceso main al crear/mover la entidad.
 */

import type { CreateWorldEntityRequest, Position, WorldEntityType } from '@shared-types/world'
import type { WorldEntityUI } from '../types'

export type ClipboardMode = 'copy' | 'cut'

export interface ClipboardEntry {
  mode: ClipboardMode
  /** worldId de origen (necesario para el modo "cut", que mueve el original). */
  sourceWorldId: string
  entityType: WorldEntityType
  entityId: number | null
  /** Nombre base; al copiar se le añade "(copia)". */
  name: string
  /** Configuración específica del tipo (tienda, NPC, etc.), clonada en profundidad. */
  properties: Record<string, unknown>
  enabled: boolean
}

/** Clona un objeto de propiedades de forma segura (sin referencias compartidas). */
function cloneProperties(properties: Record<string, unknown>): Record<string, unknown> {
  try {
    return structuredClone(properties)
  } catch {
    // structuredClone puede no existir en algún entorno de prueba antiguo.
    return JSON.parse(JSON.stringify(properties ?? {}))
  }
}

/** Crea una entrada de portapapeles a partir de una entidad del mapa. */
export function makeClipboardEntry(entity: WorldEntityUI, mode: ClipboardMode): ClipboardEntry {
  return {
    mode,
    sourceWorldId: entity.worldId,
    entityType: entity.entityType,
    entityId: entity.entityId,
    name: entity.name,
    properties: cloneProperties(entity.properties ?? {}),
    enabled: entity.enabled
  }
}

/**
 * Construye la petición para crear la entidad pegada (modo "copy"). Recibe un
 * ID nuevo del proceso main; aquí solo se define tipo, nombre, posición del
 * clic y la configuración conservada.
 */
export function buildPasteRequest(entry: ClipboardEntry, position: Position): CreateWorldEntityRequest {
  const name = entry.mode === 'copy' ? `${entry.name} (copia)` : entry.name
  return {
    entityType: entry.entityType,
    entityId: entry.entityId,
    name,
    position,
    properties: cloneProperties(entry.properties)
  }
}
