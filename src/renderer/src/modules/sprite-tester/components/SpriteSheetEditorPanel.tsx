import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Upload, Save, Download, FileUp, RotateCcw, Play, Grid3x3, Plus, Trash2, Copy,
  ChevronLeft, ChevronRight, FilePlus, AlertTriangle, Gamepad2, PenLine, Move
} from 'lucide-react'
import {
  createEmptyConfig,
  serializeConfig,
  parseConfig,
  snapToGrid,
  addFrame,
  removeFrame,
  duplicateFrame,
  moveFrame,
  getFrames,
  validateSpriteConfig,
  ACTIONS,
  DIRECTIONS,
  ACTION_LABELS,
  DIRECTION_LABELS,
  type SpriteConfig,
  type SpriteRect,
  type Action,
  type Direction
} from '../content/spriteConfig'
import { TestArena } from './TestArena'

const GRID_SIZES = [16, 24, 32, 48, 64, 96, 128]

type Tab = 'editor' | 'test'
type Tool = 'select' | 'pan'

export function SpriteSheetEditorPanel(): JSX.Element {
  const [tab, setTab] = useState<Tab>('editor')
  const [config, setConfig] = useState<SpriteConfig>(() => createEmptyConfig())
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null)
  const [imageName, setImageName] = useState<string>('')

  const [tool, setTool] = useState<Tool>('select')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 20, y: 20 })
  const [showGrid, setShowGrid] = useState(true)
  const [snap, setSnap] = useState(true)
  const [selection, setSelection] = useState<SpriteRect | null>(null)

  const [action, setAction] = useState<Action>('idle')
  const [direction, setDirection] = useState<Direction>('down')

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<{ mode: 'select' | 'pan'; startImg: { x: number; y: number }; startPan: { x: number; y: number } } | null>(null)

  const imageDims = imageEl ? { width: imageEl.naturalWidth, height: imageEl.naturalHeight } : undefined
  const warnings = useMemo(() => validateSpriteConfig(config, imageDims), [config, imageDims])
  const frames = getFrames(config, action, direction)

  // ---- Cargar imagen ----
  const loadImageFile = (file: File): void => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        setImageEl(img)
        setImageName(file.name)
        setConfig((c) => ({ ...c, image: file.name, frameSize: c.frameSize }))
        setPan({ x: 20, y: 20 })
        setZoom(1)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  // ---- Dibujo del lienzo del sprite sheet ----
  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = wrap.clientWidth
    canvas.height = wrap.clientHeight
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#0b0d12'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)
    if (imageEl) {
      ctx.drawImage(imageEl, 0, 0)
      if (showGrid && config.gridSize > 0) {
        ctx.strokeStyle = 'rgba(148,163,184,0.25)'
        ctx.lineWidth = 1 / zoom
        for (let x = 0; x <= imageEl.naturalWidth; x += config.gridSize) {
          ctx.beginPath()
          ctx.moveTo(x, 0)
          ctx.lineTo(x, imageEl.naturalHeight)
          ctx.stroke()
        }
        for (let y = 0; y <= imageEl.naturalHeight; y += config.gridSize) {
          ctx.beginPath()
          ctx.moveTo(0, y)
          ctx.lineTo(imageEl.naturalWidth, y)
          ctx.stroke()
        }
      }
      // Frames ya asignados (dirección/acción actual) en verde tenue
      ctx.strokeStyle = 'rgba(34,197,94,0.9)'
      ctx.lineWidth = 2 / zoom
      for (const f of frames) ctx.strokeRect(f.x, f.y, f.width, f.height)
      // Selección actual en acento
      if (selection) {
        ctx.strokeStyle = '#38bdf8'
        ctx.lineWidth = 2 / zoom
        ctx.strokeRect(selection.x, selection.y, selection.width, selection.height)
        ctx.fillStyle = 'rgba(56,189,248,0.15)'
        ctx.fillRect(selection.x, selection.y, selection.width, selection.height)
      }
    }
    ctx.restore()
  }, [imageEl, zoom, pan, showGrid, config.gridSize, selection, frames])

  const toImageCoords = (clientX: number, clientY: number): { x: number; y: number } => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return { x: (clientX - rect.left - pan.x) / zoom, y: (clientY - rect.top - pan.y) / zoom }
  }

  const onMouseDown = (e: React.MouseEvent): void => {
    if (!imageEl) return
    const img = toImageCoords(e.clientX, e.clientY)
    if (tool === 'pan') {
      dragRef.current = { mode: 'pan', startImg: { x: e.clientX, y: e.clientY }, startPan: { ...pan } }
    } else {
      dragRef.current = { mode: 'select', startImg: img, startPan: { ...pan } }
      setSelection({ x: img.x, y: img.y, width: 0, height: 0 })
    }
  }
  const onMouseMove = (e: React.MouseEvent): void => {
    const drag = dragRef.current
    if (!drag) return
    if (drag.mode === 'pan') {
      setPan({ x: drag.startPan.x + (e.clientX - drag.startImg.x), y: drag.startPan.y + (e.clientY - drag.startImg.y) })
    } else {
      const img = toImageCoords(e.clientX, e.clientY)
      const x = Math.min(drag.startImg.x, img.x)
      const y = Math.min(drag.startImg.y, img.y)
      const width = Math.abs(img.x - drag.startImg.x)
      const height = Math.abs(img.y - drag.startImg.y)
      setSelection({ x, y, width, height })
    }
  }
  const onMouseUp = (): void => {
    const drag = dragRef.current
    dragRef.current = null
    if (drag?.mode === 'select' && selection && (selection.width < 2 || selection.height < 2)) {
      setSelection(null)
    } else if (drag?.mode === 'select' && selection && snap) {
      setSelection(snapToGrid(selection, config.gridSize))
    }
  }
  const onWheel = (e: React.WheelEvent): void => {
    if (!imageEl) return
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
    setZoom((z) => Math.min(16, Math.max(0.1, z * factor)))
  }

  const roundedSelection = (): SpriteRect | null => {
    if (!selection) return null
    return {
      x: Math.round(selection.x),
      y: Math.round(selection.y),
      width: Math.round(selection.width),
      height: Math.round(selection.height)
    }
  }

  const assignFrame = (): void => {
    const rect = roundedSelection()
    if (!rect || rect.width < 1 || rect.height < 1) return
    setConfig((c) => addFrame(c, action, direction, rect))
  }

  const useSelectionAsFrameSize = (): void => {
    const rect = roundedSelection()
    if (!rect) return
    setConfig((c) => ({ ...c, frameSize: { width: rect.width, height: rect.height } }))
  }

  // ---- Guardado / carga JSON ----
  const exportJson = (): void => {
    const blob = new Blob([serializeConfig(config)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(imageName || 'sprite').replace(/\.[^.]+$/, '')}.spritesheet.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  const importJson = (file: File): void => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        setConfig(parseConfig(reader.result as string))
      } catch (err) {
        window.alert(`JSON inválido: ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    reader.readAsText(file)
  }

  const setActionSetting = (key: 'fps' | 'loop', value: number | boolean): void => {
    setConfig((c) => ({ ...c, settings: { ...c.settings, [action]: { ...c.settings[action], [key]: value } } }))
  }

  return (
    <div className="flex h-full w-full flex-col bg-surface-0">
      {/* Barra superior */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-surface-border bg-surface-1 px-3 py-2">
        <FileButton icon={<Upload size={13} />} label="Importar sprite sheet" accept="image/png,image/*" onFile={loadImageFile} />
        <ToolbarButton icon={<FilePlus size={13} />} label="Nueva" onClick={() => { setConfig(createEmptyConfig()); setSelection(null) }} />
        <FileButton icon={<FileUp size={13} />} label="Importar JSON" accept="application/json,.json" onFile={importJson} />
        <ToolbarButton icon={<Download size={13} />} label="Exportar JSON" onClick={exportJson} />
        <ToolbarButton icon={<Save size={13} />} label="Guardar" onClick={exportJson} />
        <ToolbarButton icon={<RotateCcw size={13} />} label="Restablecer" onClick={() => { setConfig(createEmptyConfig()); setImageEl(null); setImageName('') }} />
        <div className="mx-1 h-5 w-px bg-surface-border" />
        <div className="ml-auto flex items-center gap-1 rounded-md border border-surface-border p-0.5">
          <TabBtn active={tab === 'editor'} onClick={() => setTab('editor')} icon={<PenLine size={13} />} label="Editor" />
          <TabBtn active={tab === 'test'} onClick={() => setTab('test')} icon={<Gamepad2 size={13} />} label="Probar en mapa" />
        </div>
      </div>

      {tab === 'test' ? (
        <TestArena config={config} imageEl={imageEl} />
      ) : (
        <div className="flex min-h-0 flex-1">
          {/* Lienzo del sprite sheet (izquierda) */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-1.5 border-b border-surface-border bg-surface-1 px-3 py-1.5 text-xs">
              <button type="button" onClick={() => setTool('select')} className={`flex items-center gap-1 rounded px-2 py-1 ${tool === 'select' ? 'bg-accent-muted text-accent' : 'text-slate-300 hover:bg-surface-2'}`}>
                <PenLine size={12} /> Seleccionar
              </button>
              <button type="button" onClick={() => setTool('pan')} className={`flex items-center gap-1 rounded px-2 py-1 ${tool === 'pan' ? 'bg-accent-muted text-accent' : 'text-slate-300 hover:bg-surface-2'}`}>
                <Move size={12} /> Mover
              </button>
              <div className="mx-1 h-4 w-px bg-surface-border" />
              <button type="button" onClick={() => setZoom((z) => Math.max(0.1, z / 1.25))} className="rounded px-2 py-1 text-slate-300 hover:bg-surface-2">−</button>
              <span className="w-12 text-center tabular-nums text-slate-400">{Math.round(zoom * 100)}%</span>
              <button type="button" onClick={() => setZoom((z) => Math.min(16, z * 1.25))} className="rounded px-2 py-1 text-slate-300 hover:bg-surface-2">+</button>
              <div className="mx-1 h-4 w-px bg-surface-border" />
              <button type="button" onClick={() => setShowGrid((g) => !g)} className={`flex items-center gap-1 rounded px-2 py-1 ${showGrid ? 'bg-accent-muted text-accent' : 'text-slate-300 hover:bg-surface-2'}`}>
                <Grid3x3 size={12} /> Cuadrícula
              </button>
              <label className="flex items-center gap-1 text-slate-300">
                <select value={config.gridSize} onChange={(e) => setConfig((c) => ({ ...c, gridSize: Number(e.target.value) }))} className="rounded border border-surface-border bg-surface-2 px-1.5 py-1 text-xs">
                  {GRID_SIZES.map((s) => <option key={s} value={s}>{s}×{s}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-1 text-slate-300">
                <input type="checkbox" checked={snap} onChange={(e) => setSnap(e.target.checked)} /> Ajustar
              </label>
              {imageEl && <span className="ml-auto text-[11px] text-slate-500">{imageName} · {imageEl.naturalWidth}×{imageEl.naturalHeight}</span>}
            </div>

            <div ref={wrapRef} className="relative min-h-0 flex-1 overflow-hidden">
              <canvas
                ref={canvasRef}
                className={`absolute inset-0 ${tool === 'pan' ? 'cursor-grab' : 'cursor-crosshair'}`}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onWheel={onWheel}
              />
              {!imageEl && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center text-sm text-slate-500">
                  Importa una imagen PNG para empezar (botón «Importar sprite sheet»).
                </div>
              )}
            </div>

            {/* Coordenadas de la selección */}
            <div className="flex items-center gap-3 border-t border-surface-border bg-surface-1 px-3 py-1.5 text-[11px] text-slate-400">
              {selection ? (
                <>
                  <span>x <b className="text-slate-200">{Math.round(selection.x)}</b></span>
                  <span>y <b className="text-slate-200">{Math.round(selection.y)}</b></span>
                  <span>ancho <b className="text-slate-200">{Math.round(selection.width)}</b></span>
                  <span>alto <b className="text-slate-200">{Math.round(selection.height)}</b></span>
                  <button type="button" onClick={useSelectionAsFrameSize} className="ml-2 rounded border border-surface-border px-2 py-0.5 text-slate-300 hover:bg-surface-2">
                    Usar como tamaño de frame
                  </button>
                </>
              ) : (
                <span>Dibuja un rectángulo sobre un sprite para ver x/y/ancho/alto.</span>
              )}
            </div>
          </div>

          {/* Panel de asignaciones (derecha) */}
          <div className="flex w-80 shrink-0 flex-col border-l border-surface-border bg-surface-1">
            <div className="border-b border-surface-border px-3 py-2">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Asignar a</div>
              <div className="grid grid-cols-2 gap-1.5">
                <label className="text-[11px] text-slate-400">
                  Acción
                  <select value={action} onChange={(e) => setAction(e.target.value as Action)} className="mt-0.5 w-full rounded border border-surface-border bg-surface-2 px-1.5 py-1 text-xs text-slate-200">
                    {ACTIONS.map((a) => <option key={a} value={a}>{ACTION_LABELS[a]}</option>)}
                  </select>
                </label>
                <label className="text-[11px] text-slate-400">
                  Dirección
                  <select value={direction} onChange={(e) => setDirection(e.target.value as Direction)} className="mt-0.5 w-full rounded border border-surface-border bg-surface-2 px-1.5 py-1 text-xs text-slate-200">
                    {DIRECTIONS.map((d) => <option key={d} value={d}>{DIRECTION_LABELS[d]}</option>)}
                  </select>
                </label>
              </div>
              <button type="button" onClick={assignFrame} disabled={!selection} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40">
                <Plus size={13} /> Asignar frame ({ACTION_LABELS[action]} · {DIRECTION_LABELS[direction]})
              </button>
            </div>

            {/* Ajustes de animación */}
            <div className="border-b border-surface-border px-3 py-2 text-[11px] text-slate-400">
              <div className="mb-1 font-semibold uppercase tracking-wide text-slate-500">Animación · {ACTION_LABELS[action]}</div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1">
                  FPS
                  <input type="number" min={1} max={60} value={config.settings[action].fps} onChange={(e) => setActionSetting('fps', Math.max(1, Number(e.target.value) || 1))} className="w-16 rounded border border-surface-border bg-surface-2 px-1.5 py-1 text-xs text-slate-200" />
                </label>
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={config.settings[action].loop} onChange={(e) => setActionSetting('loop', e.target.checked)} /> Bucle
                </label>
              </div>
            </div>

            {/* Línea de tiempo / frames + vista previa */}
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Frames ({frames.length})</span>
                <AnimatedPreview imageEl={imageEl} frames={frames} fps={config.settings[action].fps} loop={config.settings[action].loop} />
              </div>
              {frames.length === 0 ? (
                <div className="rounded border border-dashed border-surface-border px-3 py-6 text-center text-[11px] text-slate-500">
                  Sin frames para {ACTION_LABELS[action]} · {DIRECTION_LABELS[direction]}.
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {frames.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 rounded border border-surface-border bg-surface-2/40 p-1.5">
                      <span className="w-5 text-center text-[10px] text-slate-500">{i + 1}</span>
                      <FrameThumb imageEl={imageEl} rect={f} size={40} />
                      <span className="min-w-0 flex-1 truncate text-[10px] text-slate-400">{f.x},{f.y} · {f.width}×{f.height}</span>
                      <IconBtn title="Subir" disabled={i === 0} onClick={() => setConfig((c) => moveFrame(c, action, direction, i, i - 1))}><ChevronLeft size={12} className="rotate-90" /></IconBtn>
                      <IconBtn title="Bajar" disabled={i === frames.length - 1} onClick={() => setConfig((c) => moveFrame(c, action, direction, i, i + 1))}><ChevronRight size={12} className="rotate-90" /></IconBtn>
                      <IconBtn title="Duplicar" onClick={() => setConfig((c) => duplicateFrame(c, action, direction, i))}><Copy size={12} /></IconBtn>
                      <IconBtn title="Eliminar" danger onClick={() => setConfig((c) => removeFrame(c, action, direction, i))}><Trash2 size={12} /></IconBtn>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Avisos de validación */}
            <div className="max-h-40 overflow-y-auto border-t border-surface-border px-3 py-2">
              <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <AlertTriangle size={12} className={warnings.length ? 'text-amber-400' : 'text-green-400'} /> Avisos ({warnings.length})
              </div>
              {warnings.length === 0 ? (
                <div className="text-[11px] text-green-400">Todo correcto para probar.</div>
              ) : (
                <ul className="flex flex-col gap-0.5 text-[10px] text-amber-300">
                  {warnings.slice(0, 20).map((w, i) => <li key={i}>• {w.message}</li>)}
                </ul>
              )}
              <button type="button" onClick={() => setTab('test')} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-accent bg-accent-muted px-3 py-1.5 text-xs text-accent hover:brightness-110">
                <Play size={13} /> Probar en mapa (WASD)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ===== Subcomponentes =====

function ToolbarButton({ icon, label, onClick }: { icon: JSX.Element; label: string; onClick(): void }): JSX.Element {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-1 rounded-md border border-surface-border px-2 py-1.5 text-xs text-slate-300 hover:bg-surface-2">
      {icon} {label}
    </button>
  )
}

function FileButton({ icon, label, accept, onFile }: { icon: JSX.Element; label: string; accept: string; onFile(f: File): void }): JSX.Element {
  const ref = useRef<HTMLInputElement | null>(null)
  return (
    <>
      <button type="button" onClick={() => ref.current?.click()} className="flex items-center gap-1 rounded-md border border-surface-border px-2 py-1.5 text-xs text-slate-300 hover:bg-surface-2">
        {icon} {label}
      </button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
          e.target.value = ''
        }}
      />
    </>
  )
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick(): void; icon: JSX.Element; label: string }): JSX.Element {
  return (
    <button type="button" onClick={onClick} className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs ${active ? 'bg-accent text-white' : 'text-slate-300 hover:bg-surface-2'}`}>
      {icon} {label}
    </button>
  )
}

function IconBtn({ children, title, onClick, disabled, danger }: { children: JSX.Element; title: string; onClick(): void; disabled?: boolean; danger?: boolean }): JSX.Element {
  return (
    <button type="button" title={title} disabled={disabled} onClick={onClick} className={`rounded p-1 ${danger ? 'text-slate-500 hover:bg-surface-2 hover:text-red-400' : 'text-slate-500 hover:bg-surface-2 hover:text-slate-200'} disabled:opacity-30`}>
      {children}
    </button>
  )
}

function FrameThumb({ imageEl, rect, size }: { imageEl: HTMLImageElement | null; rect: SpriteRect; size: number }): JSX.Element {
  const ref = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, size, size)
    if (imageEl && rect.width > 0 && rect.height > 0) {
      const scale = Math.min(size / rect.width, size / rect.height)
      const w = rect.width * scale
      const h = rect.height * scale
      ctx.drawImage(imageEl, rect.x, rect.y, rect.width, rect.height, (size - w) / 2, (size - h) / 2, w, h)
    }
  }, [imageEl, rect.x, rect.y, rect.width, rect.height, size])
  return <canvas ref={ref} width={size} height={size} className="shrink-0 rounded bg-black/40" />
}

function AnimatedPreview({ imageEl, frames, fps, loop }: { imageEl: HTMLImageElement | null; frames: SpriteRect[]; fps: number; loop: boolean }): JSX.Element {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const size = 48
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false
    let raf = 0
    const start = performance.now()
    const draw = (): void => {
      ctx.clearRect(0, 0, size, size)
      if (imageEl && frames.length > 0) {
        const elapsed = performance.now() - start
        let idx = Math.floor((elapsed / 1000) * fps)
        idx = loop ? idx % frames.length : Math.min(idx, frames.length - 1)
        const r = frames[idx]
        const scale = Math.min(size / r.width, size / r.height)
        const w = r.width * scale
        const h = r.height * scale
        ctx.drawImage(imageEl, r.x, r.y, r.width, r.height, (size - w) / 2, (size - h) / 2, w, h)
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [imageEl, frames, fps, loop])
  return <canvas ref={ref} width={size} height={size} className="ml-auto rounded bg-black/40 ring-1 ring-surface-border" title="Vista previa animada" />
}
