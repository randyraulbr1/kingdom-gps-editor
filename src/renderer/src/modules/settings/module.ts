import { defineModule } from '../defineModule'
import { makePlaceholderPanel } from '@renderer/shared/components/ModulePlaceholder'

export const settingsModule = defineModule({
  id: 'settings',
  name: 'Configuración',
  icon: 'Settings',
  group: 'system',
  capabilities: ['edit'],
  panel: makePlaceholderPanel(
    'Configuración',
    'Preferencias del editor y del proyecto actual. Se implementará junto con el resto de módulos de sistema.'
  )
})
