import { ipcMain } from 'electron'
import { projectManager } from '../../projects/ProjectManager'

export function registerProjectHandlers(): void {
  ipcMain.handle('project:create', (_event, parentDir: string, name: string) =>
    projectManager.create(parentDir, name)
  )
  ipcMain.handle('project:open', (_event, projectPath: string) => projectManager.open(projectPath))
  ipcMain.handle('project:listRecent', () => projectManager.listRecent())
  ipcMain.handle('project:getCurrent', () => projectManager.getCurrentInfo())
  ipcMain.handle('project:checkHealth', () => projectManager.checkHealth())
  ipcMain.handle('project:backupNow', () => projectManager.backupNow())
}
