# ROADMAP - Panel ADM Kingdom GPS

> Este documento será la guía maestra del proyecto. Cada nueva idea aprobada se convertirá en una fase antes de implementarse.
>
> **Sincronizado con el código real el 2026-07-10** (ver `INFORME_ESTADO_PROYECTO.md`).
> Los estados reflejan lo que está implementado y funcionando, no solo lo planificado.

## Estado
- ✅ Completado
- 🟡 En desarrollo / parcial
- ⚪ Planificado

### FASE 0 - Arquitectura
✅ Definición de tecnologías
✅ Estructura del proyecto
✅ Documentación inicial

### FASE 1 - Núcleo del editor ✅ COMPLETA
✅ Electron + React + TypeScript
✅ SQLite (libSQL + Kysely, WAL, migraciones idempotentes)
✅ IPC (tipado punta a punta, verificado por prueba estática)
✅ Docking (dockview-react)
✅ Biblioteca de iconos (escaneo, tags, favoritos, dedup SHA-256, resize sharp)
➕ Extra hecho: ProjectManager (backups+recuperación), CommandBus/undo-redo persistente, exportadores

### FASE 2 - Editor de Objetos 🟡 CASI COMPLETA
✅ Base de datos de objetos (migración 003_items, ItemsRepository)
✅ Inventario visual (rejilla/lista/tabla virtualizada, es el patrón de referencia)
✅ Editor de propiedades (Inspector ~20 campos, edición masiva, undo/redo, export)
⚪ Generación de iconos IA (Recraft) — pendiente: cola `icon_generation_jobs`, token `.env`

### FASE 3b - Contenido en serie (framework + Armas + Armaduras) ✅ UNIFICADA
✅ Framework de contenido genérico `shared/content/` (ContentGrid/List/Table, toolbar, store y panel genéricos)
✅ Módulo **Armas** completo sobre el framework (migración 006_weapons, repo, IPC, inspector con daño/velocidad/alcance/crítico)
✅ Undo/redo para Armas (CommandBus: create/update/delete/bulkUpdate, `restoreWithId`, mismo patrón que Objetos)
✅ Exportación JSON para Armas (`export/weapons.json`, botón en la toolbar)
✅ Módulo **Armaduras** completo sobre el framework (migración 007_armor, repo, IPC, undo/redo, export JSON,
   inspector con defensa/resistencia mágica/slot) — reemplaza el placeholder anterior
✅ **Objetos migrado al framework de contenido** (antes tenía sus propios ContentGrid/List/Table/Toolbar/hook/store
   a mano; ahora usa `ContentModulePanel` + `createContentStore` + `useContentActions`, igual que Armas/Armaduras).
   `ItemQuery.category` pasó a `string` para ser compatible con `ContentQueryBase` (mismo ajuste que Weapon/Armor).
⚪ Repetir el patrón para los ~18 módulos restantes (Herramientas, Recursos, Comida, NPC, Monstruos, …)

### FASE 3 - Editor de Mundo 🟡 LOCAL COMPLETA (falta sync con servidor)
✅ Mapa (Leaflet + teselas reales; selector de estilo: oscuro/claro sin etiquetas, OSM, satélite)
✅ Vista recordada entre sesiones (estilo + centro + zoom)
✅ Capas (mostrar/ocultar por tipo)
✅ Marcadores (L.divIcon por tipo) con punto de estado de sincronización visible
✅ Inspector (nombre, tipo, posición, sync, habilitar, duplicar, eliminar)
✅ Menú contextual estilo PC (docs 25 y 28): crear pin/entidades, reposicionar con clic derecho,
   voltea y se fija dentro del panel (nunca queda cortado), Copiar/Cortar/Pegar aquí/Duplicar/
   Activar-Desactivar/Eliminar y Propiedades al final, portapapeles interno y atajos Ctrl+C/X/V/D, Supr, Alt+Enter
✅ Zonas: dibujar polígono, cerrar tocando el primer punto, y panel para renombrar/color/eliminar
✅ Importar lugares reales de OpenStreetMap dentro de una zona (farmacias/hospitales/gasolineras/supermercados)
✅ Exportar mundo (entidades + zonas) a `export/world.json` (botón + registro de exportadores)
✅ Sincronización local (persistido en SQLite: `004_world_entities`, `005_world_zones`, ULID)
✅ **Pin Tienda funcional** (doc 17, fase A): config en `properties.shop` (tipo, radio, estado, catálogo),
   ficha `ShopModal` con pestañas Resumen/Catálogo/Probar, abrir desde menú/inspector/doble clic, simulador de compra
✅ **Pin NPC funcional** (doc 20): config en `properties.npc` (identidad, acción, radio, diálogo, misión),
   ficha `NpcModal` con pestañas Identidad/Diálogo/Misión/Probar, indicadores `!`/`?`/🛒 sobre el marcador
✅ **Diálogos como nodos conectados** (doc 20): grafo de nodos con opciones y efectos
   (iniciar/avanzar/completar misión, abrir tienda, entregar objeto, cerrar), migración desde
   líneas simples, validación de enlaces rotos, editor de grafo y previsualización que recorre el diálogo
✅ **Misiones con pasos conectados al mapa** (docs 08, 20): pasos ordenados que apuntan a un pin
   (`targetWorldId`) con selector y validación de que el pin objetivo exista
✅ **Pin Monstruo funcional** (doc 21): stats, distancias GPS, tabla de loot, spawn, IA de 4 estados
   (idle/chasing/attacking/returning con tolerancia GPS), simuladores de IA y loot, validaciones
✅ **Pin Cofre/Loot funcional** (doc 22): loot compartido (`content/lootTable`) + monedas/exp,
   condiciones (radio, nivel, misión requerida, uso único/repetible, reparto), simulador de apertura
✅ **Pin Recurso funcional** (doc 23): cantidad/rareza, herramienta y nivel requeridos, radio, respawn,
   modo de disponibilidad (personal/compartido/grupo/uso único) y simulador de recolección
🟡 Verificación visual en Windows pendiente para Tienda/NPC/Diálogos/Monstruo/Cofre/Recurso (código + tests + build OK en CI)
⚪ Ruta roja de enemigos + spawn por zona (docs 14, 21) — dibujar polilíneas + combate compartido (servidor)
⚪ Módulos centrales reutilizables de loot/recursos con "usado por" y borrado seguro (docs 22, 23 completos)
⚪ Inspector unificado con pestañas (doc 27) — hoy inspector básico + modales por tipo
⚪ Cadenas de misiones entre varios NPC y persistencia del progreso (requiere módulo dedicado / servidor)
⚪ Cola `world_sync_jobs` + estados de sync avanzados (solo se maneja `local` de 10)
⚪ Sincronización remota (publish/retry/resolveConflict son stubs — requiere servidor)

### FASE 4 - Gestor de Sistemas ⚪ PENDIENTE (doc 04)
⚪ Versionado (versiones candidatas, nunca sobrescribir la activa)
⚪ Monaco Editor (NO instalado todavía — falta dependencia)
⚪ Diff / comparador visual
⚪ Rollback
⚪ Publicación con staging + adaptadores + feature flags

### FASE 5 - Laboratorio ⚪ PENDIENTE
⚪ Laboratorio de pruebas
⚪ Simulador de carga
⚪ Consola integrada

### FASE 6 - Herramientas ⚪ PENDIENTE
⚪ Editor visual de historias
⚪ IA para comportamiento de NPC
⚪ Editor de profesiones
⚪ Programador de eventos
⚪ Panel de economía
⚪ Buscador global
⚪ Analizador de dependencias
⚪ Wiki automática

### FASE 7 - Vista integrada del juego ⚪ PENDIENTE (doc 03)
⚪ WebContentsView cargando producción/local/URL
⚪ Controles (recarga, limpiar caché/SW, DevTools, capturas, viewport)
⚪ Consola integrada (logs/red/Service Worker)

### FASE 8 - Generador de misiones GPS ⚪ PENDIENTE (doc 08)
⚪ Importar TXT/YAML/JSON y crear cadenas
⚪ Pines numerados + líneas + arrastrar/reordenar en el mapa
⚪ Validación peatonal / accesibilidad + guardado y publicación

### FASE 9 - Zonas de juego por jugador ⚪ PENDIENTE (doc 12)
⚪ Polígonos por jugador (`play_areas`, `play_area_entities`)
⚪ Contenido validado dentro del área + cobertura pública
⚪ Solicitud desde el juego + aprobación + sync

### FASE 10 - Seguridad y auditoría de jugadores ⚪ PENDIENTE (doc 09, requiere servidor)
⚪ Perfiles + historial + libro contable inmutable
⚪ Detección de anomalías + puntuación de riesgo
⚪ Expedientes exportables

### FASE 11 - Ideas y feedback de jugadores ⚪ PENDIENTE (doc 10)
⚪ Formulario + activar/desactivar desde el panel
⚪ Bandeja de revisión + estados + conversión a roadmap
⚪ Votación opcional

### FASE 12 - Tops, clasificaciones y temporadas ⚪ PENDIENTE (doc 13, requiere servidor)
⚪ Tops permanentes y temporales (`leaderboards`, `seasons`, `snapshots`)
⚪ Cierre/reinicio seguro con snapshot histórico
⚪ Recompensas idempotentes + filtros regionales

### FASE FUTURA - Economía (doc 06)
⚪ Billeteras, mercado P2P, libro contable — explícitamente para más adelante

### Transversal - Guía de integración y calidad (doc 11)
🟡 Parcial: contratos en shared-types, IPC tipado, repositories, migraciones, tests
⚪ Falta: estructura por módulo (contracts/adapters/validators/README), feature flags,
   idempotencyKey, logs estructurados, eventos tipados con correlationId

## Regla del proyecto
Toda nueva idea deberá:
1. Documentarse.
2. Evaluarse.
3. Asignarse a una fase.
4. Implementarse solo cuando llegue su fase.

No se desarrollarán funciones fuera del roadmap salvo decisión explícita.
