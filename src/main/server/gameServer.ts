/**
 * Cliente del servidor del juego con AUTENTICACIÓN AUTOMÁTICA.
 *
 * El editor es el panel de administración oficial: guarda el usuario y la
 * contraseña de admin una sola vez (en userData/server.json) y a partir de ahí
 * inicia sesión solo, cachea el JWT en memoria y lo reutiliza. Si el token
 * caduca (401), vuelve a iniciar sesión automáticamente. El usuario nunca copia
 * ni pega un token.
 */

import { app } from 'electron'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { ServerConfig } from '@shared-types/system'

const SERVER_CONFIG_PATH = (): string => path.join(app.getPath('userData'), 'server.json')

/** Token en memoria (no se persiste; se regenera con las credenciales). */
let cachedToken: string | null = null
let cachedRole: string | null = null

export async function readServerConfig(): Promise<ServerConfig> {
  try {
    const raw = await fs.readFile(SERVER_CONFIG_PATH(), 'utf-8')
    const parsed = JSON.parse(raw) as Partial<ServerConfig> & { token?: string }
    return {
      url: typeof parsed.url === 'string' ? parsed.url : '',
      adminUser: typeof parsed.adminUser === 'string' ? parsed.adminUser : '',
      adminPass: typeof parsed.adminPass === 'string' ? parsed.adminPass : ''
    }
  } catch {
    return { url: '', adminUser: '', adminPass: '' }
  }
}

export async function writeServerConfig(config: ServerConfig): Promise<void> {
  const clean: ServerConfig = {
    url: (config.url ?? '').trim(),
    adminUser: (config.adminUser ?? '').trim(),
    adminPass: config.adminPass ?? ''
  }
  await fs.writeFile(SERVER_CONFIG_PATH(), JSON.stringify(clean, null, 2), 'utf-8')
  // Cambió la config → invalida el token cacheado para forzar un login nuevo.
  cachedToken = null
  cachedRole = null
}

function baseUrl(url: string): string {
  return url.replace(/\/$/, '')
}

/** Error con mensaje ya "amigable" para mostrar en la UI. */
export class ServerError extends Error {
  constructor(
    message: string,
    readonly status = 0
  ) {
    super(message)
    this.name = 'ServerError'
  }
}

/** Inicia sesión y devuelve { token, role }. Lanza ServerError con mensaje claro. */
async function login(config: ServerConfig): Promise<{ token: string; role: string }> {
  if (!config.url) throw new ServerError('Falta la URL del servidor en Configuración ▸ Servidor.')
  if (!config.adminUser || !config.adminPass) {
    throw new ServerError('Falta el usuario o la contraseña de admin en Configuración ▸ Servidor.')
  }
  let response: Response
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20_000)
  try {
    response = await fetch(`${baseUrl(config.url)}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: config.adminUser, password: config.adminPass }),
      signal: controller.signal
    })
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError'
    throw new ServerError(aborted ? 'El servidor tardó demasiado en responder.' : 'No se pudo conectar con el servidor.')
  } finally {
    clearTimeout(timeout)
  }

  const data = (await response.json().catch(() => ({}))) as {
    ok?: boolean
    token?: string
    error?: string
    user?: { role?: string }
  }
  if (!response.ok || !data.ok || !data.token) {
    if (response.status === 401) throw new ServerError('Usuario o contraseña de admin incorrectos.', 401)
    throw new ServerError(data.error || 'No se pudo iniciar sesión en el servidor.', response.status)
  }
  return { token: data.token, role: data.user?.role || 'jugador' }
}

/** Devuelve un token válido, iniciando sesión si hace falta. */
export async function ensureToken(force = false): Promise<string> {
  if (cachedToken && !force) return cachedToken
  const config = await readServerConfig()
  const { token, role } = await login(config)
  cachedToken = token
  cachedRole = role
  return token
}

/** Comprueba las credenciales iniciando sesión (para el botón "Probar conexión"). */
export async function checkAuth(): Promise<{ ok: boolean; role?: string; message: string }> {
  try {
    await ensureToken(true)
    return { ok: true, role: cachedRole ?? undefined, message: `Conectado como ${cachedRole || 'admin'}.` }
  } catch (error) {
    const message = error instanceof ServerError ? error.message : 'No se pudo conectar con el servidor.'
    return { ok: false, message }
  }
}

/**
 * fetch autenticado contra el servidor del juego. Añade el Bearer token
 * automáticamente y, si recibe 401 (token caducado), vuelve a iniciar sesión
 * UNA vez y reintenta. Devuelve el JSON ya parseado.
 */
export async function apiFetch<T = unknown>(
  routePath: string,
  options: { method?: string; body?: unknown; auth?: boolean; timeoutMs?: number } = {}
): Promise<T> {
  const { method = 'GET', body, auth = true, timeoutMs = 20_000 } = options
  const config = await readServerConfig()
  if (!config.url) throw new ServerError('Falta la URL del servidor en Configuración ▸ Servidor.')

  const doFetch = async (token: string | null): Promise<Response> => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    try {
      return await fetch(`${baseUrl(config.url)}${routePath}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal
      })
    } finally {
      clearTimeout(timeout)
    }
  }

  let token = auth ? await ensureToken() : null
  let response: Response
  try {
    response = await doFetch(token)
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError'
    throw new ServerError(aborted ? 'El servidor tardó demasiado en responder.' : 'No se pudo conectar con el servidor.')
  }

  // Token caducado → reintentar una vez con sesión nueva.
  if (auth && (response.status === 401 || response.status === 403)) {
    token = await ensureToken(true)
    response = await doFetch(token)
  }

  const data = (await response.json().catch(() => ({}))) as T & { ok?: boolean; error?: string }
  if (!response.ok || (data as { ok?: boolean }).ok === false) {
    if (response.status === 403) throw new ServerError('La cuenta configurada no tiene permiso de administrador.', 403)
    if (response.status === 429) throw new ServerError('Demasiadas operaciones seguidas — espera un momento.', 429)
    throw new ServerError((data as { error?: string }).error || `Error del servidor (${response.status}).`, response.status)
  }
  return data
}
