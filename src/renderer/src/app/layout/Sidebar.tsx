import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { getContentModules, getToolsModules, getSystemModules } from '@renderer/modules/registry'
import type { RendererModuleDefinition } from '@renderer/modules/defineModule'
import type { ModuleId } from '@shared-types/module'
import { resolveIcon } from './iconResolver'

interface SidebarProps {
  activeModuleId: ModuleId | null
  onOpenModule(id: ModuleId): void
}

function SidebarSection({
  title,
  modules,
  activeModuleId,
  onOpenModule,
  collapsible = false,
  defaultOpen = true
}: {
  title: string
  modules: RendererModuleDefinition[]
  activeModuleId: ModuleId | null
  onOpenModule(id: ModuleId): void
  collapsible?: boolean
  defaultOpen?: boolean
}): JSX.Element {
  const [open, setOpen] = useState(defaultOpen)
  const showItems = !collapsible || open

  return (
    <div className="mb-3">
      {collapsible ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-1 px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-300"
        >
          {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <span>{title}</span>
          <span className="ml-auto pr-1 text-[10px] font-normal text-slate-600">{modules.length}</span>
        </button>
      ) : (
        <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</div>
      )}
      {showItems &&
        modules.map((module) => {
          const Icon = resolveIcon(module.icon)
          const isActive = module.id === activeModuleId
          return (
            <button
              key={module.id}
              type="button"
              onClick={() => onOpenModule(module.id)}
              className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm transition-colors ${
                isActive ? 'bg-accent-muted text-accent' : 'text-slate-300 hover:bg-surface-2'
              }`}
            >
              <Icon size={15} className="shrink-0" />
              <span className="truncate">{module.name}</span>
            </button>
          )
        })}
    </div>
  )
}

/**
 * Barra lateral. "Contenido" es una carpeta plegable con todos los módulos de
 * contenido; debajo van las Herramientas (Editor del Mundo, Probar Juego, Sprite,
 * Biblioteca de Iconos) y, al final del todo, Configuración.
 */
export function Sidebar({ activeModuleId, onOpenModule }: SidebarProps): JSX.Element {
  return (
    <div className="flex h-full w-56 shrink-0 flex-col overflow-y-auto border-r border-surface-border bg-surface-0 py-2">
      <SidebarSection
        title="Contenido"
        modules={getContentModules()}
        activeModuleId={activeModuleId}
        onOpenModule={onOpenModule}
        collapsible
      />
      <SidebarSection
        title="Herramientas"
        modules={getToolsModules()}
        activeModuleId={activeModuleId}
        onOpenModule={onOpenModule}
      />
      {/* Empuja Configuración al fondo de la barra. */}
      <div className="mt-auto border-t border-surface-border pt-2">
        <SidebarSection
          title="Sistema"
          modules={getSystemModules()}
          activeModuleId={activeModuleId}
          onOpenModule={onOpenModule}
        />
      </div>
    </div>
  )
}
