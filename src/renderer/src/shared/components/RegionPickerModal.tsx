import { useEffect, useRef, useState } from 'react'
import { X, Grid3x3, Crop, ZoomIn, ZoomOut } from 'lucide-react'
import type { IconRegion } from '@shared-types/item'

interface Props {
  iconId: number
  current: IconRegion | null
  onClose(): void
  onPick(region: IconRegion | null): void
}

interface Sel {
  x: number
  y: number
  w: number
  h: number
}

/**
 * Selecciona una PARTE (recorte) de una imagen como icono: arrastra un
 * rectángulo sobre la imagen, o usa la cuadrícula para elegir una celda. Guarda
 * la región en píxeles reales de la imagen.
 */
export function RegionPickerModal({ iconId, current, onClose, onPick }: Props): JSX.Element {
  const [info, setInfo] = useState<{ path: string; w: number; h: number } | null>(null)
  const [sel, setSel] = useState<Sel | null>(current ? { x: current.x, y: current.y, w: current.width, h: current.height } : null)
  const [grid, setGrid] = useState(false)
  const [cell, setCell] = useState('32')
  const [zoom, setZoom] = useState(1)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const dragging = useRef<{ startX: number; startY: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    window.api.icons.get(iconId).then((icon) => {
      if (cancelled || !icon) return
      setInfo({ path: icon.relativePath, w: icon.width || 0, h: icon.height || 0 })
    })
    return () => {
      cancelled = true
    }
  }, [iconId])

  // Convierte coords del ratón (en la imagen mostrada) a píxeles reales.
  const toReal = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const el = imgRef.current
    if (!el || !info) return null
    const rect = el.getBoundingClientRect()
    const sx = info.w / rect.width
    const sy = info.h / rect.height
    const x = Math.max(0, Math.min(info.w, (clientX - rect.left) * sx))
    const y = Math.max(0, Math.min(info.h, (clientY - rect.top) * sy))
    return { x, y }
  }

  const onDown = (e: React.MouseEvent): void => {
    if (grid) return
    const p = toReal(e.clientX, e.clientY)
    if (!p) return
    dragging.current = { startX: p.x, startY: p.y }
    setSel({ x: p.x, y: p.y, w: 0, h: 0 })
  }
  const onMove = (e: React.MouseEvent): void => {
    if (!dragging.current) return
    const p = toReal(e.clientX, e.clientY)
    if (!p) return
    const { startX, startY } = dragging.current
    setSel({
      x: Math.round(Math.min(startX, p.x)),
      y: Math.round(Math.min(startY, p.y)),
      w: Math.round(Math.abs(p.x - startX)),
      h: Math.round(Math.abs(p.y - startY))
    })
  }
  const onUp = (): void => {
    dragging.current = null
  }

  const onGridClick = (e: React.MouseEvent): void => {
    if (!grid || !info) return
    const p = toReal(e.clientX, e.clientY)
    if (!p) return
    const c = Math.max(1, Number(cell.replace(/[^0-9]/g, '')) || 1)
    const col = Math.floor(p.x / c)
    const row = Math.floor(p.y / c)
    setSel({ x: col * c, y: row * c, w: c, h: c })
  }

  const confirm = (): void => {
    if (sel && sel.w > 0 && sel.h > 0) onPick({ x: sel.x, y: sel.y, width: sel.w, height: sel.h })
    else onPick(null)
  }

  // Escala base para caber + zoom del usuario (para recortes precisos).
  const baseScale = info ? Math.min(1, 520 / info.w) : 1
  const scale = baseScale * zoom

  return (
    <div className="fixed inset-0 z-[1600] flex items-center justify-center bg-black/60 p-6" onClick={onClose}>
      <div
        className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-surface-border bg-surface-1 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-surface-border px-4 py-3">
          <Crop size={16} className="text-accent" />
          <h2 className="text-sm font-medium text-slate-100">Seleccionar parte de la imagen</h2>
          <button
            type="button"
            onClick={() => setGrid((g) => !g)}
            className={`ml-2 flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${
              grid ? 'border-accent bg-accent-muted text-accent' : 'border-surface-border text-slate-300 hover:bg-surface-2'
            }`}
          >
            <Grid3x3 size={12} /> Cuadrícula
          </button>
          {grid && (
            <input
              type="text"
              inputMode="numeric"
              value={cell}
              onChange={(e) => setCell(e.target.value.replace(/[^0-9]/g, ''))}
              title="Tamaño de celda (px)"
              className="w-14 rounded border border-surface-border bg-surface-2 px-1.5 py-1 text-xs text-slate-100 focus:outline-none"
            />
          )}
          <div className="ml-2 flex items-center gap-1 rounded-md border border-surface-border px-1">
            <button type="button" onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.25).toFixed(2)))} title="Alejar" className="p-1 text-slate-300 hover:text-accent">
              <ZoomOut size={13} />
            </button>
            <span className="w-9 text-center text-[11px] text-slate-400">{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => setZoom((z) => Math.min(8, +(z + 0.25).toFixed(2)))} title="Acercar" className="p-1 text-slate-300 hover:text-accent">
              <ZoomIn size={13} />
            </button>
          </div>
          <button type="button" onClick={onClose} className="ml-auto rounded p-1 text-slate-400 hover:bg-surface-2" aria-label="Cerrar">
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-[#0b0d12] p-4">
          {!info ? (
            <p className="p-4 text-center text-xs text-slate-500">Cargando imagen…</p>
          ) : (
            <div
              className="relative mx-auto select-none"
              style={{ width: info.w * scale, height: info.h * scale }}
              onMouseDown={onDown}
              onMouseMove={onMove}
              onMouseUp={onUp}
              onMouseLeave={onUp}
              onClick={onGridClick}
            >
              <img
                ref={imgRef}
                src={`kgps-icon://${info.path}`}
                alt=""
                draggable={false}
                style={{ width: info.w * scale, height: info.h * scale, imageRendering: 'pixelated' }}
              />
              {sel && sel.w > 0 && sel.h > 0 && (
                <div
                  className="pointer-events-none absolute border-2 border-accent bg-accent/20"
                  style={{ left: sel.x * scale, top: sel.y * scale, width: sel.w * scale, height: sel.h * scale }}
                />
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-surface-border px-4 py-3 text-xs">
          <span className="text-slate-500">
            {sel && sel.w > 0 ? `Región: ${sel.x},${sel.y} · ${sel.w}×${sel.h}px` : 'Arrastra un rectángulo o usa la cuadrícula.'}
          </span>
          <button
            type="button"
            onClick={() => onPick(null)}
            className="ml-auto rounded-md border border-surface-border px-3 py-1.5 text-slate-300 hover:bg-surface-2"
          >
            Usar imagen entera
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={!sel || sel.w <= 0}
            className="rounded-md bg-accent px-3 py-1.5 font-medium text-white hover:brightness-110 disabled:opacity-50"
          >
            Usar recorte
          </button>
        </div>
      </div>
    </div>
  )
}
