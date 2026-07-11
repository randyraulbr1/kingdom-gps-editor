import { defineModule } from '../defineModule'
import { ArmorPanel } from './components/ArmorPanel'

export const armorsModule = defineModule({
  id: 'armors',
  name: 'Armaduras',
  icon: 'Shield',
  group: 'content',
  capabilities: ['create', 'edit', 'delete', 'export', 'bulkEdit'],
  shortcuts: [{ combo: 'Ctrl+N', description: 'Nueva armadura' }],
  panel: ArmorPanel
})
