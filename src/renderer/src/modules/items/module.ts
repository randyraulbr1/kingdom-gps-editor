import { defineModule } from '../defineModule'
import { ItemsPanel } from './components/ItemsPanel'

export const itemsModule = defineModule({
  id: 'items',
  name: 'Objetos',
  icon: 'Package',
  group: 'content',
  capabilities: ['create', 'edit', 'delete', 'export', 'bulkEdit'],
  shortcuts: [{ combo: 'Ctrl+N', description: 'Nuevo objeto' }],
  panel: ItemsPanel
})
