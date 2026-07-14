import { useEffect, useRef, useState } from 'react'
import { FixedSizeGrid } from 'react-window'
import { RarityBadge, rarityBorderClass } from '@renderer/shared/components/RarityBadge'
import { CroppedIcon } from '@renderer/shared/components/CroppedIcon'
import type { ContentRecord } from './contentTypes'

const CELL_SIZE = 112

interface Props<T extends ContentRecord> {
  items: T[]
  selectedIds: number[]
  loading: boolean
  emptyText: string
  onSelect(id: number, options: { additive: boolean; range: boolean }): void
}

/** Vista de casillas estilo RPG Maker, virtualizada. Genérica para cualquier módulo de contenido. */
export function ContentGrid<T extends ContentRecord>({
  items,
  selectedIds,
  loading,
  emptyText,
  onSelect
}: Props<T>): JSX.Element {
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
        {emptyText}
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
            const record = items[index]
            if (!record) return <div style={style} />
            const isSelected = selectedIds.includes(record.id)
            return (
              <div style={style} className="p-1">
                <button
                  type="button"
                  onClick={(event) =>
                    onSelect(record.id, { additive: event.ctrlKey || event.metaKey, range: event.shiftKey })
                  }
                  title={`${record.name} (#${record.id})`}
                  className={`flex h-full w-full flex-col items-center justify-center gap-1 rounded-md border-2 bg-surface-2 p-1.5 transition-colors ${
                    isSelected
                      ? 'border-accent bg-accent-muted'
                      : `${rarityBorderClass(record.rarity)}/30 hover:bg-surface-3`
                  }`}
                >
                  <CroppedIcon iconId={record.iconId} region={record.iconRef ?? null} size={40} />
                  <span className="w-full truncate px-1 text-center text-[10px] text-slate-300">{record.name}</span>
                  <span className="text-[9px] text-slate-600">#{record.id}</span>
                  <RarityBadge rarity={record.rarity} />
                </button>
              </div>
            )
          }}
        </FixedSizeGrid>
      )}
    </div>
  )
}
