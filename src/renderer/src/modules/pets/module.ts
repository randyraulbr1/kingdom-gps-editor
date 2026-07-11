import { defineModule } from '../defineModule'
import { makePlaceholderPanel } from '@renderer/shared/components/ModulePlaceholder'

export const petsModule = defineModule({
  id: 'pets',
  name: 'Mascotas',
  icon: 'Heart',
  group: 'content',
  capabilities: ['create', 'edit', 'delete', 'export', 'bulkEdit'],
  panel: makePlaceholderPanel(
    'Mascotas',
    'Módulo en construcción. Se implementará en una fase posterior siguiendo el patrón de referencia construido en el módulo Objetos (rejilla, inspector, repositorio, exportador).'
  )
})
