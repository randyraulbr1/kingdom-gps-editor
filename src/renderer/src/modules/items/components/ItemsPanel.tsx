import { useItems } from '../hooks/useItems'
import { useItemsStore } from '../store/itemsStore'
import { ItemsToolbar } from './ItemsToolbar'
import { ItemGrid } from './ItemGrid'
import { ItemListView } from './ItemListView'
import { ItemTableView } from './ItemTableView'
import { ItemInspector } from './ItemInspector'

export function ItemsPanel(): JSX.Element {
  useItems()
  const viewMode = useItemsStore((s) => s.viewMode)

  return (
    <div className="flex h-full flex-col bg-surface-1">
      <ItemsToolbar />
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          {viewMode === 'grid' && <ItemGrid />}
          {viewMode === 'list' && <ItemListView />}
          {viewMode === 'table' && <ItemTableView />}
        </div>
        <div className="w-72 shrink-0 border-l border-surface-border">
          <ItemInspector />
        </div>
      </div>
    </div>
  )
}
