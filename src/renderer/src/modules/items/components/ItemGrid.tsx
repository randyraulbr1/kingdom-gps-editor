import { useEffect, useRef, useState } from 'react'
import { FixedSizeGrid } from 'react-window'
import { useItemsStore } from '../store/itemsStore'
import { RarityBadge, rarityBorderClass } from '@renderer/shared/components/RarityBadge'
import { IconThumbnail } from '@renderer/shared/components/IconThumbnail'

const CELL_SIZE = 112

export function ItemGrid(): JSX.Element {
  const items = useItemsStore((s) => s.items)
  const selectedIds = useItemsStore((s) => s.selectedIds)
  const select = useItemsStore((s) => s.select)
  const loading = useItemsStore((s) => s.loading)
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
        Sin objetos. Usa "Nuevo objeto" para crear el primero.
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
            const item = items[index]
            if (!item) return <div style={style} />
            const isSelected = selectedIds.includes(item.id)
            return (
              <div style={style} className="p-1">
                <button
                  type="button"
                  onClick={(event) =>
                    select(item.id, { additive: event.ctrlKey || event.metaKey, range: event.shiftKey })
                  }
                  title={`${item.name} (#${item.id})`}
                  className={`flex h-full w-full flex-col items-center justify-center gap-1 rounded-md border-2 bg-surface-2 p-1.5 transition-colors ${
                    isSelected
                      ? 'border-accent bg-accent-muted'
                      : `${rarityBorderClass(item.rarity)}/30 hover:bg-surface-3`
                  }`}
                >
                  <IconThumbnail iconId={item.iconId} size={40} />
                  <span className="w-full truncate px-1 text-center text-[10px] text-slate-300">{item.name}</span>
                  <span className="text-[9px] text-slate-600">#{item.id}</span>
                  <RarityBadge rarity={item.rarity} />
                </button>
              </div>
            )
          }}
        </FixedSizeGrid>
      )}
    </div>
  )
}
