import type { ComponentType } from 'react'
import type { ModuleDefinitionMeta } from '@shared-types/module'

/**
 * Renderer-side half of a module plugin: adds the panel component to the
 * shared meta (id/name/icon/group/capabilities/shortcuts). The Sidebar and
 * DockLayout only ever talk to this shape - adding a module means adding one
 * folder with a module.ts, never touching Sidebar.tsx or App.tsx by hand.
 */
export interface RendererModuleDefinition extends ModuleDefinitionMeta {
  panel: ComponentType
}

export function defineModule(definition: RendererModuleDefinition): RendererModuleDefinition {
  return definition
}
