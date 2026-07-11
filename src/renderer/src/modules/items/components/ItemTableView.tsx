import { useItemsStore } from '../store/itemsStore'
import { RarityBadge } from '@renderer/shared/components/RarityBadge'
import { IconThumbnail } from '@renderer/shared/components/IconThumbnail'

export function ItemTableView(): JSX.Element {
  const items = useItemsStore((s) => s.items)
  const selectedIds = useItemsStore((s) => s.selectedIds)
  const select = useItemsStore((s) => s.select)

  if (items.length === 0) {
    return <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">Sin objetos.</div>
  }

  return (
    <div className="h-full w-full overflow-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="sticky top-0 bg-surface-1 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2 font-medium">Icono</th>
            <th className="px-3 py-2 font-medium">ID</th>
            <th className="px-3 py-2 font-medium">Nombre</th>
            <th className="px-3 py-2 font-medium">Categoría</th>
            <th className="px-3 py-2 font-medium">Rareza</th>
            <th className="px-3 py-2 font-medium">Valor</th>
            <th className="px-3 py-2 font-medium">Peso</th>
            <th className="px-3 py-2 font-medium">Nivel</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const isSelected = selectedIds.includes(item.id)
            return (
              <tr
                key={item.id}
                onClick={(event) =>
                  select(item.id, { additive: event.ctrlKey || event.metaKey, range: event.shiftKey })
                }
                className={`cursor-pointer border-b border-surface-border/50 ${
                  isSelected ? 'bg-accent-muted text-accent' : 'text-slate-300 hover:bg-surface-2'
                }`}
              >
                <td className="px-3 py-1.5">
                  <IconThumbnail iconId={item.iconId} size={20} />
                </td>
                <td className="px-3 py-1.5 text-xs text-slate-500">#{item.id}</td>
                <td className="px-3 py-1.5">{item.name}</td>
                <td className="px-3 py-1.5 text-xs">{item.category}</td>
                <td className="px-3 py-1.5">
                  <RarityBadge rarity={item.rarity} />
                </td>
                <td className="px-3 py-1.5 text-xs">{item.value}</td>
                <td className="px-3 py-1.5 text-xs">{item.weight}</td>
                <td className="px-3 py-1.5 text-xs">{item.requiredLevel}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
