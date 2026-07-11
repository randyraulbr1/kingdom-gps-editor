import { useIcons } from '../hooks/useIcons'
import { useIconLibraryStore } from '../store/iconLibraryStore'
import { SearchFilterBar } from './SearchFilterBar'
import { FolderTree } from './FolderTree'
import { IconGrid } from './IconGrid'
import { IconPreviewPanel } from './IconPreviewPanel'

export function IconLibraryPanel(): JSX.Element {
  useIcons()
  const setSelected = useIconLibraryStore((s) => s.setSelected)

  return (
    <div className="flex h-full flex-col bg-surface-1">
      <SearchFilterBar />
      <div className="flex min-h-0 flex-1">
        <div className="w-48 shrink-0 border-r border-surface-border">
          <FolderTree />
        </div>
        <div className="min-w-0 flex-1">
          <IconGrid onSelect={setSelected} />
        </div>
        <div className="w-64 shrink-0 border-l border-surface-border">
          <IconPreviewPanel />
        </div>
      </div>
    </div>
  )
}
