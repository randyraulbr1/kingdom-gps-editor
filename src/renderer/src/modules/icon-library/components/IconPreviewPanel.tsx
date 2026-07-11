import { useEffect, useState } from 'react'
import { Star, StarOff, Copy, Maximize2 } from 'lucide-react'
import { useIconLibraryStore } from '../store/iconLibraryStore'
import { useIcons } from '../hooks/useIcons'
import type { IconSizeVariant } from '@shared-types/icon'

const VARIANTS: IconSizeVariant[] = [64, 128, 256]

export function IconPreviewPanel(): JSX.Element {
  const items = useIconLibraryStore((s) => s.items)
  const selectedIconId = useIconLibraryStore((s) => s.selectedIconId)
  const { toggleFavorite, setTagsFor } = useIcons()
  const icon = items.find((i) => i.id === selectedIconId)
  const [tagInput, setTagInput] = useState('')
  const [resizing, setResizing] = useState(false)

  useEffect(() => {
    setTagInput(icon?.tags.join(', ') ?? '')
  }, [icon?.id, icon?.tags])

  if (!icon) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-500">
        Selecciona un icono para ver los detalles
      </div>
    )
  }

  const handleResize = async (variant: IconSizeVariant): Promise<void> => {
    setResizing(true)
    try {
      await window.api.icons.resize({ iconId: icon.id, variants: [variant] })
    } finally {
      setResizing(false)
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <div className="flex items-center justify-center rounded-md border border-surface-border bg-surface-2 p-6">
        <img src={`kgps-icon://${icon.relativePath}`} alt={icon.fileName} className="h-32 w-32 object-contain" />
      </div>

      <div>
        <h3 className="truncate text-sm font-semibold text-slate-200">{icon.fileName}</h3>
        <p className="text-xs text-slate-500">
          {icon.width}x{icon.height} - {icon.format.toUpperCase()} - {icon.category}
        </p>
        {icon.duplicateOfId && (
          <p className="mt-1 flex items-center gap-1 text-xs text-rarity-epic">
            <Copy size={12} /> Duplicado del icono #{icon.duplicateOfId}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => toggleFavorite(icon.id)}
        className="flex items-center gap-2 rounded-md border border-surface-border px-3 py-1.5 text-sm text-slate-200 hover:bg-surface-2"
      >
        {icon.favorite ? (
          <Star size={14} className="fill-rarity-legendary text-rarity-legendary" />
        ) : (
          <StarOff size={14} />
        )}
        {icon.favorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
      </button>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">Etiquetas</label>
        <input
          value={tagInput}
          onChange={(event) => setTagInput(event.target.value)}
          onBlur={() =>
            setTagsFor(
              icon.id,
              tagInput
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean)
            )
          }
          placeholder="separadas por coma"
          className="w-full rounded-md border border-surface-border bg-surface-2 px-2 py-1.5 text-sm text-slate-200 outline-none focus:border-accent"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
          Generar variante
        </label>
        <div className="flex gap-1.5">
          {VARIANTS.map((variant) => (
            <button
              key={variant}
              type="button"
              disabled={resizing}
              onClick={() => handleResize(variant)}
              className="flex items-center gap-1 rounded-md border border-surface-border px-2 py-1 text-xs text-slate-300 hover:bg-surface-2 disabled:opacity-60"
            >
              <Maximize2 size={11} /> {variant}px
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
