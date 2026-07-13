import { defineModule } from '../defineModule'
import { GameViewPanel } from './components/GameViewPanel'

export const gameViewModule = defineModule({
  id: 'game-view',
  name: 'Probar Juego',
  icon: 'Gamepad2',
  group: 'tools',
  capabilities: ['edit'],
  panel: GameViewPanel
})
