import { useEffect, useRef, useState } from 'react'
import {
  directionFromKeys,
  resolveDirection,
  actionFromInput,
  moveWithCollision,
  getFrameFor,
  DIRECTION_LABELS,
  ACTION_LABELS,
  type SpriteConfig,
  type Direction,
  type Action,
  type Box
} from '../content/spriteConfig'

interface Props {
  config: SpriteConfig
  imageEl: HTMLImageElement | null
}

/** Vectores unitarios (diagonales normalizadas) por dirección. */
const DIR_VECTORS: Record<Direction, { x: number; y: number }> = {
  down: { x: 0, y: 1 },
  up: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up_right: { x: 0.7071, y: -0.7071 },
  up_left: { x: -0.7071, y: -0.7071 },
  down_right: { x: 0.7071, y: 0.7071 },
  down_left: { x: -0.7071, y: 0.7071 }
}

// Mapa de prueba (coordenadas del mundo, px).
const WORLD = { width: 1600, height: 1200 }
const WALLS: Box[] = [
  { x: 0, y: 0, width: WORLD.width, height: 24 },
  { x: 0, y: WORLD.height - 24, width: WORLD.width, height: 24 },
  { x: 0, y: 0, width: 24, height: WORLD.height },
  { x: WORLD.width - 24, y: 0, width: 24, height: WORLD.height },
  { x: 400, y: 300, width: 240, height: 40 },
  { x: 900, y: 250, width: 40, height: 320 },
  { x: 300, y: 700, width: 360, height: 40 },
  { x: 1050, y: 750, width: 300, height: 40 },
  { x: 700, y: 500, width: 160, height: 160 }
]

export function TestArena({ config, imageEl }: Props): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  // Estado de entrada (en refs para no re-renderizar cada frame).
  const keys = useRef<Set<string>>(new Set())
  const mouseDown = useRef(false)
  const timers = useRef({ shootUntil: 0, reloadUntil: 0, slideUntil: 0 })
  const player = useRef({ x: WORLD.width / 2, y: WORLD.height / 2 })
  const lastDir = useRef<Direction>('down')
  const actionRef = useRef<Action>('idle')
  const actionStart = useRef<number>(performance.now())

  const [hud, setHud] = useState({ fps: 0, direction: 'down' as Direction, action: 'idle' as Action })
  const [speedScale, setSpeedScale] = useState(1)
  const speedScaleRef = useRef(1)
  useEffect(() => { speedScaleRef.current = speedScale }, [speedScale])

  // Teclado / ratón
  useEffect(() => {
    const down = (e: KeyboardEvent): void => {
      const k = e.key.toLowerCase()
      if (['w', 'a', 's', 'd', ' ', 'shift', 'control', 'r'].includes(k)) e.preventDefault()
      if (k === ' ') timers.current.slideUntil = performance.now() + 350
      if (k === 'r') timers.current.reloadUntil = performance.now() + reloadDuration()
      keys.current.add(k)
    }
    const up = (e: KeyboardEvent): void => { keys.current.delete(e.key.toLowerCase()) }
    const blur = (): void => keys.current.clear()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
    // reloadDuration lee config vía closure fresca en cada montaje; config cambia poco durante la prueba
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const reloadDuration = (): number => {
    const frames = config.animations.reload?.[lastDir.current]?.length ?? config.animations.reload?.down?.length ?? 0
    const fps = config.settings.reload.fps
    return frames > 0 ? (frames / fps) * 1000 : 800
  }

  // Bucle de render
  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let last = performance.now()
    let fpsAccum = 0
    let fpsFrames = 0
    let hudTimer = 0

    const loop = (now: number): void => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now

      // ---- Entrada ----
      const mk = {
        up: keys.current.has('w'),
        down: keys.current.has('s'),
        left: keys.current.has('a'),
        right: keys.current.has('d')
      }
      const dir = directionFromKeys(mk)
      const resolvedDir = resolveDirection(mk, lastDir.current)
      if (dir) lastDir.current = dir

      const shooting = mouseDown.current || now < timers.current.shootUntil
      const reloading = now < timers.current.reloadUntil
      const sliding = now < timers.current.slideUntil
      const input = {
        moving: dir !== null,
        shift: keys.current.has('shift'),
        ctrl: keys.current.has('control'),
        space: sliding,
        shooting,
        reloading,
        dead: false
      }
      const action = actionFromInput(input)
      if (action !== actionRef.current) {
        actionRef.current = action
        actionStart.current = now
      }

      // ---- Movimiento con colisiones ----
      let speed = 0
      if (action === 'run') speed = config.runSpeed
      else if (action === 'walk') speed = config.walkSpeed
      else if (action === 'crouch_walk') speed = config.walkSpeed * 0.6
      else if (action === 'slide') speed = config.runSpeed * 1.2
      speed *= speedScaleRef.current

      const vec = action === 'slide' ? DIR_VECTORS[lastDir.current] : dir ? DIR_VECTORS[dir] : { x: 0, y: 0 }
      const hb: Box = { x: player.current.x, y: player.current.y, width: config.hitbox.width, height: config.hitbox.height }
      const moved = moveWithCollision(hb, vec.x * speed * dt, vec.y * speed * dt, WALLS)
      player.current = { x: moved.x, y: moved.y }

      // ---- Cámara ----
      canvas.width = wrap.clientWidth
      canvas.height = wrap.clientHeight
      const camX = clamp(player.current.x + config.hitbox.width / 2 - canvas.width / 2, 0, Math.max(0, WORLD.width - canvas.width))
      const camY = clamp(player.current.y + config.hitbox.height / 2 - canvas.height / 2, 0, Math.max(0, WORLD.height - canvas.height))

      // ---- Dibujo ----
      ctx.imageSmoothingEnabled = false
      ctx.fillStyle = '#0e1117'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.translate(-camX, -camY)

      // Suelo con cuadrícula
      const cell = 48
      ctx.strokeStyle = 'rgba(148,163,184,0.12)'
      ctx.lineWidth = 1
      const x0 = Math.floor(camX / cell) * cell
      const y0 = Math.floor(camY / cell) * cell
      for (let x = x0; x < camX + canvas.width; x += cell) {
        ctx.beginPath(); ctx.moveTo(x, camY); ctx.lineTo(x, camY + canvas.height); ctx.stroke()
      }
      for (let y = y0; y < camY + canvas.height; y += cell) {
        ctx.beginPath(); ctx.moveTo(camX, y); ctx.lineTo(camX + canvas.width, y); ctx.stroke()
      }

      // Paredes
      ctx.fillStyle = '#334155'
      ctx.strokeStyle = '#475569'
      for (const w of WALLS) {
        ctx.fillRect(w.x, w.y, w.width, w.height)
        ctx.strokeRect(w.x, w.y, w.width, w.height)
      }

      // Personaje
      const elapsed = now - actionStart.current
      const frame = getFrameFor(config, actionRef.current, resolvedDir, elapsed)
      const drawW = config.frameSize.width
      const drawH = config.frameSize.height
      // Alinear el pie del sprite con el centro-inferior de la hitbox.
      const px = player.current.x + config.hitbox.width / 2 - drawW / 2
      const py = player.current.y + config.hitbox.height - drawH
      if (imageEl && frame) {
        ctx.drawImage(imageEl, frame.x, frame.y, frame.width, frame.height, px, py, drawW, drawH)
      } else {
        // Marcador de posición si no hay sprite asignado.
        ctx.fillStyle = '#38bdf8'
        ctx.fillRect(player.current.x, player.current.y, config.hitbox.width, config.hitbox.height)
      }
      // Hitbox (guía)
      ctx.strokeStyle = 'rgba(56,189,248,0.6)'
      ctx.lineWidth = 1
      ctx.strokeRect(player.current.x, player.current.y, config.hitbox.width, config.hitbox.height)

      ctx.restore()

      // ---- HUD (FPS + dirección + acción) ----
      fpsAccum += dt
      fpsFrames++
      hudTimer += dt
      if (hudTimer >= 0.25) {
        setHud({ fps: Math.round(fpsFrames / fpsAccum), direction: resolvedDir, action: actionRef.current })
        fpsAccum = 0
        fpsFrames = 0
        hudTimer = 0
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [config, imageEl])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-surface-border bg-surface-1 px-3 py-1.5 text-[11px] text-slate-300">
        <span className="rounded bg-surface-2 px-2 py-0.5">FPS <b className="tabular-nums text-slate-100">{hud.fps}</b></span>
        <span className="rounded bg-surface-2 px-2 py-0.5">Dirección <b className="text-slate-100">{DIRECTION_LABELS[hud.direction]}</b></span>
        <span className="rounded bg-surface-2 px-2 py-0.5">Acción <b className="text-slate-100">{ACTION_LABELS[hud.action]}</b></span>
        <label className="ml-auto flex items-center gap-1">
          Velocidad
          <input type="range" min={0.25} max={2} step={0.05} value={speedScale} onChange={(e) => setSpeedScale(Number(e.target.value))} />
          <span className="w-8 tabular-nums text-slate-400">{speedScale.toFixed(2)}x</span>
        </label>
      </div>
      <div ref={wrapRef} className="relative min-h-0 flex-1 overflow-hidden" onMouseDown={() => { mouseDown.current = true; timers.current.shootUntil = performance.now() + 250 }} onMouseUp={() => { mouseDown.current = false }} onMouseLeave={() => { mouseDown.current = false }}>
        <canvas ref={canvasRef} className="absolute inset-0" />
        <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-md bg-black/70 px-3 py-1 text-[11px] text-slate-300">
          WASD mover · Shift correr · Ctrl agachado · Espacio deslizar · Clic disparar · R recargar
        </div>
      </div>
    </div>
  )
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}
