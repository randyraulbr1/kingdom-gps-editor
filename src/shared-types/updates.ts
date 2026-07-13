/** Resultado de comprobar actualizaciones (auto-update de la app). */
export interface UpdateCheckResult {
  /** false si la app no está empaquetada (modo desarrollo): no hay auto-update. */
  supported: boolean
  /** true si hay una versión más nueva disponible. */
  available?: boolean
  currentVersion: string
  latestVersion?: string
  error?: string
  message?: string
}
