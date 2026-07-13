/** Configuración del servidor del juego para publicar contenido ("Subir al mundo"). */
export interface ServerConfig {
  /** URL base del servidor (p. ej. https://tcodm.com). */
  url: string
  /** Token de autorización (Bearer). */
  token: string
}

/** Resultado de una captura de pantalla. */
export interface CaptureResult {
  /** Ruta absoluta del PNG guardado. */
  path: string
  /** Nombre del archivo (captura-N.png). */
  name: string
}

/** Resultado de intentar subir un pin al mundo/servidor. */
export interface PublishEntityResult {
  ok: boolean
  /** Nuevo estado de sincronización de la entidad. */
  syncStatus: string
  message?: string
}
