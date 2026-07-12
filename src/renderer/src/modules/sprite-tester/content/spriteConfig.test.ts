import { describe, it, expect } from 'vitest'
import {
  createEmptyConfig,
  directionFromKeys,
  resolveDirection,
  actionFromInput,
  snapToGrid,
  frameIndexAt,
  getFrameFor,
  moveWithCollision,
  validateSpriteConfig,
  serializeConfig,
  parseConfig,
  addFrame,
  removeFrame,
  duplicateFrame,
  moveFrame,
  getFrames,
  DIRECTIONS,
  type SpriteConfig,
  type SpriteRect
} from './spriteConfig'

const noKeys = { up: false, down: false, left: false, right: false }

describe('dirección por WASD', () => {
  it('teclas simples', () => {
    expect(directionFromKeys({ ...noKeys, up: true })).toBe('up')
    expect(directionFromKeys({ ...noKeys, down: true })).toBe('down')
    expect(directionFromKeys({ ...noKeys, left: true })).toBe('left')
    expect(directionFromKeys({ ...noKeys, right: true })).toBe('right')
  })

  it('diagonales (W+D, W+A, S+D, S+A)', () => {
    expect(directionFromKeys({ ...noKeys, up: true, right: true })).toBe('up_right')
    expect(directionFromKeys({ ...noKeys, up: true, left: true })).toBe('up_left')
    expect(directionFromKeys({ ...noKeys, down: true, right: true })).toBe('down_right')
    expect(directionFromKeys({ ...noKeys, down: true, left: true })).toBe('down_left')
  })

  it('teclas opuestas se cancelan; sin teclas es null', () => {
    expect(directionFromKeys({ up: true, down: true, left: false, right: false })).toBeNull()
    expect(directionFromKeys(noKeys)).toBeNull()
  })

  it('mantiene la última dirección al soltar las teclas', () => {
    expect(resolveDirection(noKeys, 'right')).toBe('right')
    expect(resolveDirection({ ...noKeys, up: true }, 'right')).toBe('up')
  })
})

describe('acción por entrada', () => {
  const base = { moving: false, shift: false, ctrl: false, space: false, shooting: false, reloading: false, dead: false }
  it('sin teclas → idle, moviéndose → walk, shift → run', () => {
    expect(actionFromInput(base)).toBe('idle')
    expect(actionFromInput({ ...base, moving: true })).toBe('walk')
    expect(actionFromInput({ ...base, moving: true, shift: true })).toBe('run')
  })
  it('ctrl → crouch / crouch_walk', () => {
    expect(actionFromInput({ ...base, ctrl: true })).toBe('crouch')
    expect(actionFromInput({ ...base, ctrl: true, moving: true })).toBe('crouch_walk')
  })
  it('prioridad: muerto > recarga > disparo > deslizar > agachado', () => {
    expect(actionFromInput({ ...base, space: true })).toBe('slide')
    expect(actionFromInput({ ...base, shooting: true, moving: true })).toBe('shoot')
    expect(actionFromInput({ ...base, reloading: true, shooting: true })).toBe('reload')
    expect(actionFromInput({ ...base, dead: true, moving: true, shift: true })).toBe('dead')
  })
})

describe('cuadrícula', () => {
  it('ajusta un rectángulo a la celda', () => {
    expect(snapToGrid({ x: 10, y: 70, width: 60, height: 30 }, 32)).toEqual({ x: 0, y: 64, width: 64, height: 32 })
  })
})

describe('animación por FPS', () => {
  it('cicla en bucle', () => {
    expect(frameIndexAt(0, 8, 4, true)).toBe(0)
    expect(frameIndexAt(125, 8, 4, true)).toBe(1) // 1/8 s
    expect(frameIndexAt(500, 8, 4, true)).toBe(0) // 4/8 s → vuelta completa
  })
  it('sin bucle se queda en el último', () => {
    expect(frameIndexAt(10000, 8, 4, false)).toBe(3)
  })
})

function configWithIdleWalk(): SpriteConfig {
  let cfg = createEmptyConfig(64, 64)
  const rect = (x: number): SpriteRect => ({ x, y: 0, width: 64, height: 64 })
  for (const d of DIRECTIONS) {
    cfg = addFrame(cfg, 'idle', d, rect(0))
    cfg = addFrame(cfg, 'walk', d, rect(64))
    cfg = addFrame(cfg, 'walk', d, rect(128))
  }
  return cfg
}

describe('selección de frame para dibujar', () => {
  it('devuelve el frame de la acción/dirección pedida', () => {
    const cfg = configWithIdleWalk()
    const f = getFrameFor(cfg, 'walk', 'right', 0)
    expect(f).toEqual({ x: 64, y: 0, width: 64, height: 64 })
  })
  it('cae a idle si la acción no tiene frames en esa dirección', () => {
    const cfg = configWithIdleWalk()
    const f = getFrameFor(cfg, 'run', 'right', 0) // run vacío → idle right
    expect(f).toEqual({ x: 0, y: 0, width: 64, height: 64 })
  })
})

describe('colisiones AABB', () => {
  const wall = { x: 100, y: 0, width: 50, height: 200 }
  it('no atraviesa una pared por la derecha', () => {
    const box = { x: 60, y: 50, width: 32, height: 32 }
    const res = moveWithCollision(box, 50, 0, [wall])
    expect(res.x).toBe(wall.x - box.width) // 68, pegado a la pared
  })
  it('permite moverse libremente sin paredes cerca', () => {
    const box = { x: 0, y: 0, width: 32, height: 32 }
    expect(moveWithCollision(box, 10, 5, [wall])).toEqual({ x: 10, y: 5 })
  })
  it('desliza en Y aunque choque en X', () => {
    const box = { x: 60, y: 50, width: 32, height: 32 }
    const res = moveWithCollision(box, 50, 20, [wall])
    expect(res.x).toBe(68)
    expect(res.y).toBe(70)
  })
})

describe('validación', () => {
  it('config vacía avisa de idle faltante y direcciones faltantes', () => {
    const w = validateSpriteConfig(createEmptyConfig())
    expect(w.some((x) => x.code === 'missing_idle')).toBe(true)
    expect(w.some((x) => x.code === 'missing_direction')).toBe(true)
  })
  it('config con idle+walk en 8 direcciones no avisa de faltantes', () => {
    const w = validateSpriteConfig(configWithIdleWalk())
    expect(w.some((x) => x.code === 'missing_idle')).toBe(false)
    expect(w.some((x) => x.code === 'missing_direction')).toBe(false)
  })
  it('detecta región fuera de la imagen', () => {
    let cfg = createEmptyConfig(64, 64)
    cfg = addFrame(cfg, 'idle', 'down', { x: 500, y: 500, width: 64, height: 64 })
    const w = validateSpriteConfig(cfg, { width: 256, height: 256 })
    expect(w.some((x) => x.code === 'rect_out_of_bounds')).toBe(true)
  })
  it('detecta tamaño de frame inconsistente', () => {
    let cfg = createEmptyConfig(64, 64)
    cfg = addFrame(cfg, 'idle', 'down', { x: 0, y: 0, width: 48, height: 64 })
    const w = validateSpriteConfig(cfg)
    expect(w.some((x) => x.code === 'inconsistent_frame_size')).toBe(true)
  })
})

describe('JSON export/import', () => {
  it('round-trip conserva las animaciones asignadas', () => {
    const cfg = configWithIdleWalk()
    const parsed = parseConfig(serializeConfig(cfg))
    expect(getFrames(parsed, 'walk', 'right')).toEqual(getFrames(cfg, 'walk', 'right'))
    expect(parsed.frameSize).toEqual({ width: 64, height: 64 })
  })
  it('importa el formato del ejemplo de la especificación', () => {
    const json = JSON.stringify({
      image: 'soldado.png',
      frameSize: { width: 64, height: 64 },
      animations: {
        idle: { down: [{ x: 0, y: 0, width: 64, height: 64 }] },
        walk: { right: [{ x: 64, y: 0, width: 64, height: 64 }, { x: 128, y: 0, width: 64, height: 64 }] }
      }
    })
    const cfg = parseConfig(json)
    expect(cfg.image).toBe('soldado.png')
    expect(getFrames(cfg, 'walk', 'right')).toHaveLength(2)
    expect(getFrames(cfg, 'idle', 'down')).toHaveLength(1)
  })
})

describe('edición de frames', () => {
  it('añadir, duplicar, reordenar y eliminar', () => {
    let cfg = createEmptyConfig()
    cfg = addFrame(cfg, 'walk', 'right', { x: 0, y: 0, width: 64, height: 64 })
    cfg = addFrame(cfg, 'walk', 'right', { x: 64, y: 0, width: 64, height: 64 })
    expect(getFrames(cfg, 'walk', 'right')).toHaveLength(2)
    cfg = duplicateFrame(cfg, 'walk', 'right', 0)
    expect(getFrames(cfg, 'walk', 'right')).toHaveLength(3)
    cfg = moveFrame(cfg, 'walk', 'right', 0, 2)
    expect(getFrames(cfg, 'walk', 'right')[2].x).toBe(0)
    cfg = removeFrame(cfg, 'walk', 'right', 0)
    expect(getFrames(cfg, 'walk', 'right')).toHaveLength(2)
  })
})
