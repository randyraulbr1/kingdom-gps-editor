import { ipcMain } from 'electron'
import { projectManager } from '../../projects/ProjectManager'
import { ItemsRepository } from '../../items/itemsRepository'
import { createCommandBus } from '../../commands/createCommandBus'
import type { ItemQuery, ItemInput } from '@shared-types/item'

function getRepository(): ItemsRepository {
  return new ItemsRepository(projectManager.getDb())
}

export function registerItemHandlers(): void {
  ipcMain.handle('items:query', (_event, params: ItemQuery) => getRepository().query(params))

  ipcMain.handle('items:get', (_event, id: number) => getRepository().get(id))

  ipcMain.handle('items:create', async (_event, data: ItemInput) => {
    const created = await getRepository().create(data)
    await createCommandBus().recordItemCreate(created)
    return created
  })

  ipcMain.handle('items:update', async (_event, id: number, patch: Partial<ItemInput>) => {
    const repository = getRepository()
    const before = await repository.get(id)
    if (!before) throw new Error(`Objeto ${id} no encontrado`)
    const updated = await repository.update(id, patch)
    await createCommandBus().recordItemUpdate(before, updated)
    return updated
  })

  ipcMain.handle('items:delete', async (_event, id: number) => {
    const repository = getRepository()
    const before = await repository.get(id)
    if (!before) throw new Error(`Objeto ${id} no encontrado`)
    await repository.delete(id)
    await createCommandBus().recordItemDelete(before)
  })

  ipcMain.handle('items:bulkUpdate', async (_event, ids: number[], patch: Partial<ItemInput>) => {
    const repository = getRepository()
    const before = await Promise.all(ids.map((id) => repository.get(id)))
    const updated = await repository.bulkUpdate(ids, patch)
    await createCommandBus().recordItemBulkUpdate(before, updated)
    return updated
  })

  ipcMain.handle('items:bulkDelete', (_event, ids: number[]) => getRepository().bulkDelete(ids))

  ipcMain.handle('items:listCategories', () => getRepository().listCategories())
}
