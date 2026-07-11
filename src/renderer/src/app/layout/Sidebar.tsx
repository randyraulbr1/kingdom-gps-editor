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
  onOpenModule
}: {
  title: string
  modules: RendererModuleDefinition[]
  activeModuleId: ModuleId | null
  onOpenModule(id: ModuleId): void
}): JSX.Element {
  return (
    <div className="mb-3">
      <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</div>
      {modules.map((module) => {
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

export function Sidebar({ activeModuleId, onOpenModule }: SidebarProps): JSX.Element {
  return (
    <div className="flex h-full w-56 shrink-0 flex-col overflow-y-auto border-r border-surface-border bg-surface-0 py-2">
      <SidebarSection
        title="Contenido"
        modules={getContentModules()}
        activeModuleId={activeModuleId}
        onOpenModule={onOpenModule}
      />
      <SidebarSection
        title="Herramientas"
        modules={getToolsModules()}
        activeModuleId={activeModuleId}
        onOpenModule={onOpenModule}
      />
      <SidebarSection
        title="Sistema"
        modules={getSystemModules()}
        activeModuleId={activeModuleId}
        onOpenModule={onOpenModule}
      />
    </div>
  )
}
