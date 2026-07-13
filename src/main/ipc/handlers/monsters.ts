import { ipcMain } from 'electron'
import { projectManager } from '../../projects/ProjectManager'
import { MonstersRepository } from '../../monsters/monstersRepository'
import { createCommandBus } from '../../commands/createCommandBus'
import type { MonsterQuery, MonsterInput } from '@shared-types/monster'

function getRepository(): MonstersRepository {
  return new MonstersRepository(projectManager.getDb())
}

export function registerMonsterHandlers(): void {
  ipcMain.handle('monsters:query', (_event, params: MonsterQuery) => getRepository().query(params))

  ipcMain.handle('monsters:get', (_event, id: number) => getRepository().get(id))

  ipcMain.handle('monsters:create', async (_event, data: MonsterInput) => {
    const created = await getRepository().create(data)
    await createCommandBus().recordMonsterCreate(created)
    return created
  })

  ipcMain.handle('monsters:update', async (_event, id: number, patch: Partial<MonsterInput>) => {
    const repository = getRepository()
    const before = await repository.get(id)
    if (!before) throw new Error(`Monstruo ${id} no encontrado`)
    const updated = await repository.update(id, patch)
    await createCommandBus().recordMonsterUpdate(before, updated)
    return updated
  })

  ipcMain.handle('monsters:delete', async (_event, id: number) => {
    const repository = getRepository()
    const before = await repository.get(id)
    if (!before) throw new Error(`Monstruo ${id} no encontrado`)
    await repository.delete(id)
    await createCommandBus().recordMonsterDelete(before)
  })

  ipcMain.handle('monsters:bulkUpdate', async (_event, ids: number[], patch: Partial<MonsterInput>) => {
    const repository = getRepository()
    const before = await Promise.all(ids.map((id) => repository.get(id)))
    const updated = await repository.bulkUpdate(ids, patch)
    await createCommandBus().recordMonsterBulkUpdate(before, updated)
    return updated
  })

  ipcMain.handle('monsters:bulkDelete', (_event, ids: number[]) => getRepository().bulkDelete(ids))

  ipcMain.handle('monsters:listCategories', () => getRepository().listCategories())
}
