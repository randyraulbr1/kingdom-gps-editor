import { ipcMain } from 'electron'
import path from 'node:path'
import { projectManager } from '../../projects/ProjectManager'
import { IconLibraryRepository } from '../../icons/iconLibraryRepository'
import { IconLibraryService } from '../../icons/iconLibraryService'
import { createCommandBus } from '../../commands/createCommandBus'
import type { IconQuery, IconResizeRequest } from '@shared-types/icon'

function getServices() {
  const db = projectManager.getDb()
  const info = projectManager.getCurrentInfo()
  if (!info) throw new Error('No hay un proyecto abierto')

  const repository = new IconLibraryRepository(db)
  const service = new IconLibraryService(repository, path.join(info.path, 'assets', 'icons'))
  return { repository, service, commandBus: createCommandBus() }
}

export function registerIconHandlers(): void {
  ipcMain.handle('icons:list', (_event, query: IconQuery) => getServices().repository.list(query))

  ipcMain.handle('icons:get', (_event, iconId: number) => getServices().repository.get(iconId))

  ipcMain.handle('icons:importFolder', (_event, sourceDir: string) => getServices().service.importFolder(sourceDir))

  ipcMain.handle('icons:toggleFavorite', async (_event, iconId: number) => {
    const { repository, commandBus } = getServices()
    const before = await repository.get(iconId)
    if (!before) throw new Error(`Icono ${iconId} no encontrado`)
    const updated = await repository.setFavorite(iconId, !before.favorite)
    await commandBus.recordFavoriteToggle(iconId, before.favorite, updated.favorite)
    return updated
  })

  ipcMain.handle('icons:setTags', async (_event, iconId: number, tags: string[]) => {
    const { repository, commandBus } = getServices()
    const before = await repository.get(iconId)
    if (!before) throw new Error(`Icono ${iconId} no encontrado`)
    const updated = await repository.setTags(iconId, tags)
    await commandBus.recordTagsChange(iconId, before.tags, updated.tags)
    return updated
  })

  ipcMain.handle('icons:resize', (_event, request: IconResizeRequest) => getServices().service.resize(request))

  ipcMain.handle('icons:listCategories', () => getServices().repository.listCategories())

  ipcMain.handle('icons:listTags', () => getServices().repository.listTags())
}
