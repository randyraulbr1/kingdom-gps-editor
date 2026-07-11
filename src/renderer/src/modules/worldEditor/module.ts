import { defineModule } from '../defineModule'
import { WorldMapPanel } from './components/WorldMapPanel'

export const worldEditorModule = defineModule({
  id: 'world-editor',
  name: 'Editor de Mundo',
  icon: 'MapPin',
  group: 'tools',
  capabilities: ['create', 'edit', 'delete', 'export', 'bulkEdit'],
  shortcuts: [
    { combo: 'M', description: 'Enfoque en mapas' },
    { combo: 'Ctrl+G', description: 'Ir a coordenadas' },
    { combo: 'Ctrl+L', description: 'Toggle capas' }
  ],
  panel: WorldMapPanel
})
