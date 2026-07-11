import { ipcMain } from 'electron'
import { projectManager } from '../../projects/ProjectManager'
import { WeaponsRepository } from '../../weapons/weaponsRepository'
import { createCommandBus } from '../../commands/createCommandBus'
import type { WeaponQuery, WeaponInput } from '@shared-types/weapon'

function getRepository(): WeaponsRepository {
  return new WeaponsRepository(projectManager.getDb())
}

export function registerWeaponHandlers(): void {
  ipcMain.handle('weapons:query', (_event, params: WeaponQuery) => getRepository().query(params))

  ipcMain.handle('weapons:get', (_event, id: number) => getRepository().get(id))

  ipcMain.handle('weapons:create', async (_event, data: WeaponInput) => {
    const created = await getRepository().create(data)
    await createCommandBus().recordWeaponCreate(created)
    return created
  })

  ipcMain.handle('weapons:update', async (_event, id: number, patch: Partial<WeaponInput>) => {
    const repository = getRepository()
    const before = await repository.get(id)
    if (!before) throw new Error(`Arma ${id} no encontrada`)
    const updated = await repository.update(id, patch)
    await createCommandBus().recordWeaponUpdate(before, updated)
    return updated
  })

  ipcMain.handle('weapons:delete', async (_event, id: number) => {
    const repository = getRepository()
    const before = await repository.get(id)
    if (!before) throw new Error(`Arma ${id} no encontrada`)
    await repository.delete(id)
    await createCommandBus().recordWeaponDelete(before)
  })

  ipcMain.handle('weapons:bulkUpdate', async (_event, ids: number[], patch: Partial<WeaponInput>) => {
    const repository = getRepository()
    const before = await Promise.all(ids.map((id) => repository.get(id)))
    const updated = await repository.bulkUpdate(ids, patch)
    await createCommandBus().recordWeaponBulkUpdate(before, updated)
    return updated
  })

  ipcMain.handle('weapons:bulkDelete', (_event, ids: number[]) => getRepository().bulkDelete(ids))

  ipcMain.handle('weapons:listCategories', () => getRepository().listCategories())
}
