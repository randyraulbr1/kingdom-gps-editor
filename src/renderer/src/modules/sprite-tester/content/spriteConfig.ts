/**
 * Sprite Sheet Editor / Probador de Personaje — lógica pura (sin React).
 *
 * Modela una hoja de sprites: una imagen grande de la que se recortan regiones
 * rectangulares y se asignan a combinaciones de ACCIÓN (idle, walk, run…) y
 * DIRECCIÓN (8 direcciones). El probador usa WASD para mover un personaje y
 * elegir la animación adecuada. Todo lo testable vive aquí: mapeo de teclas a
 * dirección/acción, animación por FPS, colisiones AABB, validación y JSON.
 */

// ===== Direcciones y acciones =====

export type Direction = 'down' | 'down_left' | 'left' | 'up_left' | 'up' | 'up_right' | 'right' | 'down_right'

export const DIRECTIONS: Direction[] = ['down', 'down_left', 'left', 'up_left', 'up', 'up_right', 'right', 'down_right']

export const DIRECTION_LABELS: Record<Direction, string> = {
  down: 'Abajo',
  down_left: 'Abajo izquierda',
  left: 'Izquierda',
  up_left: 'Arriba izquierda',
  up: 'Arriba',
  up_right: 'Arriba derecha',
  right: 'Derecha',
  down_right: 'Abajo derecha'
}

export type Action =
  | 'idle'
  | 'walk'
  | 'run'
  | 'crouch'
  | 'crouch_walk'
  | 'slide'
  | 'shoot'
  | 'reload'
  | 'dead'

export const ACTIONS: Action[] = ['idle', 'walk', 'run', 'crouch', 'crouch_walk', 'slide', 'shoot', 'reload', 'dead']

export const ACTION_LABELS: Record<Action, string> = {
  idle: 'Quieto',
  walk: 'Caminar',
  run: 'Correr',
  crouch: 'Agachado',
  crouch_walk: 'Agachado caminando',
  slide: 'Deslizándose',
  shoot: 'Disparando',
  reload: 'Recargando',
  dead: 'Muerto'
}

/** FPS por defecto sugeridos por la especificación. */
export const DEFAULT_FPS: Record<Action, number> = {
  idle: 4,
  walk: 8,
  run: 12,
  crouch: 4,
  crouch_walk: 6,
  slide: 10,
  shoot: 12,
  reload: 8,
  dead: 1
}

// ===== Geometría / configuración =====

export interface SpriteRect {
  x: number
  y: number
  width: number
  height: number
}

export interface ActionSettings {
  fps: number
  loop: boolean
}

export type AnimationMap = Record<Action, Partial<Record<Direction, SpriteRect[]>>>

export interface SpriteConfig {
  /** Nombre del archivo de imagen (referencia; los datos de la imagen son estado de UI). */
  image: string
  frameSize: { width: number; height: number }
  /** Tamaño de celda de la cuadrícula opcional. */
  gridSize: number
  animations: AnimationMap
  settings: Record<Action, ActionSettings>
  hitbox: { width: number; height: number }
  walkSpeed: number
  runSpeed: number
  slideDistance: number
}

function emptyAnimations(): AnimationMap {
  return ACTIONS.reduce((acc, a) => {
    acc[a] = {}
    return acc
  }, {} as AnimationMap)
}

function defaultSettings(): Record<Action, ActionSettings> {
  return ACTIONS.reduce((acc, a) => {
    acc[a] = { fps: DEFAULT_FPS[a], loop: a !== 'dead' && a !== 'shoot' && a !== 'reload' ? true : false }
    return acc
  }, {} as Record<Action, ActionSettings>)
}

export function createEmptyConfig(frameWidth = 64, frameHeight = 64): SpriteConfig {
  return {
    image: '',
    frameSize: { width: frameWidth, height: frameHeight },
    gridSize: 64,
    animations: emptyAnimations(),
    settings: defaultSettings(),
    hitbox: { width: 32, height: 32 },
    walkSpeed: 120,
    runSpeed: 220,
    slideDistance: 80
  }
}

// ===== Teclas → dirección y acción =====

export interface MovementKeys {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
}

/** Dirección resultante de las teclas WASD, o null si no hay movimiento. */
export function directionFromKeys(keys: MovementKeys): Direction | null {
  const up = keys.up && !keys.down
  const down = keys.down && !keys.up
  const left = keys.left && !keys.right
  const right = keys.right && !keys.left

  if (up && right) return 'up_right'
  if (up && left) return 'up_left'
  if (down && right) return 'down_right'
  if (down && left) return 'down_left'
  if (up) return 'up'
  if (down) return 'down'
  if (left) return 'left'
  if (right) return 'right'
  return null
}

/** Mantiene la última dirección al soltar las teclas (personaje quieto mirando ahí). */
export function resolveDirection(keys: MovementKeys, lastDirection: Direction): Direction {
  return directionFromKeys(keys) ?? lastDirection
}

export interface InputState {
  moving: boolean
  shift: boolean
  ctrl: boolean
  space: boolean
  shooting: boolean
  reloading: boolean
  dead: boolean
}

/**
 * Acción según el estado de entrada, en orden de prioridad:
 * muerto > recargando > disparando > deslizándose > (agachado[/caminando]) >
 * corriendo > caminando > quieto.
 */
export function actionFromInput(input: InputState): Action {
  if (input.dead) return 'dead'
  if (input.reloading) return 'reload'
  if (input.shooting) return 'shoot'
  if (input.space) return 'slide'
  if (input.ctrl) return input.moving ? 'crouch_walk' : 'crouch'
  if (input.moving) return input.shift ? 'run' : 'walk'
  return 'idle'
}

// ===== Cuadrícula / selección =====

/** Ajusta un rectángulo a la cuadrícula del tamaño dado. */
export function snapToGrid(rect: SpriteRect, gridSize: number): SpriteRect {
  if (gridSize <= 0) return rect
  const snap = (v: number): number => Math.round(v / gridSize) * gridSize
  return {
    x: snap(rect.x),
    y: snap(rect.y),
    width: Math.max(gridSize, snap(rect.width)),
    height: Math.max(gridSize, snap(rect.height))
  }
}

// ===== Animación =====

/** Índice de frame en un instante dado (ms), según FPS, cantidad y bucle. */
export function frameIndexAt(elapsedMs: number, fps: number, frameCount: number, loop: boolean): number {
  if (frameCount <= 0) return 0
  if (fps <= 0) return 0
  const frame = Math.floor((elapsedMs / 1000) * fps)
  if (loop) return ((frame % frameCount) + frameCount) % frameCount
  return Math.min(frame, frameCount - 1)
}

/**
 * Frame a dibujar para una acción/dirección/tiempo, con degradación elegante:
 * si la acción+dirección no tiene frames, cae a `idle` en la misma dirección,
 * y si tampoco, a `idle` mirando abajo. Devuelve null si no hay nada.
 */
export function getFrameFor(
  config: SpriteConfig,
  action: Action,
  direction: Direction,
  elapsedMs: number
): SpriteRect | null {
  const candidates: Array<[Action, Direction]> = [
    [action, direction],
    ['idle', direction],
    ['idle', 'down']
  ]
  for (const [a, d] of candidates) {
    const frames = config.animations[a]?.[d]
    if (frames && frames.length > 0) {
      const idx = frameIndexAt(elapsedMs, config.settings[a].fps, frames.length, config.settings[a].loop)
      return frames[idx]
    }
  }
  return null
}

// ===== Colisiones (AABB) =====

export interface Box {
  x: number
  y: number
  width: number
  height: number
}

function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

/**
 * Mueve una caja (hitbox) por dx/dy resolviendo colisiones contra las paredes
 * eje por eje (permite deslizar por las paredes). Devuelve la nueva posición
 * (x,y de la esquina superior izquierda de la hitbox).
 */
export function moveWithCollision(box: Box, dx: number, dy: number, walls: Box[]): { x: number; y: number } {
  let nx = box.x + dx
  // Eje X
  const boxX: Box = { x: nx, y: box.y, width: box.width, height: box.height }
  for (const wall of walls) {
    if (overlaps(boxX, wall)) {
      nx = dx > 0 ? wall.x - box.width : wall.x + wall.width
      boxX.x = nx
    }
  }
  let ny = box.y + dy
  const boxY: Box = { x: nx, y: ny, width: box.width, height: box.height }
  for (const wall of walls) {
    if (overlaps(boxY, wall)) {
      ny = dy > 0 ? wall.y - box.height : wall.y + wall.height
      boxY.y = ny
    }
  }
  return { x: nx, y: ny }
}

// ===== Validación =====

export interface SpriteValidationWarning {
  code:
    | 'missing_idle'
    | 'missing_direction'
    | 'action_no_frames'
    | 'rect_out_of_bounds'
    | 'inconsistent_frame_size'
  message: string
}

export interface ImageDims {
  width: number
  height: number
}

/** Direcciones que se consideran obligatorias como mínimo (las 8). */
const REQUIRED_DIRECTIONS = DIRECTIONS

/**
 * Valida la configuración (doc: detección de errores). `imageDims` es opcional;
 * si se pasa, comprueba que los rectángulos caben dentro de la imagen.
 */
export function validateSpriteConfig(config: SpriteConfig, imageDims?: ImageDims): SpriteValidationWarning[] {
  const warnings: SpriteValidationWarning[] = []

  // Falta idle por completo
  const idleHasAny = Object.values(config.animations.idle ?? {}).some((f) => (f?.length ?? 0) > 0)
  if (!idleHasAny) {
    warnings.push({ code: 'missing_idle', message: 'Falta el sprite Quieto (idle) en todas las direcciones' })
  }

  // idle y walk deben tener las 8 direcciones
  for (const action of ['idle', 'walk'] as Action[]) {
    for (const dir of REQUIRED_DIRECTIONS) {
      const frames = config.animations[action]?.[dir]
      if (!frames || frames.length === 0) {
        warnings.push({
          code: 'missing_direction',
          message: `${ACTION_LABELS[action]}: falta la dirección ${DIRECTION_LABELS[dir]}`
        })
      }
    }
  }

  // Consistencia de tamaño de frame y límites de la imagen
  const { width: fw, height: fh } = config.frameSize
  for (const action of ACTIONS) {
    const dirMap = config.animations[action] ?? {}
    let hasAny = false
    for (const dir of DIRECTIONS) {
      const frames = dirMap[dir]
      if (!frames) continue
      for (const r of frames) {
        hasAny = true
        if (r.width !== fw || r.height !== fh) {
          warnings.push({
            code: 'inconsistent_frame_size',
            message: `${ACTION_LABELS[action]} (${DIRECTION_LABELS[dir]}): frame ${r.width}×${r.height} distinto del tamaño base ${fw}×${fh}`
          })
        }
        if (imageDims && (r.x < 0 || r.y < 0 || r.x + r.width > imageDims.width || r.y + r.height > imageDims.height)) {
          warnings.push({
            code: 'rect_out_of_bounds',
            message: `${ACTION_LABELS[action]} (${DIRECTION_LABELS[dir]}): la región se sale de la imagen`
          })
        }
      }
    }
    // acción con dirección declarada pero sin frames se cubre arriba; aquí avisamos si idle/walk quedaron vacíos del todo
    if (!hasAny && (action === 'idle' || action === 'walk')) {
      warnings.push({ code: 'action_no_frames', message: `${ACTION_LABELS[action]} no tiene ningún frame` })
    }
  }

  return warnings
}

// ===== Serialización JSON =====

/** Exporta a JSON, omitiendo direcciones vacías (formato del ejemplo de la spec). */
export function serializeConfig(config: SpriteConfig): string {
  const animations: Record<string, Record<string, SpriteRect[]>> = {}
  for (const action of ACTIONS) {
    const dirMap = config.animations[action] ?? {}
    const out: Record<string, SpriteRect[]> = {}
    for (const dir of DIRECTIONS) {
      const frames = dirMap[dir]
      if (frames && frames.length > 0) out[dir] = frames
    }
    if (Object.keys(out).length > 0) animations[action] = out
  }
  return JSON.stringify(
    {
      image: config.image,
      frameSize: config.frameSize,
      gridSize: config.gridSize,
      animations,
      settings: config.settings,
      hitbox: config.hitbox,
      walkSpeed: config.walkSpeed,
      runSpeed: config.runSpeed,
      slideDistance: config.slideDistance
    },
    null,
    2
  )
}

function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

function parseRect(raw: unknown): SpriteRect | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (typeof o.x !== 'number' || typeof o.y !== 'number' || typeof o.width !== 'number' || typeof o.height !== 'number') {
    return null
  }
  return { x: o.x, y: o.y, width: o.width, height: o.height }
}

/** Importa desde JSON, saneando y rellenando lo que falte con valores por defecto. */
export function parseConfig(json: string): SpriteConfig {
  const raw = JSON.parse(json) as Record<string, unknown>
  const base = createEmptyConfig()
  const frameSize = (raw.frameSize ?? {}) as Record<string, unknown>
  base.image = typeof raw.image === 'string' ? raw.image : ''
  base.frameSize = { width: num(frameSize.width, 64), height: num(frameSize.height, 64) }
  base.gridSize = num(raw.gridSize, base.frameSize.width)

  const anims = (raw.animations ?? {}) as Record<string, unknown>
  for (const action of ACTIONS) {
    const dirMap = (anims[action] ?? {}) as Record<string, unknown>
    for (const dir of DIRECTIONS) {
      const arr = dirMap[dir]
      if (Array.isArray(arr)) {
        const rects = arr.map(parseRect).filter((r): r is SpriteRect => r !== null)
        if (rects.length > 0) base.animations[action][dir] = rects
      }
    }
  }

  const settings = (raw.settings ?? {}) as Record<string, unknown>
  for (const action of ACTIONS) {
    const s = (settings[action] ?? {}) as Record<string, unknown>
    base.settings[action] = {
      fps: num(s.fps, DEFAULT_FPS[action]),
      loop: typeof s.loop === 'boolean' ? s.loop : base.settings[action].loop
    }
  }

  const hitbox = (raw.hitbox ?? {}) as Record<string, unknown>
  base.hitbox = { width: num(hitbox.width, 32), height: num(hitbox.height, 32) }
  base.walkSpeed = num(raw.walkSpeed, 120)
  base.runSpeed = num(raw.runSpeed, 220)
  base.slideDistance = num(raw.slideDistance, 80)
  return base
}

// ===== Utilidades de edición de frames =====

export function getFrames(config: SpriteConfig, action: Action, direction: Direction): SpriteRect[] {
  return config.animations[action]?.[direction] ?? []
}

/** Devuelve una copia de la config con `rect` añadido como frame de action/direction. */
export function addFrame(config: SpriteConfig, action: Action, direction: Direction, rect: SpriteRect): SpriteConfig {
  const frames = [...getFrames(config, action, direction), rect]
  return withFrames(config, action, direction, frames)
}

export function removeFrame(config: SpriteConfig, action: Action, direction: Direction, index: number): SpriteConfig {
  const frames = getFrames(config, action, direction).filter((_, i) => i !== index)
  return withFrames(config, action, direction, frames)
}

export function duplicateFrame(config: SpriteConfig, action: Action, direction: Direction, index: number): SpriteConfig {
  const frames = getFrames(config, action, direction)
  if (index < 0 || index >= frames.length) return config
  const copy = [...frames]
  copy.splice(index + 1, 0, { ...frames[index] })
  return withFrames(config, action, direction, copy)
}

export function moveFrame(config: SpriteConfig, action: Action, direction: Direction, from: number, to: number): SpriteConfig {
  const frames = getFrames(config, action, direction)
  if (from < 0 || from >= frames.length || to < 0 || to >= frames.length) return config
  const copy = [...frames]
  const [item] = copy.splice(from, 1)
  copy.splice(to, 0, item)
  return withFrames(config, action, direction, copy)
}

function withFrames(config: SpriteConfig, action: Action, direction: Direction, frames: SpriteRect[]): SpriteConfig {
  return {
    ...config,
    animations: {
      ...config.animations,
      [action]: { ...config.animations[action], [direction]: frames }
    }
  }
}
