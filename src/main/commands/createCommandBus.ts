import { projectManager } from '../projects/ProjectManager'
import { ChangeLogService } from './changeLog'
import { CommandBus } from './commandBus'
import { ArmorRepository } from '../armor/armorRepository'
import { IconLibraryRepository } from '../icons/iconLibraryRepository'
import { ItemsRepository } from '../items/itemsRepository'
import { WeaponsRepository } from '../weapons/weaponsRepository'
import { MonstersRepository } from '../monsters/monstersRepository'
import { WorldEntityRepository } from '../worldEditor/worldEntityRepository'

/** Single construction site for CommandBus - every IPC handler that needs undo/redo calls this instead of wiring dependencies by hand. */
export function createCommandBus(): CommandBus {
  const db = projectManager.getDb()
  return new CommandBus(
    new ChangeLogService(db),
    new IconLibraryRepository(db),
    new ItemsRepository(db),
    new WeaponsRepository(db),
    new ArmorRepository(db),
    new MonstersRepository(db),
    new WorldEntityRepository(db)
  )
}
