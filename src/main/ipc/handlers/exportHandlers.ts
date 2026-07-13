import { ipcMain } from 'electron'
import { projectManager } from '../../projects/ProjectManager'
import { IconLibraryRepository } from '../../icons/iconLibraryRepository'
import { ItemsRepository } from '../../items/itemsRepository'
import { WeaponsRepository } from '../../weapons/weaponsRepository'
import { ArmorRepository } from '../../armor/armorRepository'
import { MonstersRepository } from '../../monsters/monstersRepository'
import { WorldEntityRepository } from '../../worldEditor/worldEntityRepository'
import { WorldZoneRepository } from '../../worldEditor/worldZoneRepository'
import { exportIconManifest, exportItems, exportWeapons, exportArmor, exportMonsters, exportWorld } from '../../export/exportService'

export function registerExportHandlers(): void {
  ipcMain.handle('export:icons', () => {
    const db = projectManager.getDb()
    const info = projectManager.getCurrentInfo()
    if (!info) throw new Error('No hay un proyecto abierto')
    return exportIconManifest(new IconLibraryRepository(db), info.path)
  })

  ipcMain.handle('export:items', () => {
    const db = projectManager.getDb()
    const info = projectManager.getCurrentInfo()
    if (!info) throw new Error('No hay un proyecto abierto')
    return exportItems(new ItemsRepository(db), info.path)
  })

  ipcMain.handle('export:weapons', () => {
    const db = projectManager.getDb()
    const info = projectManager.getCurrentInfo()
    if (!info) throw new Error('No hay un proyecto abierto')
    return exportWeapons(new WeaponsRepository(db), info.path)
  })

  ipcMain.handle('export:armor', () => {
    const db = projectManager.getDb()
    const info = projectManager.getCurrentInfo()
    if (!info) throw new Error('No hay un proyecto abierto')
    return exportArmor(new ArmorRepository(db), info.path)
  })

  ipcMain.handle('export:monsters', () => {
    const db = projectManager.getDb()
    const info = projectManager.getCurrentInfo()
    if (!info) throw new Error('No hay un proyecto abierto')
    return exportMonsters(new MonstersRepository(db), info.path)
  })

  ipcMain.handle('export:world', () => {
    const db = projectManager.getDb()
    const info = projectManager.getCurrentInfo()
    if (!info) throw new Error('No hay un proyecto abierto')
    return exportWorld(new WorldEntityRepository(db), new WorldZoneRepository(db), info.name, info.path)
  })
}
