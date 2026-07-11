import { ipcMain } from 'electron'
import { projectManager } from '../../projects/ProjectManager'
import { WeaponsRepository } from '../../weapons/weaponsRepository'
import type { WeaponQuery, WeaponInput } from '@shared-types/weapon'

function getRepository(): WeaponsRepository {
  return new WeaponsRepository(projectManager.getDb())
}

export function registerWeaponHandlers(): void {
  ipcMain.handle('weapons:query', (_event, params: WeaponQuery) => getRepository().query(params))

  ipcMain.handle('weapons:get', (_event, id: number) => getRepository().get(id))

  ipcMain.handle('weapons:create', (_event, data: WeaponInput) => getRepository().create(data))

  ipcMain.handle('weapons:update', (_event, id: number, patch: Partial<WeaponInput>) =>
    getRepository().update(id, patch)
  )

  ipcMain.handle('weapons:delete', (_event, id: number) => getRepository().delete(id))

  ipcMain.handle('weapons:bulkUpdate', (_event, ids: number[], patch: Partial<WeaponInput>) =>
    getRepository().bulkUpdate(ids, patch)
  )

  ipcMain.handle('weapons:bulkDelete', (_event, ids: number[]) => getRepository().bulkDelete(ids))

  ipcMain.handle('weapons:listCategories', () => getRepository().listCategories())
}
