/**
 * Sprite sheets: matemática de la cuadrícula y modelo de REFERENCIA de celda.
 * Una celda se referencia (nunca se copia la imagen) como:
 *   { sheetId, x, y, width, height }
 * Ver RECURSOS_ARQUITECTURA.md. Funciones puras (con pruebas).
 */

/** Referencia a una celda de un sprite sheet (o a una imagen individual si no hay celda). */
export interface SpriteCellRef {
  /** Id de la hoja (aquí, el iconId de la imagen en la Biblioteca). */
  sheetId: number
  x: number
  y: number
  width: number
  height: number
}

/** Una celda calculada de la cuadrícula. */
export interface GridCell {
  col: number
  row: number
  x: number
  y: number
  width: number
  height: number
}

export interface GridOptions {
  /** Separación entre celdas (px). */
  spacing?: number
  /** Margen exterior de la hoja (px). */
  margin?: number
}

function toPosInt(value: unknown, fallback: number): number {
  const n = typeof value === 'string' ? Number(value) : value
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback
}

/**
 * Calcula todas las celdas de una hoja `sheetW×sheetH` con celdas
 * `cellW×cellH` (más spacing/margin opcionales). Devuelve la lista en orden
 * fila por fila.
 */
export function computeGrid(
  sheetW: number,
  sheetH: number,
  cellW: number,
  cellH: number,
  opts: GridOptions = {}
): GridCell[] {
  const w = toPosInt(cellW, 1)
  const h = toPosInt(cellH, 1)
  const spacing = Math.max(0, Math.floor(opts.spacing ?? 0))
  const margin = Math.max(0, Math.floor(opts.margin ?? 0))
  if (sheetW <= 0 || sheetH <= 0) return []

  const cells: GridCell[] = []
  let row = 0
  for (let y = margin; y + h <= sheetH + 0.001; y += h + spacing) {
    let col = 0
    for (let x = margin; x + w <= sheetW + 0.001; x += w + spacing) {
      cells.push({ col, row, x, y, width: w, height: h })
      col++
    }
    row++
  }
  return cells
}

/** Nº de columnas y filas que caben. */
export function gridSize(
  sheetW: number,
  sheetH: number,
  cellW: number,
  cellH: number,
  opts: GridOptions = {}
): { cols: number; rows: number } {
  const w = toPosInt(cellW, 1)
  const h = toPosInt(cellH, 1)
  const spacing = Math.max(0, Math.floor(opts.spacing ?? 0))
  const margin = Math.max(0, Math.floor(opts.margin ?? 0))
  const cols = Math.max(0, Math.floor((sheetW - 2 * margin + spacing) / (w + spacing)))
  const rows = Math.max(0, Math.floor((sheetH - 2 * margin + spacing) / (h + spacing)))
  return { cols, rows }
}

/** Referencia de la celda (col,row) de una hoja, o null si está fuera de rango. */
export function cellRefAt(
  sheetId: number,
  sheetW: number,
  sheetH: number,
  cellW: number,
  cellH: number,
  col: number,
  row: number,
  opts: GridOptions = {}
): SpriteCellRef | null {
  const { cols, rows } = gridSize(sheetW, sheetH, cellW, cellH, opts)
  if (col < 0 || row < 0 || col >= cols || row >= rows) return null
  const w = toPosInt(cellW, 1)
  const h = toPosInt(cellH, 1)
  const spacing = Math.max(0, Math.floor(opts.spacing ?? 0))
  const margin = Math.max(0, Math.floor(opts.margin ?? 0))
  return { sheetId, x: margin + col * (w + spacing), y: margin + row * (h + spacing), width: w, height: h }
}

/** Sanea una referencia de celda desconocida; devuelve null si no es válida. */
export function normalizeCellRef(raw: unknown): SpriteCellRef | null {
  const o = (raw ?? {}) as Record<string, unknown>
  const sheetId = Number(o.sheetId)
  const x = Number(o.x)
  const y = Number(o.y)
  const width = Number(o.width)
  const height = Number(o.height)
  if (![sheetId, x, y, width, height].every((n) => Number.isFinite(n))) return null
  if (width <= 0 || height <= 0 || x < 0 || y < 0) return null
  return { sheetId, x: Math.floor(x), y: Math.floor(y), width: Math.floor(width), height: Math.floor(height) }
}

/** Clave estable para comparar/identificar una celda. */
export function cellKey(ref: SpriteCellRef): string {
  return `${ref.sheetId}:${ref.x},${ref.y},${ref.width},${ref.height}`
}
