import { useEffect, useRef, useState } from 'react'
import { FixedSizeGrid } from 'react-window'
import { Star } from 'lucide-react'
import { useIconLibraryStore } from '../store/iconLibraryStore'

const CELL_SIZE = 96

interface IconGridProps {
  onSelect(id: number): void
}

export function IconGrid({ onSelect }: IconGridProps): JSX.Element {
  const items = useIconLibraryStore((s) => s.items)
  const selectedIconId = useIconLibraryStore((s) => s.selectedIconId)
  const loading = useIconLibraryStore((s) => s.loading)
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (items.length === 0 && !loading) {
    return (
      <div ref={containerRef} className="flex h-full w-full items-center justify-center text-sm text-slate-500">
        Sin iconos. Usa "Importar carpeta" para empezar la biblioteca.
      </div>
    )
  }

  const columnCount = Math.max(1, Math.floor(size.width / CELL_SIZE))
  const rowCount = Math.ceil(items.length / columnCount)

  return (
    <div ref={containerRef} className="h-full w-full">
      {size.width > 0 && (
        <FixedSizeGrid
          columnCount={columnCount}
          columnWidth={CELL_SIZE}
          rowCount={rowCount}
          rowHeight={CELL_SIZE}
          width={size.width}
          height={size.height}
        >
          {({ columnIndex, rowIndex, style }) => {
            const index = rowIndex * columnCount + columnIndex
            const icon = items[index]
            if (!icon) return <div style={style} />
            const isSelected = icon.id === selectedIconId
            return (
              <div style={style} className="p-1">
                <button
                  type="button"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData('application/x-kgps-icon-id', String(icon.id))
                    event.dataTransfer.setData('text/plain', icon.relativePath)
                  }}
                  onClick={() => onSelect(icon.id)}
                  title={`${icon.fileName} (#${icon.id})`}
                  className={`group relative flex h-full w-full flex-col items-center justify-center gap-1 rounded-md border p-1 transition-colors ${
                    isSelected
                      ? 'border-accent bg-accent-muted'
                      : 'border-transparent hover:border-surface-border hover:bg-surface-2'
                  }`}
                >
                  {icon.favorite && (
                    <Star size={12} className="absolute right-1 top-1 fill-rarity-legendary text-rarity-legendary" />
                  )}
                  {icon.duplicateOfId && (
                    <span className="absolute left-1 top-1 rounded-sm bg-rarity-epic/80 px-1 text-[8px] font-semibold text-white">
                      DUP
                    </span>
                  )}
                  <img
                    src={`kgps-icon://${icon.relativePath}`}
                    alt={icon.fileName}
                    className="h-12 w-12 object-contain"
                    draggable={false}
                  />
                  <span className="w-full truncate px-1 text-center text-[10px] text-slate-400">{icon.fileName}</span>
                </button>
              </div>
            )
          }}
        </FixedSizeGrid>
      )}
    </div>
  )
}
