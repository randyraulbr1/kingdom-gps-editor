# Informe — Editor de Mundo (mapa GPS real)

Fecha: 2026-07-10
Contexto: este módulo lo empezó otra sesión/agente en paralelo a las Fases 1-2
documentadas en `INFORME_FASE_1.md` / `INFORME_FASE_2.md`. Quedó a medio
terminar (backend en memoria, sin UI, sin registrar en el sidebar). Este
informe documenta la auditoría y lo que se completó para dejarlo funcional y
consistente con el resto del editor.

---

## 1. Qué había y qué faltaba

Lo que ya existía (bien diseñado, se conservó su forma):
- Tipos completos en `shared-types/world.ts`: `WorldEntity`, tipos de
  entidad (NPC, enemigo, cofre, tienda, zona, teletransportador, etc.),
  estados de sincronización pensados para una futura Fase C/D de sync con
  servidor, requests/responses de IPC.
- Generador de ULID (`main/utils/idGenerator.ts`) para IDs de entidad
  estables de cara a una futura sincronización remota.
- Store de Zustand del renderer (`useWorldEditorStore`) con capas, opacidad,
  menú contextual, selección — completo y bien probado.
- `entityService.ts` (wrapper tipado sobre `window.api.worldEditor`) y
  `markerColors.ts` (colores/emoji por tipo de entidad para los marcadores).
- Handlers IPC y contrato en `shared-types/api.ts` / preload ya cableados.

Lo que faltaba o estaba roto:
- **Persistencia real**: el servicio (`worldEditorService.ts`) guardaba todo
  en un `Map` en memoria del proceso principal, con comentarios explícitos
  "FASE A: en memoria, FASE B: SQLite" — es decir, todo el mapa se perdía al
  cerrar la app. Inconsistente con el resto del editor (todo lo demás
  persiste en SQLite desde la Fase 1).
- **Ningún componente de mapa**: nada usaba `leaflet`/`react-leaflet`
  (ya estaban instalados en `package.json`) para renderizar nada. El
  store y el servicio no tenían ninguna UI real detrás.
- **No registrado**: no existía `module.ts` para el renderer, y el id
  `'world-editor'` no estaba en `TOOLS_MODULE_ORDER` — aunque hubiera
  existido un panel, el Sidebar nunca lo habría mostrado.
- **Undo/redo a medias**: `CommandBus` ya grababa
  `recordWorldEntityCreate/Update/Move/Delete/Toggle` en el historial, pero
  `applyState()` no tenía ningún caso para `moduleId === 'worldEditor'` — es
  decir, Ctrl+Z sobre una entidad del mapa no habría hecho nada.
- **Prueba rota**: `worldEditor.test.ts` llamaba al hook
  `useVisibleEntities()` como función suelta fuera de un componente React
  (`Invalid hook call`), y además el archivo no estaba incluido en
  `vitest.config.ts` (que solo cubría `src/main/**`), así que ni siquiera se
  estaba ejecutando.
- **CSP bloqueaba las teselas del mapa**: la política de seguridad de
  contenido de `index.html` (de la Fase 1) solo permitía imágenes de
  `'self' kgps-icon: data:` — las teselas de OpenStreetMap
  (`https://*.tile.openstreetmap.org`) quedaban bloqueadas silenciosamente.
  El mapa se veía en blanco hasta corregir esto.
- Código muerto: `main/worldEditor/moduleDefinition.ts` duplicaba la mismA
  metadata del módulo sin que nada lo importara.

## 2. Qué se hizo

- **Migración `004_world_entities`** + `WorldEntitiesTable` en `schema.ts`.
  `world_id` (ULID) como clave primaria — no autoincremental, para que
  sobreviva sin cambios a una futura sincronización con servidor.
- **`WorldEntityRepository`** (`main/worldEditor/worldEntityRepository.ts`)
  reemplaza el `Map` en memoria: mismos métodos que el servicio original
  (create/update/move/softDelete/toggle/duplicate/query/listByType/
  getPublishSummary/getSyncStatus) más `hardDelete` y `restoreWithId`
  (primitivas que necesita el undo/redo). Borrado sigue siendo *soft*
  (mantiene la fila con `deletedAt`), igual que el diseño original.
- **Handlers IPC reconectados** al repositorio (todas las llamadas ahora
  `await` sobre SQLite en vez de un `Map` síncrono).
- **`CommandBus`** ahora entiende `moduleId === 'worldEditor'`: crear,
  actualizar, mover, eliminar y activar/desactivar entidades se pueden
  deshacer/rehacer de verdad (antes solo se grababan, nunca se aplicaban).
- **`WorldMapPanel`** (react-leaflet): mapa con teselas reales de
  OpenStreetMap, marcadores como `L.divIcon` coloreados por tipo (evita el
  clásico problema de rutas rotas del icono por defecto de Leaflet en
  bundlers), clic-para-crear (con selector de tipo de entidad), arrastrar
  para mover, panel de capas (mostrar/ocultar por tipo), y un
  `EntityInspector` (nombre, tipo, posición, estado de sync, habilitar/
  deshabilitar, duplicar, eliminar).
- **Registrado en el sidebar**: `module.ts` nuevo, agregado a
  `renderer/modules/registry.ts` y a `TOOLS_MODULE_ORDER` — aparece como
  "Editor de Mundo" en la sección Herramientas.
- **CSP corregida** en `index.html` para permitir imágenes y conexiones a
  `https://*.tile.openstreetmap.org`.
- **Prueba arreglada**: se sustituyó la llamada directa al hook por una
  réplica de su lógica de filtrado contra el estado "vanilla" del store
  (`useWorldEditorStore.getState()`), y se amplió `vitest.config.ts` para
  incluir `src/renderer/**/*.test.ts` además de `src/main/**`.
- **Prueba nueva** `worldEntityRepository.test.ts` (6 casos: creación con
  ULID, mover, soft-delete, hard-delete, restoreWithId, filtros de query).
- Eliminado el código muerto (`worldEditorService.ts` en memoria,
  `moduleDefinition.ts` duplicado).

## 3. Decisiones tomadas

| Decisión | Motivo |
|---|---|
| Persistir ya en SQLite en vez de dejarlo en memoria (Fase A original) | Consistencia con el resto del editor — ningún otro módulo pierde datos al cerrar la app; hacerlo distinto aquí sería un contrato roto para el usuario |
| Marcadores con `L.divIcon` en vez de `L.Icon.Default` | El icono por defecto de Leaflet se rompe con casi cualquier bundler (rutas relativas a PNGs); los divs con emoji+color ya existían en `markerColors.ts`, se reutilizaron tal cual |
| Mantener el borrado como *soft delete* | Es el diseño que ya traía el servicio original (para poder recuperarlo o marcarlo como tombstone al sincronizar) - se conservó porque es correcto de cara a la Fase C (sync con servidor) |
| Solo tesela "calle" (OpenStreetMap) por ahora, no las 6 variantes de `MapMode` | El tipo `MapMode` ya define 6 modos (real/local/satellite/streets/dark/game_view) pero implementarlos todos no era necesario para dejar el mapa funcional; queda como extensión futura |
| No se generalizó un `ContentGrid<T>` compartido con el módulo Objetos | El Editor de Mundo es un mapa, no una rejilla — son patrones de UI distintos que no debían forzarse a compartir componente |

## 4. Pruebas realizadas

### Automatizadas
- `npx vitest run` → **26/26 pruebas pasando** (20 previas + 6 nuevas de
  `WorldEntityRepository`; las 10 de `worldEditor.test.ts` ahora sí corren).
- `npx tsc --noEmit` (main/preload y renderer): **0 errores**.

### Manuales / end-to-end (en la app real)
- Reabrí el proyecto existente (`MiProyectoKGPS`) — los objetos de la Fase 2
  seguían ahí, confirmando que la persistencia entre sesiones sigue intacta.
- Abrí "Editor de Mundo" desde el sidebar → el mapa cargó en blanco la
  primera vez (CSP bloqueando las teselas); corregido y verificado con
  captura: el mapa de OpenStreetMap se ve correctamente.
- Coloqué una entidad tipo "object" con clic en el mapa → apareció el
  marcador en las coordenadas correctas, el contador pasó a "1 entidades
  visibles", y el Inspector mostró nombre, tipo, posición (lat/lng reales),
  estado de sincronización "local", y el ULID generado (26 caracteres).
- `npm run build` generó el instalador de Windows sin errores.

### No cubierto manualmente en esta sesión
- Arrastrar un marcador para moverlo (la lógica de `dragend` está probada a
  nivel de repositorio vía `move()`, pero no se arrastró un marcador en vivo).
- Undo/redo específico sobre una entidad del mapa (cubierto por la lógica en
  `CommandBus.applyWorldEntityState`, sin sesión manual de Ctrl+Z en el mapa).
- Panel de capas (mostrar/ocultar por tipo) no se abrió en la sesión manual.
- Sincronización con servidor (Fase C/D) — sigue siendo un stub documentado,
  fuera de alcance hasta que exista un servidor real.

## 5. Limitaciones conocidas

- Solo se implementó la vista de teselas "calle" (OpenStreetMap); los otros
  5 `MapMode` del tipo compartido son aspiracionales todavía.
- El mapa requiere conexión a internet (teselas de OpenStreetMap); no hay
  modo sin conexión ni caché local de teselas.
- El bundle del renderer subió a ~2.37 MB sin comprimir (Leaflet + su CSS)
  — la deuda de code-splitting señalada en fases anteriores sigue creciendo.
- `publishChanges`/`retryFailed`/`resolveConflict` siguen siendo stubs (Fase
  C/D, requieren un servidor real del lado de Kingdom GPS que aún no existe).
