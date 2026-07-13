export type ModuleCapability = 'create' | 'edit' | 'delete' | 'export' | 'bulkEdit' | 'import'

export type ModuleGroup = 'content' | 'tools' | 'system'

/** Content modules mirror the game-data domains; 'tools' and 'icon-library' are editor-side utility modules. */
export type ModuleId =
  | 'items'
  | 'weapons'
  | 'armors'
  | 'tools_equipment'
  | 'resources'
  | 'food'
  | 'crops'
  | 'constructions'
  | 'npcs'
  | 'monsters'
  | 'loot'
  | 'quests'
  | 'dialogues'
  | 'maps'
  | 'economy'
  | 'crafting'
  | 'recipes'
  | 'professions'
  | 'animals'
  | 'pets'
  | 'events'
  | 'settings'
  | 'tools'
  | 'icon-library'
  | 'world-editor'
  | 'sprite-tester'
  | 'game-view'
  | 'players-admin'

export interface ModuleShortcut {
  /** e.g. "Ctrl+N" */
  combo: string
  description: string
}

/** Fields shared by both the main-process and renderer-process module definitions. */
export interface ModuleDefinitionMeta {
  id: ModuleId
  name: string
  /** lucide-react icon component name, e.g. "Sword" */
  icon: string
  group: ModuleGroup
  capabilities: ModuleCapability[]
  shortcuts?: ModuleShortcut[]
}

export const CONTENT_MODULE_ORDER: ModuleId[] = [
  'items',
  'weapons',
  'armors',
  'tools_equipment',
  'resources',
  'food',
  'crops',
  'constructions',
  'npcs',
  'monsters',
  'loot',
  'quests',
  'dialogues',
  'maps',
  'economy',
  'crafting',
  'recipes',
  'professions',
  'animals',
  'pets',
  'events'
]

export const TOOLS_MODULE_ORDER: ModuleId[] = [
  'world-editor',
  'game-view',
  'players-admin',
  'sprite-tester',
  'icon-library',
  'tools'
]

export const SYSTEM_MODULE_ORDER: ModuleId[] = ['settings']
