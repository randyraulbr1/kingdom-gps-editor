import { protocol, net } from 'electron'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { projectManager } from '../projects/ProjectManager'

/** Must run before app.whenReady(); registers kgps-icon:// as a standard, fetch-capable, CSP-exempt scheme. */
export function registerIconProtocolScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'kgps-icon',
      privileges: { standard: true, secure: true, supportFetchAPI: true, bypassCSP: true, stream: true }
    }
  ])
}

/**
 * Serves files from the open project's assets/icons folder without ever
 * exposing an absolute filesystem path to the renderer - the renderer only
 * ever sees `kgps-icon://<relative-path>`.
 */
export function registerIconProtocolHandler(): void {
  protocol.handle('kgps-icon', (request) => {
    const info = projectManager.getCurrentInfo()
    if (!info) return new Response('No hay un proyecto abierto', { status: 404 })

    const url = new URL(request.url)
    const relativePath = decodeURIComponent(`${url.hostname}${url.pathname}`)
    const filePath = path.join(info.path, 'assets', 'icons', relativePath)

    return net.fetch(pathToFileURL(filePath).toString())
  })
}
