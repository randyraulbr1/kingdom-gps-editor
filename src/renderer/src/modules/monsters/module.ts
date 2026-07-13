import { defineModule } from '../defineModule'
import { MonsterPanel } from './components/MonsterPanel'

export const monstersModule = defineModule({
  id: 'monsters',
  name: 'Monstruos',
  icon: 'Skull',
  group: 'content',
  capabilities: ['create', 'edit', 'delete', 'export', 'bulkEdit'],
  shortcuts: [{ combo: 'Ctrl+N', description: 'Nuevo monstruo' }],
  panel: MonsterPanel
})
