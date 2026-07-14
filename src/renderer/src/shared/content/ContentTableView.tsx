import { RarityBadge } from '@renderer/shared/components/RarityBadge'
import { CroppedIcon } from '@renderer/shared/components/CroppedIcon'
import type { ContentRecord, ContentColumn } from './contentTypes'

interface Props<T extends ContentRecord> {
  items: T[]
  selectedIds: number[]
  emptyText: string
  /** Columnas específicas del módulo (además de icono/id/nombre/categoría/rareza). */
  columns: ContentColumn<T>[]
  onSelect(id: number, options: { additive: boolean; range: boolean }): void
}

/** Vista de tabla, genérica: columnas fijas (icono/id/nombre/categoría/rareza) + columnas extra por módulo. */
export function ContentTableView<T extends ContentRecord>({
  items,
  selectedIds,
  emptyText,
  columns,
  onSelect
}: Props<T>): JSX.Element {
  if (items.length === 0) {
    return <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">{emptyText}</div>
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
            {columns.map((column) => (
              <th key={column.header} className="px-3 py-2 font-medium">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((record) => {
            const isSelected = selectedIds.includes(record.id)
            return (
              <tr
                key={record.id}
                onClick={(event) =>
                  onSelect(record.id, { additive: event.ctrlKey || event.metaKey, range: event.shiftKey })
                }
                className={`cursor-pointer border-b border-surface-border/50 ${
                  isSelected ? 'bg-accent-muted text-accent' : 'text-slate-300 hover:bg-surface-2'
                }`}
              >
                <td className="px-3 py-1.5">
                  <CroppedIcon iconId={record.iconId} region={record.iconRef ?? null} size={20} />
                </td>
                <td className="px-3 py-1.5 text-xs text-slate-500">#{record.id}</td>
                <td className="px-3 py-1.5">{record.name}</td>
                <td className="px-3 py-1.5 text-xs">{record.category}</td>
                <td className="px-3 py-1.5">
                  <RarityBadge rarity={record.rarity} />
                </td>
                {columns.map((column) => (
                  <td key={column.header} className="px-3 py-1.5 text-xs">
                    {column.render(record)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
