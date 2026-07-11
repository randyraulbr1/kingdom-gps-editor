# Informe — Fase 1: Andamiaje de Kingdom GPS Editor

Fecha: 2026-07-10
Alcance: arquitectura + andamiaje completo del editor, con las 10 condiciones
adicionales pedidas antes de avanzar a contenido real.

---

## 1. Qué se implementó

### Infraestructura base
- Proyecto Electron + React 18 + TypeScript + `electron-vite`, con tema
  oscuro (Tailwind), docking/tabs (`dockview-react`) y barra de título
  personalizada estilo VS Code (frameless, con controles propios).
- **Sistema de proyectos** (`ProjectManager`): crear, abrir, listar recientes,
  backups automáticos cada 10 min + al cerrar (rotación de los últimos 10),
  y recuperación automática: `PRAGMA integrity_check` al abrir y restauración
  desde el backup más reciente si falla.
- **Base de datos**: libSQL (`@libsql/client`) en modo WAL + Kysely como
  query builder tipado. Migraciones versionadas (`001_init`, `002_icon_library`)
  aplicadas automáticamente y de forma idempotente al abrir un proyecto.
- **Capa de datos desacoplada** (condición 1): `createDataSource()` es el
  único punto que conoce el dialecto concreto; los repositories solo hablan
  con la API de Kysely, portable a Postgres/MySQL.
- **Sistema de módulos como plugins** (condición 4): `ModuleDefinition`
  (id, nombre, icono, grupo, capacidades, atajos, panel) + registries que son
  los únicos archivos que conocen la lista completa de módulos.
- **Sistema de exportadores extensible** (condición 5): interfaz `Exporter`,
  registro central, `JsonExporter` implementado y probado exportando el
  manifest de la biblioteca de iconos a `export/icons.json`.
- **Undo/redo + historial persistente** (condiciones 8 y "autoguardado"):
  `CommandBus` + `ChangeLogService` sobre la tabla `change_log`; Ctrl+Z/Ctrl+Y
  funcionan de forma global y persisten entre reinicios (no es solo una pila
  en memoria).
- **IPC tipado de punta a punta**: contrato único en `shared-types/api.ts`,
  implementado 1:1 en el preload y en los handlers del main. Verificado con
  una prueba automática que compara ambos lados (ver sección de pruebas).

### Biblioteca de iconos (condición 2 — módulo completo, no una maqueta)
- Escaneo recursivo de carpetas con categorías automáticas (carpeta de primer
  nivel = categoría).
- Etiquetas (tabla `icon_tags`, muchos-a-muchos), favoritos, búsqueda por
  nombre, filtros por categoría/favoritos/duplicados.
- Deduplicado por hash SHA-256 del contenido del archivo.
- Conversión y redimensionado a 64/128/256 px vía `sharp` (PNG/JPG/WEBP).
- Vista previa grande, arrastrar y soltar (drag&drop nativo HTML5, listo para
  que los módulos de contenido lo consuman en Fase 2).
- Importación de carpetas completas desde fuera del proyecto.
- Los iconos son archivos PNG/JPG/WEBP reales en `assets/icons/`; la base de
  datos solo guarda metadata. Servidos al renderer vía el protocolo
  `kgps-icon://`, sin exponer rutas absolutas del sistema de archivos.

### Módulo "Herramientas" del editor (condición 6)
- Registrado como módulo plugin (`tools`), con panel placeholder que enumera
  los generadores/validadores previstos (objetos, NPC, misiones, loot,
  recetas, renombrado masivo de iconos, validación de datos, referencias
  rotas, importación de JSON antiguos). Sin implementación real todavía —
  correcto para esta fase, ya que no hay módulos de contenido sobre los que
  operar.

### Los 22 módulos de contenido originales
Registrados como plugins con panel placeholder (Objetos, Armas, Armaduras,
Herramientas de juego, Recursos, Comida, Cultivos, Construcciones, NPC,
Monstruos, Loot, Misiones, Diálogos, Mapas, Economía, Fabricación, Recetas,
Profesiones, Animales, Mascotas, Eventos, Configuración). Total de módulos
registrados en el sistema de plugins: **24** (22 de contenido + Herramientas
del editor + Biblioteca de Iconos).

### Regla "no editar contenido a mano" (condición 7)
No hay datos de contenido versionados como JSON/SQL editados a mano en el
repositorio; los únicos `.sql` son migraciones de esquema (estructura, no
datos), y los únicos `.json` generados son salidas de exportación.

---

## 2. Estructura final

Ver el árbol completo y la explicación de cada carpeta en `README.md`. Resumen
de las carpetas de primer nivel dentro de `editor/src/`:

```
main/        data, database, projects, modules, ipc, icons, export, commands
preload/     puente contextBridge -> window.api
renderer/    app (shell), modules (24 plugins), shared (tema/stores/ipc)
shared-types/ contratos TS compartidos por los 3 procesos
```

## 3. Decisiones tomadas (y por qué)

| Decisión | Motivo |
|---|---|
| Electron (no Tauri) | Herramienta interna; ecosistema de docking/paneles y filesystem más maduro en Electron |
| libSQL + Kysely en vez de `better-sqlite3` | Esta máquina no tiene el compilador C++ de Visual Studio; `better-sqlite3` requiere compilar un addon nativo y falló en `npm install`. libSQL trae binarios precompilados para Windows y es SQL-compatible vía el mismo query builder Kysely |
| `@libsql/client` fijado en `0.8.0` (no la última) | `@libsql/kysely-libsql` (el dialecto de Kysely para libSQL) solo soporta `@libsql/client ^0.8.0`; usar una versión más nueva produce dos copias de `@libsql/core` con tipos incompatibles |
| `dockview-react` en vez de `dockview` a secas | El paquete `dockview` (v7) es ahora solo el núcleo agnóstico de framework; los bindings de React viven en el paquete separado `dockview-react` |
| Ventana frameless + barra de título propia | Pedido explícito de estética "estilo VS Code"; se implementó con IPC dedicado (`window:minimize/toggleMaximize/close`) |
| `change_log` como tabla única para undo/redo e historial | Evita mantener dos mecanismos separados; una pila en memoria se habría perdido al reiniciar el proceso |

## 4. Cómo ejecutarlo

```bash
cd KingdomGPS/editor
npm install
npm run dev
```

Ver la nota sobre `ELECTRON_RUN_AS_NODE` en `README.md` si se ejecuta dentro
de un entorno que ya define esa variable (como el entorno de desarrollo de
este mismo agente) — sin quitarla, Electron corre como Node.js plano y la
ventana nunca llega a abrirse.

## 5. Cómo compilarlo

```bash
npm run build
```

Corre `tsc --noEmit` sobre main/preload y sobre renderer, y solo si ambos
pasan limpio continúa con `electron-vite build` + `electron-builder --win`.

## 6. Pruebas realizadas

### Automatizadas
- `npx vitest run` → **5/5 pruebas pasando**:
  - `migrationRunner.test.ts`: aplica ambas migraciones una vez, confirma
    idempotencia en una segunda corrida, verifica que las 4 tablas existen.
  - `iconLibraryRepository.test.ts` (3 pruebas): crear/favoritear/etiquetar/
    listar, búsqueda de duplicados por hash, paginación y filtro por texto.
  - `ipcContract.test.ts`: compara estáticamente cada canal invocado desde
    el preload contra cada canal registrado en `main/ipc/handlers/*` — deben
    coincidir exactamente (detecta un canal renombrado/mal escrito en
    cualquiera de los dos lados sin necesidad de levantar Electron).
- `npx tsc --noEmit` (main/preload y renderer por separado): **0 errores**.

### Manuales / end-to-end
- `npm run dev` levantado con éxito (una vez corregido el problema de
  `ELECTRON_RUN_AS_NODE`, ver limitaciones). Captura de pantalla confirmando:
  tema oscuro, barra de título personalizada, sidebar con los 24 módulos
  agrupados (Contenido/Herramientas/Sistema), docking funcional con el tab
  "Objetos" abierto mostrando el placeholder.
- **Flujo de creación de proyecto probado en vivo**: se creó un proyecto real
  (`MiProyectoKGPS`) a través de la pantalla de bienvenida. Verificación
  directa del archivo `data.sqlite` resultante:
  - Las 5 tablas esperadas existen (`schema_migrations`, `sqlite_sequence`,
    `change_log`, `icons`, `icon_tags`).
  - Ambas migraciones quedaron registradas en `schema_migrations`.
  - `PRAGMA journal_mode` devuelve `wal` (modo crash-safe activo).
- `npm run build` generó `dist/kingdomgps-editor Setup 0.1.0.exe` (~96 MB,
  instalador NSIS) y `dist/win-unpacked/` sin errores.

### No cubierto manualmente en esta sesión
- Prueba de recuperación forzando un cierre a mitad de escritura (matar el
  proceso y reabrir) — la lógica está implementada e independientemente
  cubierta por el hecho de que WAL + `integrity_check` son mecanismos
  estándar de SQLite/libSQL, pero no se ejecutó el escenario de fallo real.
- Interacción manual con todos los controles de la biblioteca de iconos
  (import, tags, favoritos, resize) — se validó su lógica de datos vía las
  pruebas de repository, pero no hay una sesión de clicks registrada.

## 7. Errores o limitaciones pendientes

- **`ELECTRON_RUN_AS_NODE`**: si esta variable de entorno está definida (como
  ocurre en el entorno de este agente), Electron se ejecuta como Node.js
  plano y `electron.app`/`electron.protocol` no existen — el proceso principal
  revienta al arrancar. No es un bug del editor; documentado en el README con
  el workaround (`env -u ELECTRON_RUN_AS_NODE npm run dev`).
- El bundle del renderer (~1.9 MB sin comprimir) no tiene code-splitting
  todavía. Aceptable ahora (poco contenido real); revisar al añadir módulos.
- `npm audit` reporta 17 vulnerabilidades en dependencias transitivas de
  herramientas de build (`electron-builder` y su cadena), no en código de
  producción. Pendiente de revisión antes de un release público; no se
  corrigió automáticamente para evitar cambios silenciosos con `--force`.
- Redo/undo cubre únicamente las mutaciones del módulo de Biblioteca de
  Iconos (favorito, tags) porque es el único módulo con mutaciones reales en
  esta fase. `CommandBus` está diseñado para que cada módulo de contenido
  registre sus propias mutaciones en Fase 2+ siguiendo el mismo patrón.
- La reconciliación de "rescan" de la biblioteca de iconos detecta archivos
  nuevos en `assets/icons/`, pero no detecta archivos borrados manualmente
  del disco (no elimina su fila en la base de datos). Razonable para Fase 1;
  a revisar si se vuelve un problema real de flujo de trabajo.
- No se firmó el instalador (`signtool` corrió en modo "no signing info
  identified, signing is skipped") — normal en desarrollo, pendiente de
  certificado de firma de código antes de distribuir a terceros.

## 8. Plan exacto de la Fase 2

**Objetivo**: implementar el módulo **Objetos** completo, como patrón de
referencia que luego se replica para los 21 módulos de contenido restantes.

1. **Esquema**: migración `003_items.sql` con la tabla `items` (todos los
   campos ya especificados: nombre, descripción, categoría, rareza, valor,
   peso, stack, durabilidad, vida, comida, mana, nivel/profesión requerida,
   tipo de arma/armadura, bonificaciones, scripts, flags, checks) + índices
   en `category`, `rarity`, `name` (y FTS5 para búsqueda de texto si el
   volumen lo justifica).
2. **Repository**: `ItemsRepository` implementando `Repository<Item>` sobre
   Kysely, sin SQL específico de dialecto.
3. **IPC**: `main/ipc/handlers/items.ts` con `items:list/get/create/update/
   delete/bulkUpdate`, registrado en `registerAllHandlers`. Ampliar
   `shared-types/api.ts` con el contrato `items`.
4. **Store + hooks** en el renderer (`modules/items/store`, `hooks/useItems`),
   siguiendo el patrón ya usado en `icon-library`.
5. **UI**: rejilla central estilo RPG Maker (casilla = icono + ID + nombre +
   rareza) con virtualización (`react-window`), alta automática al crear,
   tres vistas (casillas/lista/tabla), selección múltiple y edición masiva en
   el Inspector. El Inspector consume el `IconPicker` de la Biblioteca de
   Iconos (drag&drop) ya construida en Fase 1.
6. **Undo/redo**: registrar en `CommandBus` cada creación/edición/borrado de
   ítem, siguiendo el mismo patrón before/after usado para favoritos/tags.
7. **Exportador**: `ItemsJsonExporter` (reutilizando la interfaz `Exporter`)
   hacia `export/items.json`.
8. **Pruebas**: repository (vitest, igual que `iconLibraryRepository.test.ts`)
   + actualizar `ipcContract.test.ts` (ya es genérico, no necesita cambios) +
   una prueba de exportación.
9. **Cierre de fase**: mismo gate que la Fase 1 — `tsc --noEmit` limpio, cero
   errores de consola, `npm run build` exitoso, pruebas verdes, y verificación
   manual de la rejilla + Inspector + export en la app real.

No se avanza a Objetos ni a ningún otro módulo hasta recibir confirmación
explícita, según lo acordado.
