import { Search, Star, Copy, FolderInput, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useIconLibraryStore } from '../store/iconLibraryStore'
import { useIcons } from '../hooks/useIcons'

export function SearchFilterBar(): JSX.Element {
  const query = useIconLibraryStore((s) => s.query)
  const setQuery = useIconLibraryStore((s) => s.setQuery)
  const total = useIconLibraryStore((s) => s.total)
  const { importFolder } = useIcons()
  const [importing, setImporting] = useState(false)

  const handleImport = async (): Promise<void> => {
    setImporting(true)
    try {
      await importFolder()
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="flex items-center gap-2 border-b border-surface-border bg-surface-1 px-3 py-2">
      <div className="relative max-w-xs flex-1">
        <Search size={14} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={query.search ?? ''}
          onChange={(event) => setQuery({ search: event.target.value || undefined })}
          placeholder="Buscar iconos..."
          className="w-full rounded-md border border-surface-border bg-surface-2 py-1.5 pl-7 pr-2 text-sm text-slate-200 outline-none focus:border-accent"
        />
      </div>

      <button
        type="button"
        onClick={() => setQuery({ favoritesOnly: !query.favoritesOnly })}
        className={`flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs ${
          query.favoritesOnly
            ? 'border-accent bg-accent-muted text-accent'
            : 'border-surface-border text-slate-300 hover:bg-surface-2'
        }`}
      >
        <Star size={12} /> Favoritos
      </button>

      <button
        type="button"
        onClick={() => setQuery({ duplicatesOnly: !query.duplicatesOnly })}
        className={`flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs ${
          query.duplicatesOnly
            ? 'border-accent bg-accent-muted text-accent'
            : 'border-surface-border text-slate-300 hover:bg-surface-2'
        }`}
      >
        <Copy size={12} /> Duplicados
      </button>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-slate-500">{total} iconos</span>
        <button
          type="button"
          onClick={handleImport}
          disabled={importing}
          className="flex items-center gap-1 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {importing ? <Loader2 size={14} className="animate-spin" /> : <FolderInput size={14} />}
          Importar carpeta
        </button>
      </div>
    </div>
  )
}
