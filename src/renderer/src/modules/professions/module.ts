import { defineModule } from '../defineModule'
import { makePlaceholderPanel } from '@renderer/shared/components/ModulePlaceholder'

export const professionsModule = defineModule({
  id: 'professions',
  name: 'Profesiones',
  icon: 'Briefcase',
  group: 'content',
  capabilities: ['create', 'edit', 'delete', 'export', 'bulkEdit'],
  panel: makePlaceholderPanel(
    'Profesiones',
    'Módulo en construcción. Se implementará en una fase posterior siguiendo el patrón de referencia construido en el módulo Objetos (rejilla, inspector, repositorio, exportador).'
  )
})
