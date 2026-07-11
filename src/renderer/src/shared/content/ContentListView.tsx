import { useEffect, useRef, useState } from 'react'
import { FixedSizeList } from 'react-window'
import { RarityBadge } from '@renderer/shared/components/RarityBadge'
import { IconThumbnail } from '@renderer/shared/components/IconThumbnail'
import type { ContentRecord } from './contentTypes'

interface Props<T extends ContentRecord> {
  items: T[]
  selectedIds: number[]
  emptyText: string
  onSelect(id: number, options: { additive: boolean; range: boolean }): void
}

/** Vista de lista virtualizada, genérica para cualquier módulo de contenido. */
export function ContentListView<T extends ContentRecord>({
  items,
  selectedIds,
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

  if (items.length === 0) {
    return (
      <div ref={containerRef} className="flex h-full w-full items-center justify-center text-sm text-slate-500">
        {emptyText}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="h-full w-full">
      {size.height > 0 && (
        <FixedSizeList itemCount={items.length} itemSize={40} width={size.width} height={size.height}>
          {({ index, style }) => {
            const record = items[index]
            const isSelected = selectedIds.includes(record.id)
            return (
              <div
                style={style}
                onClick={(event) =>
                  onSelect(record.id, { additive: event.ctrlKey || event.metaKey, range: event.shiftKey })
                }
                className={`flex cursor-pointer items-center gap-3 border-b border-surface-border/50 px-3 text-sm ${
                  isSelected ? 'bg-accent-muted text-accent' : 'text-slate-300 hover:bg-surface-2'
                }`}
              >
                <IconThumbnail iconId={record.iconId} size={24} />
                <span className="w-14 shrink-0 text-xs text-slate-500">#{record.id}</span>
                <span className="flex-1 truncate">{record.name}</span>
                <span className="w-28 shrink-0 truncate text-xs text-slate-500">{record.category}</span>
                <RarityBadge rarity={record.rarity} />
              </div>
            )
          }}
        </FixedSizeList>
      )}
    </div>
  )
}
