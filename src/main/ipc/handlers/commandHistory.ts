import { ipcMain } from 'electron'
import { projectManager } from '../../projects/ProjectManager'
import { ChangeLogService } from '../../commands/changeLog'
import { createCommandBus } from '../../commands/createCommandBus'

export function registerCommandHistoryHandlers(): void {
  ipcMain.handle('commandHistory:listRecent', (_event, limit?: number) =>
    new ChangeLogService(projectManager.getDb()).listRecent(limit)
  )
  ipcMain.handle('commandHistory:undo', () => createCommandBus().undo())
  ipcMain.handle('commandHistory:redo', () => createCommandBus().redo())
}
