import { useState } from 'react'
import { ChevronDown, ChevronRight, Package } from 'lucide-react'
import { getContentModules, getToolsModules, getSystemModules } from '@renderer/modules/registry'
import type { RendererModuleDefinition } from '@renderer/modules/defineModule'
import type { ModuleId } from '@shared-types/module'
import { resolveIcon } from './iconResolver'

interface SidebarProps {
  activeModuleId: ModuleId | null
  onOpenModule(id: ModuleId): void
}

/**
 * Módulos que en realidad son "objetos" del juego (armas, armaduras,
 * herramientas, recursos, comida, cultivos, construcciones). Van agrupados
 * dentro de la carpeta "Objetos" en vez de tener botón propio.
 */
const OBJETOS_IDS: ModuleId[] = [
  'items',
  'weapons',
  'armors',
  'tools_equipment',
  'resources',
  'food',
  'crops',
  'constructions'
]

function ModuleButton({
  module,
  activeModuleId,
  onOpenModule,
  indent = false
}: {
  module: RendererModuleDefinition
  activeModuleId: ModuleId | null
  onOpenModule(id: ModuleId): void
  indent?: boolean
}): JSX.Element {
  const Icon = resolveIcon(module.icon)
  const isActive = module.id === activeModuleId
  return (
    <button
      type="button"
      onClick={() => onOpenModule(module.id)}
      className={`flex w-full items-center gap-2.5 py-1.5 pr-3 text-left text-sm transition-colors ${
        indent ? 'pl-8' : 'pl-3'
      } ${isActive ? 'bg-accent-muted text-accent' : 'text-slate-300 hover:bg-surface-2'}`}
    >
      <Icon size={15} className="shrink-0" />
      <span className="truncate">{module.name}</span>
    </button>
  )
}

/** Carpeta plegable "Objetos" que agrupa armas/armaduras/etc. dentro. */
function ObjetosFolder({
  modules,
  activeModuleId,
  onOpenModule
}: {
  modules: RendererModuleDefinition[]
  activeModuleId: ModuleId | null
  onOpenModule(id: ModuleId): void
}): JSX.Element {
  const [open, setOpen] = useState(true)
  const hasActive = modules.some((m) => m.id === activeModuleId)
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${
          hasActive && !open ? 'text-accent' : 'text-slate-200'
        } hover:bg-surface-2`}
      >
        {open ? <ChevronDown size={13} className="shrink-0 text-slate-500" /> : <ChevronRight size={13} className="shrink-0 text-slate-500" />}
        <Package size={15} className="shrink-0" />
        <span className="truncate font-medium">Objetos</span>
        <span className="ml-auto text-[10px] font-normal text-slate-600">{modules.length}</span>
      </button>
      {open &&
        modules.map((module) => (
          <ModuleButton
            key={module.id}
            module={module}
            activeModuleId={activeModuleId}
            onOpenModule={onOpenModule}
            indent
          />
        ))}
    </div>
  )
}

function FlatSection({
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
      {modules.map((module) => (
        <ModuleButton key={module.id} module={module} activeModuleId={activeModuleId} onOpenModule={onOpenModule} />
      ))}
    </div>
  )
}

/**
 * Barra lateral. "Datos" agrupa el contenido del juego: primero la carpeta
 * plegable "Objetos" (armas, armaduras, herramientas, recursos, comida…), y
 * debajo el resto de sistemas con su propio botón (economía, recetas, NPC,
 * monstruos, loot, misiones, diálogos…). Luego Herramientas y, al fondo,
 * Configuración.
 */
export function Sidebar({ activeModuleId, onOpenModule }: SidebarProps): JSX.Element {
  const content = getContentModules()
  const objetos = content.filter((m) => OBJETOS_IDS.includes(m.id))
  const resto = content.filter((m) => !OBJETOS_IDS.includes(m.id))

  return (
    <div className="flex h-full w-56 shrink-0 flex-col overflow-y-auto border-r border-surface-border bg-surface-0 py-2">
      <div className="mb-3">
        <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Datos</div>
        {objetos.length > 0 && (
          <ObjetosFolder modules={objetos} activeModuleId={activeModuleId} onOpenModule={onOpenModule} />
        )}
        {resto.map((module) => (
          <ModuleButton key={module.id} module={module} activeModuleId={activeModuleId} onOpenModule={onOpenModule} />
        ))}
      </div>

      <FlatSection
        title="Herramientas"
        modules={getToolsModules()}
        activeModuleId={activeModuleId}
        onOpenModule={onOpenModule}
      />

      {/* Empuja Configuración al fondo de la barra. */}
      <div className="mt-auto border-t border-surface-border pt-2">
        <FlatSection
          title="Sistema"
          modules={getSystemModules()}
          activeModuleId={activeModuleId}
          onOpenModule={onOpenModule}
        />
      </div>
    </div>
  )
}
