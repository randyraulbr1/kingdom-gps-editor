import { defineModule } from '../defineModule'
import { makePlaceholderPanel } from '@renderer/shared/components/ModulePlaceholder'

export const toolsModule = defineModule({
  id: 'tools',
  name: 'Herramientas',
  icon: 'Wand2',
  group: 'tools',
  capabilities: ['create'],
  panel: makePlaceholderPanel(
    'Herramientas',
    'Generadores masivos, validación de datos y utilidades de mantenimiento (ver condición 6 del plan). Reservado para cuando existan módulos de contenido sobre los que operar.'
  )
})
