# Kingdom GPS — Editor

Herramienta de desarrollo interna para el MMORPG **Kingdom GPS**. No es el
juego: es el editor con el que el equipo crea y mantiene todo el contenido
(objetos, NPCs, mapas, misiones, iconos, etc.) y lo exporta para el servidor.

Estado actual: **Fase 2 — módulo Objetos, más Editor de Mundo**. El shell, la
biblioteca de iconos y toda la infraestructura (proyectos, base de datos,
IPC, undo/redo, exportadores) de la Fase 1 están completos y funcionando. El
módulo **Objetos** es el patrón de referencia totalmente funcional (rejilla,
lista, tabla, Inspector, edición masiva, undo/redo, exportación). El
**Editor de Mundo** (mapa GPS real con Leaflet, en Herramientas) también está
completo y persistido. Los 20 módulos de contenido restantes (Armas, NPCs,
...) siguen siendo placeholders a la espera de repetir el patrón de Objetos.

## Requisitos

- Windows 10/11
- Node.js 20 o superior (probado con Node 24)
- No requiere Visual Studio Build Tools ni ningún compilador C++: todas las
  dependencias nativas (`sharp`, `libsql`) usan binarios precompilados.

## Instalar

```bash
cd KingdomGPS/editor
npm install
```

## Ejecutar en desarrollo

```bash
npm run dev
```

Abre la app con hot-reload. La primera vez verás la pantalla de bienvenida:
crea un proyecto nuevo (elige una carpeta) o abre uno existente.

> **Nota para quien ejecute esto dentro de un runner/CI/agente que ya corre
> sobre Electron (como este mismo entorno de desarrollo):** si la variable de
> entorno `ELECTRON_RUN_AS_NODE` está definida, Electron se ejecuta como
> Node.js plano y `electron.app`/`electron.protocol` no estarán disponibles.
> Quítala antes de levantar el editor: `env -u ELECTRON_RUN_AS_NODE npm run dev`
> (PowerShell: `Remove-Item Env:ELECTRON_RUN_AS_NODE; npm run dev`).

## Verificar tipos y pruebas

```bash
npm run typecheck   # tsc --noEmit sobre main/preload y renderer
npm test            # vitest: migraciones, repository de iconos, contrato IPC
```

## Compilar el instalador de Windows

```bash
npm run build
```

Genera `dist/kingdomgps-editor Setup <version>.exe` (instalador NSIS) y
`dist/win-unpacked/` (versión sin empaquetar). El build corre `tsc --noEmit`
en ambos procesos antes de empaquetar, así que no produce un instalador si hay
errores de tipos.

## Estructura del proyecto

```
KingdomGPS/
  editor/                 este paquete
    src/
      main/                proceso principal de Electron
        data/               DataSource (Kysely + libSQL) y Repository base
        database/           schema.ts, migraciones versionadas, migrationRunner
        projects/           ProjectManager, backups, recuperación ante fallos
        modules/             (reservado para registro de módulos en el main)
        ipc/                 registro de canales IPC, un handler por dominio
        icons/               servicio de biblioteca de iconos (fs + sharp)
        items/               ItemsRepository (patrón de referencia de contenido)
        worldEditor/          WorldEntityRepository (mapa GPS real, ver INFORME_EDITOR_DE_MUNDO.md)
        export/              Exporter, registro de exportadores, exportadores concretos
        commands/            changeLog (historial) + commandBus (undo/redo)
      preload/               puente contextBridge -> window.api
      renderer/
        src/
          app/                shell: bienvenida, layout, sidebar, docking
          modules/             un folder por módulo (plugin), + registry.ts
          shared/              componentes, tema, stores globales, cliente IPC
      shared-types/          contratos TypeScript compartidos por los 3 procesos
    assets/icons/           biblioteca de iconos fuente (vacía en el repo)
    export/                 salida de las exportaciones (JSON, etc.)
  client/                   placeholder — el juego del jugador (fase futura)
  server/                   placeholder — el servidor del juego (fase futura)
```

## Arquitectura — decisiones clave

- **Electron + React + TypeScript + Vite (`electron-vite`)**: herramienta
  interna, no una app de distribución masiva; el ecosistema de docking/paneles
  y de acceso a filesystem es más maduro que en Tauri para este caso de uso.
- **libSQL (`@libsql/client`) + Kysely en vez de `better-sqlite3`**: esta
  máquina no tenía el toolchain de compilación C++ de Visual Studio instalado
  y `better-sqlite3` requiere compilar un addon nativo. libSQL publica
  binarios precompilados para Windows x64 y es 100% compatible con el
  dialecto SQLite de Kysely, así que no hubo que tocar ningún repository.
  Adicionalmente, libSQL/Turso soporta réplicas y sincronización remota de
  forma nativa, lo que deja la puerta abierta a sincronizar el proyecto a un
  servidor en el futuro sin cambiar de motor.
- **Kysely como capa de datos desacoplada**: los repositories nunca escriben
  SQL específico de un dialecto; migrar a Postgres/MySQL más adelante implica
  cambiar el dialecto en `createDataSource` (`src/main/data/DataSource.ts`) y
  ajustar migraciones puntuales, no reescribir módulos.
- **Módulos como plugins**: cada módulo (contenido, herramientas o sistema)
  declara su propio `ModuleDefinition` (`id`, `nombre`, `icono`, `panel`,
  capacidades, atajos...). Los registries (`renderer/src/modules/registry.ts`)
  son los únicos archivos que conocen la lista completa; añadir un módulo no
  requiere tocar el Sidebar ni el shell.
- **Undo/redo + autoguardado**: toda mutación pasa por `CommandBus`, que
  registra un `ChangeLogEntry` (antes/después) en la tabla `change_log`. Esa
  misma tabla sirve de historial persistente del proyecto — no es solo una
  pila en memoria que se pierde al reiniciar.
- **Biblioteca de iconos real**: escaneo recursivo de carpetas, deduplicado
  por hash SHA-256, conversión/redimensionado con `sharp`, tags, favoritos,
  categorías y protocolo `kgps-icon://` para servir los archivos al renderer
  sin exponer rutas absolutas del sistema de archivos.
- **Editor de Mundo (mapa GPS real)**: Kingdom GPS es un juego de ubicación
  real, así que el mapa usa teselas reales de OpenStreetMap vía
  `react-leaflet` (no un mapa inventado). Las entidades del mundo (NPCs,
  enemigos, cofres, zonas...) se persisten en SQLite con un id ULID
  generado en el cliente, pensado para sobrevivir sin cambios a una futura
  sincronización con servidor (Fase C, todavía no implementada — los
  handlers de publish/sync son stubs documentados).

## Módulos de contenido

- **Objetos** — completo (Fase 2): rejilla/lista/tabla, Inspector con todos
  los campos, selección múltiple + edición masiva, undo/redo, exportación a
  `export/items.json`. Es el patrón de referencia para el resto.
- Pendientes (mismo patrón, una fase por delante): Armas, Armaduras,
  Herramientas, Recursos, Comida, Cultivos, Construcciones, NPC, Monstruos,
  Loot, Misiones, Diálogos, Mapas, Economía, Fabricación, Recetas,
  Profesiones, Animales, Mascotas, Eventos, Configuración.

Ver `INFORME_FASE_1.md`, `INFORME_FASE_2.md` e `INFORME_EDITOR_DE_MUNDO.md`
para el detalle de cada uno.

## Documentación oficial

La documentación de diseño, arquitectura y roadmap del proyecto vive en
**[`panel adm/`](panel%20adm/README.md)** (dentro de este repositorio, junto al
código). Es la **única fuente de verdad**; el antiguo repositorio `tcodm-web`
queda obsoleto para documentación. Toda documentación nueva se crea en
`panel adm/`. Empieza por [`panel adm/00_ROADMAP.md`](panel%20adm/00_ROADMAP.md).

## Deuda técnica conocida

- El bundle del renderer (~2.4 MB sin comprimir, tras sumar Leaflet) no
  tiene code-splitting todavía — a revisar antes de sumar más módulos.
- `npm audit` reporta vulnerabilidades en dependencias transitivas de
  `electron-builder`/herramientas de build (no de código de producción);
  pendiente de revisión antes de un release público.
