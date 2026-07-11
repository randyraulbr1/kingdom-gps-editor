import { Folder } from 'lucide-react'
import { useIconLibraryStore } from '../store/iconLibraryStore'

export function FolderTree(): JSX.Element {
  const categories = useIconLibraryStore((s) => s.categories)
  const query = useIconLibraryStore((s) => s.query)
  const setQuery = useIconLibraryStore((s) => s.setQuery)

  return (
    <div className="flex h-full flex-col gap-0.5 overflow-y-auto p-2">
      <span className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Categorías</span>
      <button
        type="button"
        onClick={() => setQuery({ category: undefined })}
        className={`flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm ${
          !query.category ? 'bg-accent-muted text-accent' : 'text-slate-300 hover:bg-surface-2'
        }`}
      >
        <Folder size={14} /> Todas
      </button>
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => setQuery({ category })}
          className={`flex items-center gap-2 truncate rounded px-2 py-1.5 text-left text-sm ${
            query.category === category ? 'bg-accent-muted text-accent' : 'text-slate-300 hover:bg-surface-2'
          }`}
        >
          <Folder size={14} className="shrink-0" /> <span className="truncate">{category}</span>
        </button>
      ))}
    </div>
  )
}
