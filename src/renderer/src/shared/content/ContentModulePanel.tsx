import type { ReactNode } from 'react'
import type { ItemRarity } from '@shared-types/item'
import type { ContentApi, ContentColumn, ContentRecord } from './contentTypes'
import type { ContentStoreHook } from './createContentStore'
import { useContentActions, useContentAutoLoad } from './useContentModule'
import { ContentToolbar } from './ContentToolbar'
import { ContentGrid } from './ContentGrid'
import { ContentListView } from './ContentListView'
import { ContentTableView } from './ContentTableView'

export interface ContentModuleConfig<T extends ContentRecord> {
  labelPlural: string
  createLabel: string
  searchPlaceholder: string
  emptyText: string
  categoryOptions: readonly string[]
  rarityOptions: readonly ItemRarity[]
  tableColumns: ContentColumn<T>[]
  onExport?(): void
}

interface Props<T extends ContentRecord, TInput> {
  useStore: ContentStoreHook<T>
  api: ContentApi<T, TInput>
  createEmpty: () => TInput
  config: ContentModuleConfig<T>
  /** Inspector específico del módulo (ya cableado a su propio store). */
  inspector: ReactNode
}

/**
 * Panel completo de un módulo de contenido: barra de herramientas + vista
 * (rejilla/lista/tabla) + inspector. Todo el módulo se reduce a: su store, su
 * `window.api`, su `createEmpty`, su config y su inspector. Así se replican los
 * ~20 módulos restantes sin reescribir esta plomería.
 */
export function ContentModulePanel<T extends ContentRecord, TInput>({
  useStore,
  api,
  createEmpty,
  config,
  inspector
}: Props<T, TInput>): JSX.Element {
  useContentAutoLoad(useStore, api)
  const { createRecord, deleteRecords } = useContentActions(useStore, api, createEmpty)

  const items = useStore((s) => s.items)
  const total = useStore((s) => s.total)
  const loading = useStore((s) => s.loading)
  const query = useStore((s) => s.query)
  const setQuery = useStore((s) => s.setQuery)
  const viewMode = useStore((s) => s.viewMode)
  const setViewMode = useStore((s) => s.setViewMode)
  const selectedIds = useStore((s) => s.selectedIds)
  const select = useStore((s) => s.select)
  const clearSelection = useStore((s) => s.clearSelection)

  const handleSelect = (id: number, options: { additive: boolean; range: boolean }): void => {
    select(id, options)
  }

  const handleDeleteSelected = async (): Promise<void> => {
    if (selectedIds.length === 0) return
    await deleteRecords(selectedIds)
    clearSelection()
  }

  return (
    <div className="flex h-full flex-col bg-surface-1">
      <ContentToolbar
        query={query}
        setQuery={setQuery}
        total={total}
        labelPlural={config.labelPlural}
        createLabel={config.createLabel}
        searchPlaceholder={config.searchPlaceholder}
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedCount={selectedIds.length}
        categoryOptions={config.categoryOptions}
        rarityOptions={config.rarityOptions}
        onCreate={() => void createRecord()}
        onDeleteSelected={() => void handleDeleteSelected()}
        onExport={config.onExport}
      />
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          {viewMode === 'grid' && (
            <ContentGrid
              items={items}
              selectedIds={selectedIds}
              loading={loading}
              emptyText={config.emptyText}
              onSelect={handleSelect}
            />
          )}
          {viewMode === 'list' && (
            <ContentListView
              items={items}
              selectedIds={selectedIds}
              emptyText={config.emptyText}
              onSelect={handleSelect}
            />
          )}
          {viewMode === 'table' && (
            <ContentTableView
              items={items}
              selectedIds={selectedIds}
              emptyText={config.emptyText}
              columns={config.tableColumns}
              onSelect={handleSelect}
            />
          )}
        </div>
        <div className="w-72 shrink-0 border-l border-surface-border">{inspector}</div>
      </div>
    </div>
  )
}
