# Plan Detallado: Editor de Mundo - FASE A

## Resumen
Implementar un módulo profesional completo para editar el mundo del juego en tiempo real sobre un mapa interactivo.

## FASE A: Infraestructura Local (Mapa + Capas + CRUD en Memoria)

### Ya Completado
✅ Tipos compartidos (`src/shared-types/world.ts`)
✅ Servicio en memoria (`src/main/worldEditor/worldEditorService.ts`)
✅ Definición del módulo (`src/main/worldEditor/moduleDefinition.ts`)
✅ Handlers IPC (`src/main/ipc/handlers/worldEditor.ts`)
✅ Métodos en preload (`src/preload/index.ts`)
✅ Métodos en API (`src/shared-types/api.ts`)
✅ CommandBus integration (undo/redo stubs)
✅ Dependencias Leaflet + React Leaflet en package.json
✅ ULID generator (`src/main/utils/idGenerator.ts`)

### Por Implementar - Componentes React

#### 1. **Hook de Estado Global** (`src/renderer/src/modules/worldEditor/hooks/useWorldEditorState.ts`)
- Gestiona:
  - Lista de entidades (en memoria)
  - Entidad seleccionada
  - Mapa mode (real/local/satélite/calles/oscuro)
  - Visibilidad de capas
  - Estado del context menu
  - Estado del inspector

#### 2. **Componente Mapa Principal** (`src/renderer/src/modules/worldEditor/WorldMapEditor.tsx`)
- Renderiza Leaflet
- Muestra marcadores por tipo de entidad
- Diferentes iconos/colores por tipo
- Clic izquierdo: selecciona entidad
- Clic derecho: abre context menu
- Drag & drop de marcadores: mueve entidad
- Muestra zoom level y coordenadas actuales
- Botones: crear nuevo, refrescar, zoom fit

#### 3. **Componente Context Menu** (`src/renderer/src/modules/worldEditor/ContextMenu.tsx`)
- Se abre con clic derecho
- Opciones dinámicas según si hay entidad bajo cursor o no:
  - Si hay entidad: Editar, Mover, Duplicar, Copiar, Eliminar, Ver JSON, Desactivar
  - Si no hay entidad: Crear Objeto, Crear Enemigo, Crear NPC, Crear Cofre, Crear Tienda, Crear Misión, etc.
- Soporte para pantallas táctiles (long press)

#### 4. **Componente Selector Modal** (`src/renderer/src/modules/worldEditor/EntitySelector.tsx`)
- Diálogo modal que se abre cuando eliges "Crear Objeto aquí" (u otro tipo)
- Búsqueda por nombre
- Filtros: categoría, rareza, etiquetas
- Vistas: casillas, lista, tabla
- Confirmación con "Aceptar" → crea entidad en coordenadas del clic

#### 5. **Componente Inspector** (`src/renderer/src/modules/worldEditor/EntityInspector.tsx`)
- Panel lateral que muestra detalles de la entidad seleccionada:
  - ID local
  - ID servidor (si está sincronizado)
  - Tipo
  - Nombre
  - Posición (lat/lng)
  - Rotación
  - Estado (habilitado/deshabilitado)
  - Propiedades específicas del tipo (JSON editable)
  - Botones: Guardar, Cancelar, Copiar JSON, Abrir en módulo original

#### 6. **Componente Capas/Filtros** (`src/renderer/src/modules/worldEditor/LayersPanel.tsx`)
- Panel con toggle para cada tipo de entidad:
  - ☑ Objetos
  - ☑ Enemigos
  - ☑ NPCs
  - etc.
- Slider de opacidad por tipo
- Botón de bloqueo (lock) para evitar editar
- Contador de elementos por tipo

#### 7. **Utilidades Compartidas**
- `mapUtils.ts`: conversión de coordenadas, zoom bounds, etc.
- `entityColorMap.ts`: color/icono por tipo de entidad
- `storageService.ts`: guardar/cargar estado local (en FASE B será SQLite)

### Estructura de Archivos A Crear

```
src/renderer/src/modules/worldEditor/
├── WorldMapEditor.tsx          (componente principal)
├── ContextMenu.tsx
├── EntitySelector.tsx
├── EntityInspector.tsx
├── LayersPanel.tsx
├── MapMarker.tsx               (componente para cada marcador)
├── hooks/
│   ├── useWorldEditorState.ts
│   ├── useMapDragDrop.ts
│   └── useContextMenu.ts
├── services/
│   ├── entityService.ts        (llamadas a IPC)
│   └── mapService.ts
├── utils/
│   ├── mapUtils.ts
│   ├── entityColorMap.ts
│   ├── localStorageService.ts
│   └── coordinateUtils.ts
└── styles/
    ├── worldEditor.css
    └── leaflet-custom.css
```

### Flujos Principales

**Crear Entidad:**
1. Clic derecho en mapa → Context Menu
2. Seleccionar "Crear Objeto"
3. Se abre EntitySelector modal
4. Filtrar/buscar objeto
5. Seleccionar
6. Confirmar
7. Entidad se crea en memoria con `window.api.worldEditor.createEntity()`
8. Marcador aparece en el mapa
9. Se puede editar en el Inspector

**Mover Entidad:**
1. Drag & drop de marcador
2. Al soltar, se llama `window.api.worldEditor.moveEntity()`
3. Posición se actualiza en el mapa
4. Inspector se actualiza

**Eliminar Entidad:**
1. Clic derecho en marcador → "Eliminar"
2. Confirmación
3. Se llama `window.api.worldEditor.deleteEntity()`
4. Marcador desaparece del mapa

### Testing Plan

Pruebas de E2E (Vitest):
- Crear entidad local
- Mover entidad
- Editar propiedades
- Duplicar entidad
- Eliminar entidad
- Toggle visibilidad de capa
- Persistencia en local storage
- Undo/redo

### Limitaciones de FASE A

- ❌ No sincroniza con servidor (será FASE C)
- ❌ No hay persistencia en BD SQLite (será FASE B)
- ❌ No hay resolución de conflictos (será FASE D)
- ❌ No hay previsualización en juego (será FASE D)
- ❌ Todo se pierde al cerrar la app (se agregará persistencia en FASE B)

### Éxito de FASE A

✅ Mapa funcional con Leaflet
✅ Puedes hacer clic derecho y crear entidades
✅ Selector modal funcional
✅ Puedes mover elementos (drag & drop)
✅ Inspector muestra propiedades
✅ Capas se pueden ocultar/mostrar
✅ Undo/redo registran cambios
✅ Cero errores de TypeScript
✅ Pruebas pasando
✅ README documenta cómo usar

---

## Próximos Pasos (después de FASE A)

### FASE B
- Migraciones SQLite: `world_entities` + `world_sync_jobs`
- Persistencia en disco
- Indicadores visuales de estado (local/pending/synced/error)
- Panel de cola de sincronización

### FASE C
- `WorldSyncProvider` (API desacoplada)
- Envío a servidor real
- Reintentos con backoff
- Manejo de errores

### FASE D
- Resolución de conflictos
- Publicación masiva
- Previsualización en juego
- Exportación JSON

---

## Empezaremos cuando des el OK
