import { useState } from 'react'
import { IconThumbnail } from './IconThumbnail'
import { IconPickerModal } from './IconPickerModal'

interface Props {
  iconId: number | null
  onChange(iconId: number | null): void
}

/**
 * Campo de icono reutilizable para los inspectores (objetos, armas, armaduras,
 * monstruos…): miniatura + arrastrar-soltar desde la Biblioteca + botón para
 * elegir con un clic. Guarda solo la referencia (iconId), nunca la imagen.
 */
export function IconField({ iconId, onChange }: Props): JSX.Element {
  const [picking, setPicking] = useState(false)
  return (
    <>
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          const dropped = event.dataTransfer.getData('application/x-kgps-icon-id')
          if (dropped) onChange(Number(dropped))
        }}
        className="flex items-center gap-3 rounded-md border border-dashed border-surface-border bg-surface-2 p-3"
      >
        <IconThumbnail iconId={iconId} size={48} />
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-white hover:brightness-110"
          >
            {iconId ? 'Cambiar icono' : 'Elegir icono'}
          </button>
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
            setPicking(false)
          }}
        />
      )}
    </>
  )
}
