import type { CSSProperties } from 'react'
import { Minus, Square, X, Crown } from 'lucide-react'
import { useProjectStore } from '@renderer/shared/store/projectStore'

const dragStyle = { WebkitAppRegion: 'drag' } as CSSProperties
const noDragStyle = { WebkitAppRegion: 'no-drag' } as CSSProperties

export function TitleBar(): JSX.Element {
  const project = useProjectStore((s) => s.current)

  return (
    <div
      style={dragStyle}
      className="flex h-9 shrink-0 select-none items-center justify-between border-b border-surface-border bg-surface-0 pl-3 text-sm text-slate-300"
    >
      <div className="flex items-center gap-2">
        <Crown size={14} className="text-accent" />
        <span className="font-semibold">Kingdom GPS — Editor</span>
        {project && <span className="text-slate-500">— {project.name}</span>}
      </div>
      <div style={noDragStyle} className="flex h-full">
        <button
          type="button"
          onClick={() => window.api.windowControls.minimize()}
          className="flex h-full w-11 items-center justify-center hover:bg-surface-2"
          aria-label="Minimizar"
        >
          <Minus size={14} />
        </button>
        <button
          type="button"
          onClick={() => window.api.windowControls.toggleMaximize()}
          className="flex h-full w-11 items-center justify-center hover:bg-surface-2"
          aria-label="Maximizar"
        >
          <Square size={11} />
        </button>
        <button
          type="button"
          onClick={() => window.api.windowControls.close()}
          className="flex h-full w-11 items-center justify-center hover:bg-red-600"
          aria-label="Cerrar"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
