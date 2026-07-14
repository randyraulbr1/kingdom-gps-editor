import { useState } from 'react'
import { Crop } from 'lucide-react'
import type { IconRegion } from '@shared-types/item'
import { IconThumbnail } from './IconThumbnail'
import { CroppedIcon } from './CroppedIcon'
import { IconPickerModal } from './IconPickerModal'
import { RegionPickerModal } from './RegionPickerModal'

interface Props {
  iconId: number | null
  onChange(iconId: number | null): void
  /** Recorte del icono (si el tipo lo soporta, p. ej. Objetos). */
  iconRef?: IconRegion | null
  onChangeRef?(region: IconRegion | null): void
}

/**
 * Campo de icono reutilizable: miniatura + arrastrar-soltar + botón para elegir
 * de la Biblioteca. Si el tipo soporta recorte (onChangeRef), añade "Seleccionar
 * parte" para usar una región de la imagen (sprite sheet). Guarda referencias
 * (iconId + región), nunca la imagen.
 */
export function IconField({ iconId, onChange, iconRef, onChangeRef }: Props): JSX.Element {
  const [picking, setPicking] = useState(false)
  const [cropping, setCropping] = useState(false)
  const supportsCrop = typeof onChangeRef === 'function'

  return (
    <>
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          const dropped = event.dataTransfer.getData('application/x-kgps-icon-id')
          if (dropped) {
            onChange(Number(dropped))
            onChangeRef?.(null)
          }
        }}
        className="flex items-center gap-3 rounded-md border border-dashed border-surface-border bg-surface-2 p-3"
      >
        {supportsCrop && iconRef ? (
          <CroppedIcon iconId={iconId} region={iconRef} size={48} />
        ) : (
          <IconThumbnail iconId={iconId} size={48} />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setPicking(true)}
              className="rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-white hover:brightness-110"
            >
              {iconId ? 'Cambiar icono' : 'Elegir icono'}
            </button>
            {supportsCrop && iconId && (
              <button
                type="button"
                onClick={() => setCropping(true)}
                className="flex items-center gap-1 rounded-md border border-surface-border px-2.5 py-1 text-xs text-slate-200 hover:bg-surface-2"
              >
                <Crop size={12} /> {iconRef ? 'Cambiar recorte' : 'Seleccionar parte'}
              </button>
            )}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Elige desde la Biblioteca o arrástralo aquí. Se guarda la referencia, no la imagen.
          </div>
        </div>
      </div>

      {picking && (
        <IconPickerModal
          currentIconId={iconId}
          onClose={() => setPicking(false)}
          onPick={(picked) => {
            onChange(picked)
            onChangeRef?.(null)
            setPicking(false)
          }}
        />
      )}
      {cropping && iconId && (
        <RegionPickerModal
          iconId={iconId}
          current={iconRef ?? null}
          onClose={() => setCropping(false)}
          onPick={(region) => {
            onChangeRef?.(region)
            setCropping(false)
          }}
        />
      )}
    </>
  )
}
