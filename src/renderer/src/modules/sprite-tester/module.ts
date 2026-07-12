import { defineModule } from '../defineModule'
import { SpriteSheetEditorPanel } from './components/SpriteSheetEditorPanel'

export const spriteTesterModule = defineModule({
  id: 'sprite-tester',
  name: 'Sprite Sheet / Personaje',
  icon: 'PersonStanding',
  group: 'tools',
  capabilities: ['create', 'edit', 'export', 'import'],
  shortcuts: [
    { combo: 'WASD', description: 'Mover en el probador' },
    { combo: 'Shift', description: 'Correr' },
    { combo: 'R', description: 'Recargar' }
  ],
  panel: SpriteSheetEditorPanel
})
