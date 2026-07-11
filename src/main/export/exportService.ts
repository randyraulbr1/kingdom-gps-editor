import path from 'node:path'
import { jsonExporter } from './exporters/JsonExporter'
import type { IconLibraryRepository } from '../icons/iconLibraryRepository'
import type { ArmorRepository } from '../armor/armorRepository'
import type { ItemsRepository } from '../items/itemsRepository'
import type { WeaponsRepository } from '../weapons/weaponsRepository'
import type { WorldEntityRepository } from '../worldEditor/worldEntityRepository'
import type { WorldZoneRepository } from '../worldEditor/worldZoneRepository'
import type { ExportRunResult } from '@shared-types/exporter'

/** Proved the exporter pattern end-to-end in Fase 1 - items.json (Fase 2) is the first real content export; npc.json etc. follow the same shape. */
export async function exportIconManifest(
  repository: IconLibraryRepository,
  projectPath: string
): Promise<ExportRunResult> {
  const start = Date.now()
  const { items } = await repository.list({ limit: 1_000_000, offset: 0 })
  const targetPath = path.join(projectPath, 'export', 'icons.json')
  await jsonExporter.run(items, targetPath)
  return {
    exporterId: jsonExporter.id,
    outputPath: targetPath,
    recordCount: items.length,
    durationMs: Date.now() - start
  }
}

export async function exportItems(repository: ItemsRepository, projectPath: string): Promise<ExportRunResult> {
  const start = Date.now()
  const { items } = await repository.query({ limit: 1_000_000, offset: 0 })
  const targetPath = path.join(projectPath, 'export', 'items.json')
  await jsonExporter.run(items, targetPath)
  return {
    exporterId: jsonExporter.id,
    outputPath: targetPath,
    recordCount: items.length,
    durationMs: Date.now() - start
  }
}

export async function exportWeapons(repository: WeaponsRepository, projectPath: string): Promise<ExportRunResult> {
  const start = Date.now()
  const { items } = await repository.query({ limit: 1_000_000, offset: 0 })
  const targetPath = path.join(projectPath, 'export', 'weapons.json')
  await jsonExporter.run(items, targetPath)
  return {
    exporterId: jsonExporter.id,
    outputPath: targetPath,
    recordCount: items.length,
    durationMs: Date.now() - start
  }
}

export async function exportArmor(repository: ArmorRepository, projectPath: string): Promise<ExportRunResult> {
  const start = Date.now()
  const { items } = await repository.query({ limit: 1_000_000, offset: 0 })
  const targetPath = path.join(projectPath, 'export', 'armor.json')
  await jsonExporter.run(items, targetPath)
  return {
    exporterId: jsonExporter.id,
    outputPath: targetPath,
    recordCount: items.length,
    durationMs: Date.now() - start
  }
}

/**
 * Exporta el mundo (entidades del mapa + zonas) a `export/world.json`, listo
 * para subirse al juego. Reutiliza el mismo `jsonExporter` que icons/items, en
 * vez de armar el JSON a mano (misma ruta de exportación para todo el editor).
 */
export async function exportWorld(
  entityRepository: WorldEntityRepository,
  zoneRepository: WorldZoneRepository,
  projectName: string,
  projectPath: string
): Promise<ExportRunResult> {
  const start = Date.now()
  const entities = await entityRepository.getAllEntities()
  const zones = await zoneRepository.list()
  const data = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    project: projectName,
    entityCount: entities.length,
    zoneCount: zones.length,
    entities,
    zones
  }
  const targetPath = path.join(projectPath, 'export', 'world.json')
  await jsonExporter.run(data, targetPath)
  return {
    exporterId: jsonExporter.id,
    outputPath: targetPath,
    recordCount: entities.length + zones.length,
    durationMs: Date.now() - start
  }
}
