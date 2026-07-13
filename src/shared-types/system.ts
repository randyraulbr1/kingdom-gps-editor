/**
 * Configuración del servidor del juego para publicar contenido ("Subir al mundo").
 * El editor gestiona la autenticación automáticamente: guarda el usuario y la
 * contraseña de admin UNA vez, inicia sesión solo y reutiliza el token
 * internamente. El usuario nunca copia ni pega un token.
 */
export interface ServerConfig {
  /** URL base del servidor (p. ej. https://mariel-online.onrender.com). */
  url: string
  /** Usuario administrador del juego (se guarda una vez). */
  adminUser: string
  /** Contraseña del administrador (se guarda una vez, cifrada en disco local). */
  adminPass: string
}

/** Estado de la conexión con el servidor (para Configuración ▸ Servidor). */
export interface ServerAuthStatus {
  ok: boolean
  /** Rol detectado tras iniciar sesión (owner/admin/…). */
  role?: string
  /** Mensaje claro para mostrar al usuario. */
  message: string
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

/** Un jugador REAL registrado, administrable desde el editor (panel adm). */
export interface GamePlayer {
  id: string
  nombre: string
  telefono?: string
  /** true si es la cuenta admin protegida. */
  esAdmin?: boolean
  creado?: number | null
  /** Datos de partida (lo que antes mostraba el admin dentro del juego). */
  dinero?: number
  nivel?: number
  experiencia?: number
  vida?: number | null
  hambre?: number | null
  muerto?: boolean
  /** Total de objetos en la mochila. */
  objetos?: number
  /** Posición GPS [lat, lng] si existe. */
  posicion?: [number, number] | null
  conectado?: boolean
}

/** Datos para crear una cuenta de jugador de prueba desde el editor. */
export interface CreatePlayerInput {
  usuario: string
  password: string
  telefono?: string
}

/** Resultado genérico de una operación de administración de jugadores. */
export interface PlayerAdminResult {
  ok: boolean
  message: string
}
