import { useEffect, useState } from 'react'
import type { IconRegion } from '@shared-types/item'

interface Props {
  iconId: number | null
  region: IconRegion | null
  size?: number
}

/**
 * Muestra un icono que puede ser un RECORTE (región) de una imagen mayor
 * (sprite sheet). Si `region` es null, muestra la imagen completa. Usa el tamaño
 * natural de la imagen (del registro del icono) para recortar por CSS.
 */
export function CroppedIcon({ iconId, region, size = 48 }: Props): JSX.Element {
  const [info, setInfo] = useState<{ path: string; w: number; h: number } | null>(null)

  useEffect(() => {
    if (iconId === null) {
      setInfo(null)
      return
    }
    let cancelled = false
    window.api.icons.get(iconId).then((icon) => {
      if (cancelled || !icon) return setInfo(null)
      setInfo({ path: icon.relativePath, w: icon.width || 0, h: icon.height || 0 })
    })
    return () => {
      cancelled = true
    }
  }, [iconId])

  if (!info) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex shrink-0 items-center justify-center rounded bg-surface-1 text-[8px] text-slate-600"
      >
        —
      </div>
    )
  }

  if (!region) {
    return (
      <img
        src={`kgps-icon://${info.path}`}
        alt=""
        style={{ width: size, height: size }}
        className="shrink-0 rounded object-contain"
        draggable={false}
      />
    )
  }

  // Recorte por CSS: escalar toda la hoja para que la región quepa en size×size.
  const scale = size / Math.max(region.width, region.height)
  return (
    <div
      className="shrink-0 rounded bg-surface-1"
      style={{
        width: region.width * scale,
        height: region.height * scale,
        backgroundImage: `url(kgps-icon://${info.path})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${info.w * scale}px ${info.h * scale}px`,
        backgroundPosition: `-${region.x * scale}px -${region.y * scale}px`,
        imageRendering: 'pixelated'
      }}
    />
  )
}
