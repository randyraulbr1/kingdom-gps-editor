import { useEffect, useState } from 'react'
import { Crown, FolderPlus, FolderOpen, Clock } from 'lucide-react'
import type { RecentProjectEntry } from '@shared-types/project'
import { useProjectStore } from '@renderer/shared/store/projectStore'

export function WelcomeScreen(): JSX.Element {
  const [recent, setRecent] = useState<RecentProjectEntry[]>([])
  const [newName, setNewName] = useState('MiProyectoKGPS')
  const setCurrent = useProjectStore((s) => s.setCurrent)

  useEffect(() => {
    window.api.project.listRecent().then(setRecent)
  }, [])

  const handleCreate = async (): Promise<void> => {
    const parentDir = await window.api.dialog.pickFolder()
    if (!parentDir) return
    const info = await window.api.project.create(parentDir, newName)
    setCurrent(info)
  }

  const handleOpenExisting = async (): Promise<void> => {
    const folder = await window.api.dialog.pickFolder()
    if (!folder) return
    const info = await window.api.project.open(folder)
    setCurrent(info)
  }

  const handleOpenRecent = async (path: string): Promise<void> => {
    const info = await window.api.project.open(path)
    setCurrent(info)
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-surface-0 text-slate-200">
      <div className="w-full max-w-2xl rounded-lg border border-surface-border bg-surface-1 p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <Crown size={28} className="text-accent" />
          <div>
            <h1 className="text-xl font-semibold">Kingdom GPS — Editor</h1>
            <p className="text-sm text-slate-500">Herramienta de desarrollo del contenido del juego</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-md border border-surface-border p-4">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-medium">
              <FolderPlus size={16} /> Nuevo proyecto
            </h2>
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              className="mb-2 w-full rounded-md border border-surface-border bg-surface-2 px-2 py-1.5 text-sm outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={handleCreate}
              className="w-full rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover"
            >
              Elegir carpeta y crear
            </button>
          </div>

          <div className="rounded-md border border-surface-border p-4">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-medium">
              <FolderOpen size={16} /> Abrir proyecto
            </h2>
            <p className="mb-2 text-xs text-slate-500">Selecciona la carpeta de un proyecto existente.</p>
            <button
              type="button"
              onClick={handleOpenExisting}
              className="w-full rounded-md border border-surface-border px-3 py-1.5 text-sm hover:bg-surface-2"
            >
              Examinar...
            </button>
          </div>
        </div>

        {recent.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-400">
              <Clock size={14} /> Recientes
            </h2>
            <ul className="divide-y divide-surface-border rounded-md border border-surface-border">
              {recent.map((entry) => (
                <li key={entry.path}>
                  <button
                    type="button"
                    onClick={() => handleOpenRecent(entry.path)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-surface-2"
                  >
                    <span>{entry.name}</span>
                    <span className="truncate pl-4 text-xs text-slate-500">{entry.path}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
