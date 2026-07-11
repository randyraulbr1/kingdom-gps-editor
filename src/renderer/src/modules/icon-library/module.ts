import { defineModule } from '../defineModule'
import { IconLibraryPanel } from './components/IconLibraryPanel'

export const iconLibraryModule = defineModule({
  id: 'icon-library',
  name: 'Biblioteca de Iconos',
  icon: 'Images',
  group: 'system',
  capabilities: ['create', 'edit', 'delete', 'import'],
  shortcuts: [{ combo: 'Ctrl+Shift+I', description: 'Importar carpeta de iconos' }],
  panel: IconLibraryPanel
})
