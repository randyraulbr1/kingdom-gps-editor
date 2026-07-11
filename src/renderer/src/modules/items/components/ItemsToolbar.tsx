import { Search, Plus, Trash2, LayoutGrid, List, Table2, Download } from 'lucide-react'
import { useItemsStore } from '../store/itemsStore'
import { useItems } from '../hooks/useItems'
import { ITEM_CATEGORIES, ITEM_RARITIES, type ItemCategory, type ItemRarity } from '@shared-types/item'

export function ItemsToolbar(): JSX.Element {
  const query = useItemsStore((s) => s.query)
  const setQuery = useItemsStore((s) => s.setQuery)
  const total = useItemsStore((s) => s.total)
  const viewMode = useItemsStore((s) => s.viewMode)
  const setViewMode = useItemsStore((s) => s.setViewMode)
  const selectedIds = useItemsStore((s) => s.selectedIds)
  const clearSelection = useItemsStore((s) => s.clearSelection)
  const { createItem, deleteItems } = useItems()

  const handleDeleteSelected = async (): Promise<void> => {
    if (selectedIds.length === 0) return
    await deleteItems(selectedIds)
    clearSelection()
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-surface-border bg-surface-1 px-3 py-2">
      <div className="relative max-w-xs flex-1">
        <Search size={14} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={query.search ?? ''}
          onChange={(event) => setQuery({ search: event.target.value || undefined })}
          placeholder="Buscar objetos..."
          className="w-full rounded-md border border-surface-border bg-surface-2 py-1.5 pl-7 pr-2 text-sm text-slate-200 outline-none focus:border-accent"
        />
      </div>

      <select
        value={query.category ?? ''}
        onChange={(event) => setQuery({ category: (event.target.value || undefined) as ItemCategory | undefined })}
        className="rounded-md border border-surface-border bg-surface-2 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-accent"
      >
        <option value="">Todas las categorías</option>
        {ITEM_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>

      <select
        value={query.rarity ?? ''}
        onChange={(event) => setQuery({ rarity: (event.target.value || undefined) as ItemRarity | undefined })}
        className="rounded-md border border-surface-border bg-surface-2 px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-accent"
      >
        <option value="">Toda rareza</option>
        {ITEM_RARITIES.map((rarity) => (
          <option key={rarity} value={rarity}>
            {rarity}
          </option>
        ))}
      </select>

      <div className="flex items-center rounded-md border border-surface-border">
        <button
          type="button"
          onClick={() => setViewMode('grid')}
          title="Vista de casillas"
          className={`p-1.5 ${viewMode === 'grid' ? 'bg-accent-muted text-accent' : 'text-slate-400 hover:bg-surface-2'}`}
        >
          <LayoutGrid size={14} />
        </button>
        <button
          type="button"
          onClick={() => setViewMode('list')}
          title="Vista de lista"
          className={`border-l border-surface-border p-1.5 ${viewMode === 'list' ? 'bg-accent-muted text-accent' : 'text-slate-400 hover:bg-surface-2'}`}
        >
          <List size={14} />
        </button>
        <button
          type="button"
          onClick={() => setViewMode('table')}
          title="Vista de tabla"
          className={`border-l border-surface-border p-1.5 ${viewMode === 'table' ? 'bg-accent-muted text-accent' : 'text-slate-400 hover:bg-surface-2'}`}
        >
          <Table2 size={14} />
        </button>
      </div>

      {selectedIds.length > 0 && (
        <button
          type="button"
          onClick={handleDeleteSelected}
          className="flex items-center gap-1 rounded-md border border-red-500/40 px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
        >
          <Trash2 size={12} /> Eliminar ({selectedIds.length})
        </button>
      )}

      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-slate-500">{total} objetos</span>
        <button
          type="button"
          onClick={() => window.api.export.items()}
          className="flex items-center gap-1 rounded-md border border-surface-border px-2 py-1.5 text-xs text-slate-300 hover:bg-surface-2"
        >
          <Download size={12} /> Exportar
        </button>
        <button
          type="button"
          onClick={() => createItem()}
          className="flex items-center gap-1 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover"
        >
          <Plus size={14} /> Nuevo objeto
        </button>
      </div>
    </div>
  )
}
