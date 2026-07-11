import { defineModule } from '../defineModule'
import { makePlaceholderPanel } from '@renderer/shared/components/ModulePlaceholder'

export const recipesModule = defineModule({
  id: 'recipes',
  name: 'Recetas',
  icon: 'BookOpen',
  group: 'content',
  capabilities: ['create', 'edit', 'delete', 'export', 'bulkEdit'],
  panel: makePlaceholderPanel(
    'Recetas',
    'Módulo en construcción. Se implementará en una fase posterior siguiendo el patrón de referencia construido en el módulo Objetos (rejilla, inspector, repositorio, exportador).'
  )
})
