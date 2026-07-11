import { useEffect, useRef, useState } from 'react'
import { FixedSizeList } from 'react-window'
import { useItemsStore } from '../store/itemsStore'
import { RarityBadge } from '@renderer/shared/components/RarityBadge'
import { IconThumbnail } from '@renderer/shared/components/IconThumbnail'

export function ItemListView(): JSX.Element {
  const items = useItemsStore((s) => s.items)
  const selectedIds = useItemsStore((s) => s.selectedIds)
  const select = useItemsStore((s) => s.select)
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
        Sin objetos.
      </div>
    )
  }

  return (
    <div ref={containerRef} className="h-full w-full">
      {size.height > 0 && (
        <FixedSizeList itemCount={items.length} itemSize={40} width={size.width} height={size.height}>
          {({ index, style }) => {
            const item = items[index]
            const isSelected = selectedIds.includes(item.id)
            return (
              <div
                style={style}
                onClick={(event) =>
                  select(item.id, { additive: event.ctrlKey || event.metaKey, range: event.shiftKey })
                }
                className={`flex cursor-pointer items-center gap-3 border-b border-surface-border/50 px-3 text-sm ${
                  isSelected ? 'bg-accent-muted text-accent' : 'text-slate-300 hover:bg-surface-2'
                }`}
              >
                <IconThumbnail iconId={item.iconId} size={24} />
                <span className="w-14 shrink-0 text-xs text-slate-500">#{item.id}</span>
                <span className="flex-1 truncate">{item.name}</span>
                <span className="w-28 shrink-0 truncate text-xs text-slate-500">{item.category}</span>
                <RarityBadge rarity={item.rarity} />
              </div>
            )
          }}
        </FixedSizeList>
      )}
    </div>
  )
}
