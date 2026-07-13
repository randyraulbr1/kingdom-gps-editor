import { defineModule } from '../defineModule'
import { SettingsPanel } from './components/SettingsPanel'

export const settingsModule = defineModule({
  id: 'settings',
  name: 'Configuración',
  icon: 'Settings',
  group: 'system',
  capabilities: ['edit'],
  panel: SettingsPanel
})
