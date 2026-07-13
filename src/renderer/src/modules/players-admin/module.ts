import { defineModule } from '../defineModule'
import { PlayersAdminPanel } from './components/PlayersAdminPanel'

export const playersAdminModule = defineModule({
  id: 'players-admin',
  name: 'Jugadores',
  icon: 'Users',
  group: 'tools',
  capabilities: ['create', 'edit', 'delete'],
  panel: PlayersAdminPanel
})
