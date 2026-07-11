# INFORME DE ESTADO DEL PROYECTO — Kingdom GPS

Fecha del análisis: 2026-07-10
Actualizado: 2026-07-11 (integración de parche + menú contextual + pines Tienda/NPC)

---

## 0. Resumen rápido — ¿Qué está PROGRAMADO de verdad vs. solo DOCUMENTADO?

> Regla del proyecto: un documento en `panel adm/` es una **especificación**, no
> significa que exista en el programa. Esta tabla separa código real de papel.

### ✅ Programado, con pruebas y build (código real en la rama)

| Función | Dónde | Pruebas |
|---|---|---|
| Infraestructura (proyectos, BD, IPC, undo/redo, export) | `src/main/**` | ✅ |
| Biblioteca de iconos | `src/main/icons`, módulo `icon-library` | ✅ |
| Módulo **Objetos** (framework de contenido) | `modules/items` | ✅ |
| Módulo **Armas** (undo/redo + export) | `main/weapons`, `modules/weapons` | ✅ |
| Módulo **Armaduras** (migración `007_armor`, undo/redo + export) | `main/armor`, `modules/armors` | ✅ |
| Editor de Mundo: mapa, entidades, zonas, OSM, export | `modules/worldEditor` | ✅ |
| **Menú contextual estilo PC** (copiar/cortar/pegar/duplicar/Propiedades, atajos, no se corta) | `worldEditor/components/MapContextMenu`, `utils/clipboard` | ✅ |
| **Pin Tienda funcional** (ficha + catálogo + simulador de compra) | `worldEditor/components/ShopModal`, `content/shopConfig` | ✅ |
| **Pin NPC funcional** (simulador + indicadores `!`/`?`/🛒) | `worldEditor/components/NpcModal`, `content/npcConfig` | ✅ |
| **Diálogos como nodos conectados** (opciones + efectos, validación de enlaces rotos, recorrido) | `content/dialogueGraph` | ✅ |
| **Misiones con pasos conectados al mapa** (paso → pin objetivo, validación de referencias) | `content/npcConfig` | ✅ |
| **Pin Monstruo funcional** (stats, distancias GPS, loot, spawn, IA de 4 estados, simuladores) | `worldEditor/components/EnemyModal`, `content/enemyConfig` | ✅ |
| **Primitivas de loot compartidas** (tabla + tirada, reutilizadas por Monstruo y Cofre) | `content/lootTable` | ✅ |
| **Pin Cofre/Loot funcional** (loot + monedas + exp, condiciones, simulador de apertura) | `worldEditor/components/ChestModal`, `content/chestConfig` | ✅ |

Verificado en este entorno: `typecheck` limpio, **100/100 pruebas**, `electron-vite build` OK.
**Pendiente:** empaquetado `.exe` (`electron-builder --win`, requiere Windows) y
**verificación visual en el Windows del usuario** de Tienda/NPC.

### 📄 Solo DOCUMENTACIÓN (spec aprobada, sin código todavía)

- **Cadenas de misiones** entre varios NPC y persistencia del progreso del jugador
  (docs 08, 20) — hoy la misión con pasos vive embebida en el pin NPC y el diálogo
  ya es un grafo conectado, pero no hay módulo de misiones dedicado ni progreso.
- **Ruta roja de enemigos** y combate compartido real por proximidad (docs 14, 21) —
  hoy existe el pin Monstruo con IA local y loot simulado, pero no la ruta ni el
  combate multijugador (requiere servidor).
- Módulo de **tablas de loot reutilizables** con pestaña "usado por" y borrado seguro
  (doc 22) — hoy el loot vive embebido en cada pin (Monstruo/Cofre) con primitivas
  compartidas, pero no hay catálogo central de tablas ni gestión de referencias.
- Recursos, recolección y respawn (doc 23).
- Rutas de enemigos y spawn por zona (doc 14).
- Administrador de referencias y borrado seguro (doc 19).
- Validador del mundo y publicación (doc 24).
- Capas, filtros y búsqueda avanzada (doc 26).
- Panel de propiedades unificado con pestañas (doc 27) — hoy inspector básico + modales.
- Menú "Pegar especial" y selección múltiple (doc 28) — hoy 1 elemento a la vez.
- Todo lo que depende de servidor: sync remota, seguridad/auditoría (09),
  zonas por jugador (12), tops/temporadas (13), economía (06).

---

## 1bis. Análisis original (2026-07-10)

Fecha del análisis: 2026-07-10
Fuente de verdad: **`panel adm/`** (documentación oficial importada desde
`github.com/randyraulbr1/tcodm-web/tree/main/panel%20adm`), contrastada contra
el código real. Cuando el código demuestra que algo ya funciona, se marca como
completado aunque el roadmap oficial lo tuviera como pendiente.
No se modificó código. Solo se importó documentación y se generó este informe.

---

## 1. Ruta completa del proyecto

- **Código real (el editor / "Panel ADM"):**
  `C:\Users\RANDY\Desktop\dfgj\KingdomGPS\editor`
- **Documentación oficial importada:**
  `C:\Users\RANDY\Desktop\dfgj\KingdomGPS\editor\panel adm\` (15 archivos `.md`)
- **Carpeta abierta en la sesión (solo datos, NO es el código):**
  `C:\Users\RANDY\Desktop\MiProyectoKGPS\MiProyectoKGPS\` — un *proyecto de
  datos* generado por el editor (`data.sqlite` con 2 objetos y 1 entidad de
  prueba, `project.kgps.json`, y carpetas `assets/export/backups` vacías).
- **Repositorio de documentación:** `github.com/randyraulbr1/tcodm-web`
- **Dominio de producción del juego (según doc 03):** `https://tcodm.com`

> Nota: la carpeta `panel adm` **no existía en local**; se descargó completa
> (15 `.md`, nombres preservados) y se colocó en la raíz del código. No había
> versión local previa que comparar, así que no se sobrescribió nada.

---

## 2. Tecnologías detectadas (código real)

| Capa | Tecnología | Estado |
|---|---|---|
| Escritorio | Electron 33 | ✅ en uso |
| UI | React 18 + TypeScript 5.7 | ✅ en uso |
| Bundler | electron-vite / Vite 5 | ✅ en uso |
| Base de datos | libSQL (`@libsql/client` 0.8.0) + Kysely | ✅ en uso |
| Estado | Zustand 5 | ✅ en uso |
| Paneles | dockview-react 7 | ✅ en uso |
| Mapa | Leaflet + react-leaflet | ✅ en uso |
| Listas grandes | react-window | ✅ en uso |
| Imágenes | sharp | ✅ en uso |
| UI primitivos | Radix UI (dialog/dropdown/tabs/tooltip) | ✅ en uso |
| Iconos UI | lucide-react | ✅ en uso |
| Estilos | Tailwind + PostCSS | ✅ en uso |
| Pruebas | Vitest | ✅ en uso |
| Empaquetado | electron-builder (NSIS Windows) | ✅ en uso |
| **Editor de código** | **Monaco Editor** | ❌ **en el stack oficial (doc 01) pero NO instalado** |

La arquitectura sigue el principio de la doc 01: 3 procesos (main / preload /
renderer) + contratos compartidos (`shared-types`), IPC tipado por
contextBridge, y el renderer nunca toca Node/SQLite/filesystem directamente.

---

## 3. Carpetas principales

```
dfgj/KingdomGPS/editor/
├── panel adm/                 ← documentación oficial (15 .md) [IMPORTADA HOY]
├── src/
│   ├── main/                  proceso principal
│   │   ├── data/              DataSource (Kysely + libSQL) + Repository base
│   │   ├── database/          schema.ts + migraciones 001..004 + runner
│   │   ├── projects/          ProjectManager + backups + recuperación
│   │   ├── ipc/               registerHandlers + 1 handler por dominio
│   │   ├── icons/             biblioteca de iconos (fs + sharp + hash)
│   │   ├── items/             ItemsRepository (patrón de referencia)
│   │   ├── worldEditor/       WorldEntityRepository (mapa GPS)
│   │   ├── export/            Exporter + registro + JsonExporter
│   │   ├── commands/          changeLog + commandBus (undo/redo)
│   │   ├── utils/             idGenerator (ULID)
│   │   └── modules/           (VACÍA — punto de extensión sin usar)
│   ├── preload/               puente window.api
│   ├── renderer/src/
│   │   ├── app/               shell: welcome, layout, sidebar, docking
│   │   ├── modules/           25 módulos plugin + registry.ts
│   │   └── shared/            componentes, tema, stores, hooks
│   └── shared-types/          contratos TS (api, item, world, icon, module…)
├── INFORME_FASE_1.md / _FASE_2.md / _EDITOR_DE_MUNDO.md
├── PLAN_EDITOR_MUNDO_FASE_A.md
├── README.md
└── package.json / tsconfig / electron.vite.config / vitest.config
```

Fuera del paquete `editor/`: **no existen** `client/` (juego del jugador) ni
`server/` (backend) — mencionados como fase futura en el README.

---

## 4. Estado del Panel ADM (el editor)

El "Panel ADM" de la documentación **es** este editor de escritorio. Estado por
área funcional descrita en los 15 documentos oficiales:

| Área (doc) | Estado | Detalle |
|---|---|---|
| Infraestructura (proyectos, BD, IPC, undo/redo, export) | ✅ Completo | Fase 1 real terminada y probada |
| Biblioteca de iconos (doc 05, parte biblioteca) | ✅ Completo | escaneo, tags, favoritos, dedup SHA-256, resize sharp, `kgps-icon://` |
| Editor de Objetos (doc 01) | ✅ Completo | rejilla/lista/tabla, Inspector ~20 campos, edición masiva, undo/redo, export (migrado al framework de contenido) |
| Editor de Armas | ✅ Completo | framework de contenido, migración `006_weapons`, undo/redo + export |
| Editor de Armaduras | ✅ Completo | framework de contenido, migración `007_armor`, undo/redo + export |
| Editor de Mundo — local (doc 02) | 🟡 Casi completo | mapa OSM, marcadores, capas, mover, inspector, persistido en SQLite; **menú contextual estilo PC implementado**, **pines Tienda y NPC funcionales**; falta cola `world_sync_jobs`, estados visuales de sync, inspector unificado |
| Generador IA de iconos / Recraft (doc 05) | 🔴 Pendiente | sin cola `icon_generation_jobs`, sin `.env`/token, sin integración Recraft |
| Vista integrada del juego (doc 03) | 🔴 Pendiente | sin `WebContentsView`, sin carga de `tcodm.com`/localhost, sin consola integrada |
| Gestor de sistemas versionados (doc 04) | 🔴 Pendiente | sin Monaco, sin versiones/candidatas, sin diff, sin rollback, sin adaptadores |
| Generador de misiones GPS (doc 08) | 🔴 Pendiente | sin importador TXT/YAML/JSON, sin cadenas, sin validación peatonal |
| Seguridad y auditoría de jugadores (doc 09) | 🔴 Pendiente | requiere servidor; sin perfiles, libro contable ni expedientes |
| Ideas y feedback de jugadores (doc 10) | 🔴 Pendiente | sin bandeja, sin tablas de feedback |
| Zonas de juego por jugador (doc 12) | 🔴 Pendiente | sin `play_areas`/`play_area_entities`, sin polígonos |
| Tops y temporadas (doc 13) | 🔴 Pendiente | sin `leaderboards`/`seasons`/`snapshots` |
| Economía futura (doc 06) | ⚪ Futuro | marcado explícitamente "no implementar ahora" |
| Funciones planificadas (doc 07) | ⚪ Futuro | historias, IA NPC, laboratorio, buscador global, etc. |
| Módulo Herramientas del editor | 🟡 Placeholder | panel que lista utilidades previstas, sin lógica |
| ~18 módulos de contenido restantes | 🔴 Placeholder | Herramientas, Recursos, Comida, Monstruos, Misiones… solo cascarón de UI (Objetos/Armas/Armaduras ya reales) |

**Módulos registrados en el sidebar: 25** (22 de contenido + Herramientas +
Biblioteca de Iconos + Editor de Mundo). De ellos, **solo Objetos, Biblioteca
de Iconos y Editor de Mundo tienen implementación real**; los otros 22 son
placeholders o utilidades vacías.

---

## 5. Estado del juego GPS (Kingdom GPS)

**El juego como tal no está en este repositorio.** Aquí solo vive el editor.

- `client/` (juego del jugador / PWA) — 🔴 no existe como carpeta.
- `server/` (backend, fuente de verdad de dinero/objetos/recompensas) — 🔴 no
  existe. Toda la doc 09/11/13 insiste en que "el servidor es la fuente de
  verdad", pero ese servidor **aún no existe**, por lo que toda la
  sincronización remota del editor son *stubs*.
- El único punto de contacto editor↔juego previsto (doc 03, Vista integrada vía
  `WebContentsView` cargando `tcodm.com`) — 🔴 no implementado.
- El dominio `tcodm.com` y el repo `tcodm-web` sugieren que existe un front-web
  del juego aparte, **fuera de esta carpeta** y fuera del alcance analizado.

---

## 6. Qué está COMPLETO

1. **Fundación del editor (Fase 1):** shell con tema oscuro + barra de título
   propia + docking; `ProjectManager` (crear/abrir/recientes/backups/
   recuperación con `integrity_check`); libSQL en WAL + Kysely + migraciones
   idempotentes; IPC tipado punta a punta verificado por prueba estática;
   `CommandBus`/`change_log` con undo/redo persistente; sistema de módulos
   plugin; exportadores extensibles (`JsonExporter`).
2. **Biblioteca de Iconos:** completa (parte "biblioteca" de la doc 05).
3. **Módulo Objetos (Fase 2):** completo, es el patrón de referencia.
4. **Editor de Mundo — capa local (Fase 3 local):** mapa real, CRUD, capas,
   persistencia SQLite (`004_world_entities`), undo/redo cableado.
5. **Verificación declarada:** `tsc --noEmit` 0 errores, 26/26 pruebas Vitest,
   `npm run build` produce instalador NSIS. `node_modules/` instalado.

---

## 7. Qué está PARCIAL

1. **Editor de Mundo:** falta el **menú contextual real** (el estado existe en
   el store — `openContextMenu/closeContextMenu` — pero no hay componente
   `ContextMenu` que lo renderice); falta la **cola `world_sync_jobs`** que
   pide la doc 02; de los **10 estados de sync** solo se maneja `local`; de los
   **6 `MapMode`** solo la tesela "calle" (OSM).
2. **Sincronización remota del mundo:** cableada extremo a extremo
   (IPC→preload→`entityService`) pero backend en *stub* y **sin UI** que la
   consuma (`publishChanges`, `retryFailed`, `resolveConflict`,
   `getPublishSummary`, `exportWorld`, `clearUnsyncedChanges`).
3. **Cumplimiento de la Guía de Calidad (doc 11):** el código respeta parte de
   ella (contratos en `shared-types`, IPC tipado, repositories, migraciones,
   tests), pero **no** la estructura por módulo (`contracts/models/services/
   adapters/validators/tests/README` por carpeta), ni validadores de entrada,
   ni feature flags, ni `idempotencyKey`, ni logs estructurados, ni eventos
   tipados con `correlationId`, ni README por módulo.
4. **Módulo Herramientas:** placeholder que solo enumera lo previsto.
5. **`bulkDelete` de objetos** no pasa por `CommandBus` (no es deshacible).
6. **Rescan de iconos:** detecta archivos nuevos pero no borrados (deja filas
   huérfanas). El máster de icono es 256px; la doc 05 pide **512px** máster.

---

## 8. Qué está PENDIENTE (no existe todavía)

- **21 de 22 módulos de contenido** (Armas, Armaduras, Herramientas, Recursos,
  Comida, Cultivos, Construcciones, NPC, Monstruos, Loot, Misiones, Diálogos,
  Mapas, Economía, Fabricación, Recetas, Profesiones, Animales, Mascotas,
  Eventos, Configuración) — solo placeholders.
- **Generador IA de iconos (Recraft)** — doc 05: tabla `icon_generation_jobs`,
  cola, token en `.env`, flujo generar→revisar→aprobar→asignar.
- **Vista integrada del juego** — doc 03 (WebContentsView + consola + controles).
- **Gestor de sistemas versionados** — doc 04 (Monaco, versiones candidatas,
  comparador visual, adaptadores, publicación con staging/rollback). Es la
  **Fase 4** y el módulo más grande aún sin empezar.
- **Generador de misiones GPS** — doc 08.
- **Seguridad y auditoría de jugadores** — doc 09 (requiere servidor).
- **Ideas y feedback de jugadores** — doc 10.
- **Zonas de juego por jugador** — doc 12 (`play_areas`, polígonos).
- **Tops y temporadas** — doc 13 (`leaderboards`, `seasons`, `snapshots`).
- **Economía** (doc 06) y **Funciones planificadas** (doc 07) — futuro explícito.
- **Módulos del juego** listados en doc 01 sin equivalente en código:
  inventario, combate, chat, amigos, cuentas, multijugador, administración,
  PWA, actualizaciones.
- **`client/` y `server/`** del juego.

---

## 9. Qué está DESCONECTADO

1. **API de sync del Editor de Mundo sin consumidor de UI:** todo el bloque
   publish/sync/export está cableado hasta el handler, pero **ningún componente
   React lo llama** (solo `duplicateEntity` se usa). Es superficie muerta a la
   espera de la Fase C/D.
2. **`worldEditor:exportWorld` fuera del registro `Exporter`:** arma el JSON a
   mano en el handler IPC en vez de registrarse como `Exporter` (como
   iconos/objetos). Ruta de exportación inconsistente.
3. **Carpeta `src/main/modules/` vacía:** punto de extensión declarado (y
   referenciado por un comentario) pero sin ningún archivo.
4. **21 paneles placeholder:** conectados al sidebar pero **desconectados de
   datos** (sin repositorio ni IPC).
5. **Sistema completo sin backend:** toda la doc 09/12/13 depende de un
   servidor que no existe → esas funciones no pueden conectarse aún.

---

## 10. Qué está DUPLICADO

- **Ningún duplicado de archivo activo.** Los dos que hubo
  (`main/worldEditor/worldEditorService.ts` en memoria y `moduleDefinition.ts`)
  ya fueron eliminados (ver `INFORME_EDITOR_DE_MUNDO.md`). Confirmado ausentes.
- **Duplicación conceptual:** los 21 módulos placeholder son copias casi
  idénticas de ~15 líneas. Intencional por ahora, pero refuerza extraer un
  `ContentGrid<T>` genérico antes de rellenarlos y multiplicar el copy-paste.
- **Duplicación documental (a vigilar):** ahora hay **dos fuentes de roadmap** —
  `panel adm/00_ROADMAP.md` (oficial, ahora sincronizado con la realidad) y los
  `INFORME_FASE_*.md`. Conviene que `panel adm/` sea la única fuente de verdad.
- Fuera del proyecto: `Desktop/copia juego gps/*.zip` es un backup de otro
  proyecto (GitHub Pages), no un duplicado de este.

---

## 11. Qué ERRORES / INCONSISTENCIAS existen

> Ninguno bloquea la ejecución; son inconsistencias reales a corregir.

1. **Roadmap oficial desincronizado con el código.** `00_ROADMAP.md` marcaba la
   Fase 1 como 🟡 y las Fases 2 y 3 como ⚪, cuando en el código la Fase 1 está
   ✅, la Fase 2 (Objetos) ✅ y la Fase 3 (Editor de Mundo local) casi ✅. (Se
   corrige en el punto 15.)
2. **`settings` declara `group:'system'` pero está en `CONTENT_MODULE_ORDER`**
   (`shared-types/module.ts`) → aparecerá bajo "Contenido", no "Sistema". El
   campo `group` de cada módulo es redundante y ya divergió de los arrays de
   orden, que son la fuente real de agrupación.
3. **Comentario que referencia un archivo inexistente:** `registry.ts:31`
   menciona un "mirror in src/main/modules/registry.ts" que no existe.
4. **`PLAN_EDITOR_MUNDO_FASE_A.md` describe archivos que no se crearon** con
   esos nombres (`WorldMapEditor.tsx`, `ContextMenu.tsx`, `EntitySelector.tsx`,
   `useWorldEditorState.ts`…). La implementación real usa otros nombres.
5. **Doble nomenclatura para el mismo módulo:** `ModuleId` es `'world-editor'`
   (con guion) pero `change_log.module_id`/`CommandBus` usan `'worldEditor'`.
   Funciona (son espacios distintos) pero es una trampa fácil de romper.
6. **Contradicción máster de icono:** doc 05 pide máster 512px; el código
   redimensiona a 256/128/64 (sin 512).
7. **Huecos de verificación manual** declarados en los informes (undo/redo en
   vivo sobre Objetos y mapa, drag&drop de icono, arrastre de marcador,
   recuperación ante cierre forzado) — no ejecutados.

---

## 12. Qué DEPENDENCIAS faltan

- **Del stack oficial (doc 01):** **Monaco Editor NO está instalado**
  (`monaco-editor` / `@monaco-editor/react` ausentes en `package.json`). Es
  requisito de la Fase 4 (Gestor de Sistemas) y de las pestañas de código.
- **Para el Generador IA (doc 05):** faltará el cliente de **Recraft** y un
  `.env` con el token (a usar solo desde el proceso main) cuando se aborde.
- **Para lo demás (docs 08–13):** no faltan paquetes *hoy* porque esos módulos
  aún no existen; se evaluarán al implementarlos (p. ej. librería de polígonos/
  turf para zonas, parser YAML para misiones).
- **Lo que sí está bien:** el resto de dependencias que el código usa están
  todas en `package.json` y `node_modules/` está instalado. No hay imports
  huérfanos.
- **Restricción a respetar:** `@libsql/client` **fijado en 0.8.0** exacto
  (`@libsql/kysely-libsql` solo soporta `^0.8.0`; subirlo rompe los tipos).
- **Requisito de entorno (no npm):** si `ELECTRON_RUN_AS_NODE` está definida,
  Electron arranca como Node plano y la ventana no abre (workaround en README).

---

## 13. RIESGOS

| Riesgo | Impacto | Mitigación sugerida |
|---|---|---|
| **Alcance enorme vs. avance real** (docs describen ~13 sistemas; hay 3 hechos) | Alto | Priorizar por fases del roadmap; no abrir frentes fuera de fase |
| **No hay servidor**; toda auditoría/economía/tops/sync depende de él | Alto | Definir contratos de API antes de codificar 09/12/13; mantener stubs honestos |
| **Deuda de code-splitting** (bundle ~2.37 MB, crecerá con cada módulo) | Medio | Lazy-load de paneles antes de replicar los 21 módulos |
| **Guía de calidad (doc 11) no aplicada del todo** (sin feature flags, idempotencia, validadores, adapters) | Medio | Adoptarla al implementar el 2.º módulo de contenido, no retro-forzarla luego |
| **`npm audit`: 17 vulnerabilidades** en cadena de build | Medio | Revisar antes de release público; no `--force` a ciegas |
| **Instalador sin firmar** | Medio | Certificado de firma antes de distribuir a terceros |
| **Mapa depende de internet** (teselas OSM, sin caché) | Bajo | Caché local de teselas si se necesita modo offline |
| **Datos de prueba en proyecto real** ("Nuevo objeto" x2) | Bajo | Limpiar antes de usar el proyecto en serio |

---

## 14. Qué FASE del roadmap debe continuar

Según el estado real del código, las Fases 0–3 (local) están esencialmente
hechas. La decisión práctica está entre dos caminos legítimos:

- **Opción A — Ancho de contenido (recomendada como siguiente paso corto):**
  completar la **Fase 2/3 de contenido** replicando el patrón de Objetos al
  segundo módulo (**Armas**), y en ese momento **extraer un `ContentGrid<T>`
  genérico** para no repetir 21 veces. Rápido, de bajo riesgo, y desbloquea la
  producción de datos del juego. Cierra también los flecos del Editor de Mundo
  (menú contextual, estados de sync visuales).

- **Opción B — Profundidad de plataforma (Fase 4):** empezar el **Gestor de
  Sistemas versionados** (doc 04): instalar Monaco, versiones candidatas, diff,
  rollback. Es el módulo más ambicioso y el que más habilita a futuro, pero
  también el más caro y arriesgado.

**Recomendación:** hacer primero la **Opción A** (Armas + `ContentGrid<T>` +
cerrar flecos del mapa) porque valida el patrón, reduce duplicación y entrega
valor inmediato; dejar la **Fase 4 (Gestor de Sistemas)** como siguiente hito
grande una vez que el patrón de contenido esté generalizado. La Fase 5
(Laboratorio) y todo lo que dependa de servidor (docs 09/12/13) van después,
cuando exista `server/`.

Antes de tocar cualquier módulo nuevo conviene aplicar la **Guía de Calidad
(doc 11)** como checklist, para que lo nuevo nazca ya con validadores,
contratos, pruebas, feature flag y rollback.

---

## 15. Actualización del roadmap

Se sincronizó **`panel adm/00_ROADMAP.md`** con el estado real detectado en el
código (Fases 0–3 pasan a ✅/🟡 según corresponde) y se añadieron como fases
los sistemas documentados en `08`–`13` que no estaban en el roadmap original de
6 fases. El archivo original de GitHub queda así divergente del local: conviene
**volver a subir el roadmap actualizado** al repo `tcodm-web` para que la
documentación oficial refleje la realidad.

---

*Fin del informe. No se modificó ningún archivo de código; solo se importó la
documentación oficial y se actualizó el roadmap. A la espera de tu aprobación
para comenzar a programar la siguiente fase.*
