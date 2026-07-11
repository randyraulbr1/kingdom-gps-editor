import { defineModule } from '../defineModule'
import { makePlaceholderPanel } from '@renderer/shared/components/ModulePlaceholder'

export const lootModule = defineModule({
  id: 'loot',
  name: 'Loot',
  icon: 'Gift',
  group: 'content',
  capabilities: ['create', 'edit', 'delete', 'export', 'bulkEdit'],
  panel: makePlaceholderPanel(
    'Loot',
    'Módulo en construcción. Se implementará en una fase posterior siguiendo el patrón de referencia construido en el módulo Objetos (rejilla, inspector, repositorio, exportador).'
  )
})
