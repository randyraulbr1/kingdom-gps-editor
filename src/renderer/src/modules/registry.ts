import { CONTENT_MODULE_ORDER, TOOLS_MODULE_ORDER, SYSTEM_MODULE_ORDER, type ModuleId } from '@shared-types/module'
import type { RendererModuleDefinition } from './defineModule'

import { itemsModule } from './items/module'
import { weaponsModule } from './weapons/module'
import { armorsModule } from './armors/module'
import { toolsEquipmentModule } from './tools_equipment/module'
import { resourcesModule } from './resources/module'
import { foodModule } from './food/module'
import { cropsModule } from './crops/module'
import { constructionsModule } from './constructions/module'
import { npcsModule } from './npcs/module'
import { monstersModule } from './monsters/module'
import { lootModule } from './loot/module'
import { questsModule } from './quests/module'
import { dialoguesModule } from './dialogues/module'
import { mapsModule } from './maps/module'
import { economyModule } from './economy/module'
import { craftingModule } from './crafting/module'
import { recipesModule } from './recipes/module'
import { professionsModule } from './professions/module'
import { animalsModule } from './animals/module'
import { petsModule } from './pets/module'
import { eventsModule } from './events/module'
import { settingsModule } from './settings/module'
import { toolsModule } from './tools/module'
import { iconLibraryModule } from './icon-library/module'
import { worldEditorModule } from './worldEditor/module'
import { spriteTesterModule } from './sprite-tester/module'

/**
 * The only file (besides the mirror in src/main/modules/registry.ts) that
 * imports every module. Sidebar.tsx and DockLayout.tsx iterate MODULES; they
 * never reference a specific module by name. Adding module #25 means adding
 * its folder + one import + one entry here.
 */
const MODULES: RendererModuleDefinition[] = [
  itemsModule,
  weaponsModule,
  armorsModule,
  toolsEquipmentModule,
  resourcesModule,
  foodModule,
  cropsModule,
  constructionsModule,
  npcsModule,
  monstersModule,
  lootModule,
  questsModule,
  dialoguesModule,
  mapsModule,
  economyModule,
  craftingModule,
  recipesModule,
  professionsModule,
  animalsModule,
  petsModule,
  eventsModule,
  settingsModule,
  toolsModule,
  iconLibraryModule,
  worldEditorModule,
  spriteTesterModule
]

const MODULE_MAP = new Map<ModuleId, RendererModuleDefinition>(MODULES.map((m) => [m.id, m]))

export function getModule(id: ModuleId): RendererModuleDefinition | undefined {
  return MODULE_MAP.get(id)
}

export function getContentModules(): RendererModuleDefinition[] {
  return CONTENT_MODULE_ORDER.map((id) => MODULE_MAP.get(id)).filter(Boolean) as RendererModuleDefinition[]
}

export function getToolsModules(): RendererModuleDefinition[] {
  return TOOLS_MODULE_ORDER.map((id) => MODULE_MAP.get(id)).filter(Boolean) as RendererModuleDefinition[]
}

export function getSystemModules(): RendererModuleDefinition[] {
  return SYSTEM_MODULE_ORDER.map((id) => MODULE_MAP.get(id)).filter(Boolean) as RendererModuleDefinition[]
}

export function getAllModules(): RendererModuleDefinition[] {
  return MODULES
}
