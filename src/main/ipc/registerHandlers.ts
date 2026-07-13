import { registerProjectHandlers } from './handlers/project'
import { registerIconHandlers } from './handlers/icons'
import { registerItemHandlers } from './handlers/items'
import { registerWeaponHandlers } from './handlers/weapons'
import { registerArmorHandlers } from './handlers/armor'
import { registerMonsterHandlers } from './handlers/monsters'
import { registerExportHandlers } from './handlers/exportHandlers'
import { registerCommandHistoryHandlers } from './handlers/commandHistory'
import { registerDialogHandlers } from './handlers/dialogHandlers'
import { registerWindowControlHandlers } from './handlers/windowHandlers'
import { registerWorldEditorHandlers } from './handlers/worldEditor'
import { registerWorldZoneHandlers } from './handlers/worldZones'
import { registerEnemyRouteHandlers } from './handlers/enemyRoutes'
import { registerOsmHandlers } from './handlers/osm'
import { registerUpdateHandlers } from './handlers/updates'

/** Single call site from main/index.ts. Each handler module owns one slice of the IPC surface declared in shared-types/api.ts. */
export function registerAllHandlers(): void {
  registerProjectHandlers()
  registerIconHandlers()
  registerItemHandlers()
  registerWeaponHandlers()
  registerArmorHandlers()
  registerMonsterHandlers()
  registerExportHandlers()
  registerCommandHistoryHandlers()
  registerDialogHandlers()
  registerWindowControlHandlers()
  registerWorldEditorHandlers()
  registerWorldZoneHandlers()
  registerEnemyRouteHandlers()
  registerOsmHandlers()
  registerUpdateHandlers()
}
