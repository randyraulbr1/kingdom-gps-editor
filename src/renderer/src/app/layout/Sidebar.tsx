import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { getModule, getToolsModules, getSystemModules } from '@renderer/modules/registry'
import type { RendererModuleDefinition } from '@renderer/modules/defineModule'
import type { ModuleId } from '@shared-types/module'
import { resolveIcon } from './iconResolver'

interface SidebarProps {
  activeModuleId: ModuleId | null
  onOpenModule(id: ModuleId): void
}

/** Una carpeta del menú: etiqueta, icono y los módulos que agrupa. */
interface Group {
  label: string
  icon: string
  moduleIds: ModuleId[]
}

/**
 * Estructura del menú lateral (estilo RPG Maker). Los subtipos van DENTRO de
 * cada carpeta, no todos sueltos en la barra. Ver RECURSOS_ARQUITECTURA.md.
 */
const CONTENIDO: Group[] = [
  { label: 'Mundo', icon: 'Map', moduleIds: ['world-editor', 'maps', 'events'] },
  { label: 'Personajes', icon: 'Users', moduleIds: ['npcs', 'monsters', 'animals', 'pets'] },
  {
    label: 'Objetos',
    icon: 'Package',
    moduleIds: ['items', 'weapons', 'armors', 'tools_equipment', 'resources', 'food', 'crops', 'constructions', 'loot']
  },
  { label: 'Misiones', icon: 'ScrollText', moduleIds: ['quests', 'dialogues'] },
  { label: 'Fabricación', icon: 'Hammer', moduleIds: ['crafting', 'recipes', 'professions'] },
  { label: 'Economía', icon: 'Coins', moduleIds: ['economy'] }
]

const RECURSOS: Group[] = [{ label: 'Iconos', icon: 'Image', moduleIds: ['icon-library'] }, { label: 'Sprite Sheets', icon: 'Grid3x3', moduleIds: ['sprite-tester'] }]

/** Recursos aún sin módulo: se muestran deshabilitados como "próximamente". */
const RECURSOS_PROXIMAMENTE: { label: string; icon: string }[] = [
  { label: 'Animaciones', icon: 'Film' },
  { label: 'Sonidos', icon: 'Volume2' },
  { label: 'Música', icon: 'Music' },
  { label: 'Paquetes', icon: 'Boxes' }
]

function modulesOf(group: Group): RendererModuleDefinition[] {
  return group.moduleIds.map((id) => getModule(id)).filter((m): m is RendererModuleDefinition => Boolean(m))
}

function ModuleButton({
  module,
  activeModuleId,
  onOpenModule,
  indent
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

/** Carpeta plegable con módulos dentro. Si sólo tiene 1, es un botón directo. */
function GroupFolder({
  group,
  activeModuleId,
  onOpenModule
}: {
  group: Group
  activeModuleId: ModuleId | null
  onOpenModule(id: ModuleId): void
}): JSX.Element | null {
  const modules = modulesOf(group)
  const [open, setOpen] = useState(false)
  if (modules.length === 0) return null

  const FolderIcon = resolveIcon(group.icon)

  // Una sola pieza → botón directo con la etiqueta de la carpeta.
  if (modules.length === 1) {
    const m = modules[0]
    const isActive = m.id === activeModuleId
    return (
      <button
        type="button"
        onClick={() => onOpenModule(m.id)}
        className={`flex w-full items-center gap-2.5 py-1.5 pl-3 pr-3 text-left text-sm ${
          isActive ? 'bg-accent-muted text-accent' : 'text-slate-300 hover:bg-surface-2'
        }`}
      >
        <FolderIcon size={15} className="shrink-0" />
        <span className="truncate">{group.label}</span>
      </button>
    )
  }

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
        <FolderIcon size={15} className="shrink-0" />
        <span className="truncate font-medium">{group.label}</span>
        <span className="ml-auto text-[10px] font-normal text-slate-600">{modules.length}</span>
      </button>
      {open &&
        modules.map((module) => (
          <ModuleButton key={module.id} module={module} activeModuleId={activeModuleId} onOpenModule={onOpenModule} indent />
        ))}
    </div>
  )
}

function SectionTitle({ title }: { title: string }): JSX.Element {
  return <div className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</div>
}

/**
 * Barra lateral estilo RPG Maker: secciones Contenido y Recursos con carpetas
 * plegables (subtipos dentro), luego Herramientas y, al fondo, Configuración.
 */
export function Sidebar({ activeModuleId, onOpenModule }: SidebarProps): JSX.Element {
  return (
    <div className="flex h-full w-56 shrink-0 flex-col overflow-y-auto border-r border-surface-border bg-surface-0 py-2">
      <div className="mb-2">
        <SectionTitle title="Contenido" />
        {CONTENIDO.map((group) => (
          <GroupFolder key={group.label} group={group} activeModuleId={activeModuleId} onOpenModule={onOpenModule} />
        ))}
      </div>

      <div className="mb-2">
        <SectionTitle title="Recursos" />
        {RECURSOS.map((group) => (
          <GroupFolder key={group.label} group={group} activeModuleId={activeModuleId} onOpenModule={onOpenModule} />
        ))}
        {RECURSOS_PROXIMAMENTE.map((r) => {
          const Icon = resolveIcon(r.icon)
          return (
            <div key={r.label} className="flex w-full items-center gap-2.5 py-1.5 pl-3 pr-3 text-left text-sm text-slate-600" title="Próximamente">
              <Icon size={15} className="shrink-0" />
              <span className="truncate">{r.label}</span>
              <span className="ml-auto text-[9px] uppercase tracking-wide text-slate-700">pronto</span>
            </div>
          )
        })}
      </div>

      <div className="mb-2">
        <SectionTitle title="Herramientas" />
        {getToolsModules()
          .filter((m) => m.id !== 'icon-library' && m.id !== 'sprite-tester' && m.id !== 'world-editor')
          .map((module) => (
            <ModuleButton key={module.id} module={module} activeModuleId={activeModuleId} onOpenModule={onOpenModule} />
          ))}
      </div>

      {/* Empuja Configuración al fondo de la barra. */}
      <div className="mt-auto border-t border-surface-border pt-2">
        <SectionTitle title="Sistema" />
        {getSystemModules().map((module) => (
          <ModuleButton key={module.id} module={module} activeModuleId={activeModuleId} onOpenModule={onOpenModule} />
        ))}
      </div>
    </div>
  )
}
