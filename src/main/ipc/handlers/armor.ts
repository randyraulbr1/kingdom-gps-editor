import { ipcMain } from 'electron'
import { projectManager } from '../../projects/ProjectManager'
import { ArmorRepository } from '../../armor/armorRepository'
import { createCommandBus } from '../../commands/createCommandBus'
import type { ArmorQuery, ArmorInput } from '@shared-types/armor'

function getRepository(): ArmorRepository {
  return new ArmorRepository(projectManager.getDb())
}

export function registerArmorHandlers(): void {
  ipcMain.handle('armor:query', (_event, params: ArmorQuery) => getRepository().query(params))

  ipcMain.handle('armor:get', (_event, id: number) => getRepository().get(id))

  ipcMain.handle('armor:create', async (_event, data: ArmorInput) => {
    const created = await getRepository().create(data)
    await createCommandBus().recordArmorCreate(created)
    return created
  })

  ipcMain.handle('armor:update', async (_event, id: number, patch: Partial<ArmorInput>) => {
    const repository = getRepository()
    const before = await repository.get(id)
    if (!before) throw new Error(`Armadura ${id} no encontrada`)
    const updated = await repository.update(id, patch)
    await createCommandBus().recordArmorUpdate(before, updated)
    return updated
  })

  ipcMain.handle('armor:delete', async (_event, id: number) => {
    const repository = getRepository()
    const before = await repository.get(id)
    if (!before) throw new Error(`Armadura ${id} no encontrada`)
    await repository.delete(id)
    await createCommandBus().recordArmorDelete(before)
  })

  ipcMain.handle('armor:bulkUpdate', async (_event, ids: number[], patch: Partial<ArmorInput>) => {
    const repository = getRepository()
    const before = await Promise.all(ids.map((id) => repository.get(id)))
    const updated = await repository.bulkUpdate(ids, patch)
    await createCommandBus().recordArmorBulkUpdate(before, updated)
    return updated
  })

  ipcMain.handle('armor:bulkDelete', (_event, ids: number[]) => getRepository().bulkDelete(ids))

  ipcMain.handle('armor:listCategories', () => getRepository().listCategories())
}
