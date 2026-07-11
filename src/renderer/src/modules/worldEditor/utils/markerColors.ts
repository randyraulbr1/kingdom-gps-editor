/**
 * Mapeo de colores y estilos visuales para tipos de entidades.
 * Usado para renderizar markers en el mapa con colores distintivos.
 */

import { WorldEntityType } from '@shared-types/world'

export const ENTITY_TYPE_COLORS: Record<WorldEntityType, { color: string; bg: string }> = {
  [WorldEntityType.Object]: { color: '#8B7355', bg: '#D2B48C' },
  [WorldEntityType.Enemy]: { color: '#8B0000', bg: '#FF6347' },
  [WorldEntityType.Npc]: { color: '#4169E1', bg: '#87CEEB' },
  [WorldEntityType.Chest]: { color: '#B8860B', bg: '#FFD700' },
  [WorldEntityType.Shop]: { color: '#556B2F', bg: '#ADFF2F' },
  [WorldEntityType.Quest]: { color: '#4B0082', bg: '#DA70D6' },
  [WorldEntityType.Resource]: { color: '#228B22', bg: '#32CD32' },
  [WorldEntityType.Plant]: { color: '#006400', bg: '#90EE90' },
  [WorldEntityType.Event]: { color: '#DC143C', bg: '#FF69B4' },
  [WorldEntityType.Zone]: { color: '#191970', bg: '#1E90FF' },
  [WorldEntityType.SpawnPoint]: { color: '#FF8C00', bg: '#FFB347' },
  [WorldEntityType.Building]: { color: '#696969', bg: '#A9A9A9' },
  [WorldEntityType.Teleporter]: { color: '#9932CC', bg: '#BA55D3' },
  [WorldEntityType.Marker]: { color: '#2F4F4F', bg: '#5F9EA0' }
}

export const ENTITY_TYPE_ICONS: Record<WorldEntityType, string> = {
  [WorldEntityType.Object]: '📦',
  [WorldEntityType.Enemy]: '⚔️',
  [WorldEntityType.Npc]: '🧑',
  [WorldEntityType.Chest]: '🔔',
  [WorldEntityType.Shop]: '🏪',
  [WorldEntityType.Quest]: '❓',
  [WorldEntityType.Resource]: '⛏️',
  [WorldEntityType.Plant]: '🌿',
  [WorldEntityType.Event]: '✨',
  [WorldEntityType.Zone]: '📍',
  [WorldEntityType.SpawnPoint]: '🔄',
  [WorldEntityType.Building]: '🏠',
  [WorldEntityType.Teleporter]: '🌀',
  [WorldEntityType.Marker]: '📌'
}

/**
 * Obtener icono para un tipo de entidad.
 */
export function getEntityIcon(entityType: WorldEntityType): string {
  return ENTITY_TYPE_ICONS[entityType] || '📍'
}

/**
 * Obtener colores para un tipo de entidad.
 */
export function getEntityColors(entityType: WorldEntityType) {
  return ENTITY_TYPE_COLORS[entityType] || { color: '#666', bg: '#ccc' }
}

/**
 * Calcular estilo CSS para un marker según tipo y estado.
 */
export function getMarkerStyle(
  entityType: WorldEntityType,
  isSelected: boolean,
  isHovered: boolean
) {
  const colors = getEntityColors(entityType)
  const scale = isSelected ? 1.3 : isHovered ? 1.15 : 1

  return {
    backgroundColor: colors.bg,
    color: colors.color,
    borderColor: isSelected ? '#000' : '#666',
    borderWidth: isSelected ? '3px' : '2px',
    transform: `scale(${scale})`,
    transition: 'transform 0.1s ease'
  }
}
