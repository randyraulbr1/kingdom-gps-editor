import { defineModule } from '../defineModule'
import { WeaponsPanel } from './components/WeaponsPanel'

export const weaponsModule = defineModule({
  id: 'weapons',
  name: 'Armas',
  icon: 'Sword',
  group: 'content',
  capabilities: ['create', 'edit', 'delete', 'export', 'bulkEdit'],
  shortcuts: [{ combo: 'Ctrl+N', description: 'Nueva arma' }],
  panel: WeaponsPanel
})
