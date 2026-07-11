import { app, BrowserWindow } from 'electron'
import { registerAllHandlers } from './ipc/registerHandlers'
import { registerIconProtocolScheme, registerIconProtocolHandler } from './icons/iconProtocol'
import { createMainWindow } from './window'
import { projectManager } from './projects/ProjectManager'

registerIconProtocolScheme()

app.whenReady().then(() => {
  registerIconProtocolHandler()
  registerAllHandlers()
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  projectManager.close().finally(() => {
    if (process.platform !== 'darwin') app.quit()
  })
})
