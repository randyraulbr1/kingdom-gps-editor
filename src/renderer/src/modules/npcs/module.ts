import { defineModule } from '../defineModule'
import { makePlaceholderPanel } from '@renderer/shared/components/ModulePlaceholder'

export const npcsModule = defineModule({
  id: 'npcs',
  name: 'NPC',
  icon: 'Users',
  group: 'content',
  capabilities: ['create', 'edit', 'delete', 'export', 'bulkEdit'],
  panel: makePlaceholderPanel(
    'NPC',
    'Módulo en construcción. Se implementará en una fase posterior siguiendo el patrón de referencia construido en el módulo Objetos (rejilla, inspector, repositorio, exportador).'
  )
})
