# SIGUIENTE PASO — Punto de retorno de Kingdom GPS Editor

> Documento de continuidad. Léelo primero al retomar el proyecto y mantenlo actualizado al final de cada sesión.
> Última actualización: 2026-07-11 (sesión: integración de parche + menú contextual + pines Tienda y NPC).

## Qué es

Editor de escritorio interno para crear y mantener contenido de **Kingdom GPS**.
Stack: Electron + React + TypeScript + Vite + libSQL/Kysely + Zustand + dockview + Leaflet + Tailwind + Vitest.

## Repositorio y documentación

- Repositorio oficial: `randyraulbr1/kingdom-gps-editor`, rama `main`.
- Documentación oficial: carpeta `panel adm/`.
- Estado detallado del código: `INFORME_ESTADO_PROYECTO.md`.

## Advertencia importante

Los documentos `14_...` a `28_...` describen especificaciones aprobadas para mapa, pines, rutas, tiendas, NPC, monstruos, loot, recursos, validación, capas, propiedades y menú tipo PC. **Esos documentos no significan que la función ya esté implementada en el programa.**

No marcar una característica como terminada hasta que exista código, pruebas y verificación en Windows.

## Código confirmado en GitHub

- Infraestructura de proyectos, base de datos, IPC, exportadores y undo/redo.
- Biblioteca de iconos.
- Módulo Objetos (sobre el framework de contenido genérico).
- Módulo Armas (undo/redo + export).
- Módulo Armaduras (migración `007_armor`, undo/redo + export).
- Editor de Mundo con Leaflet, entidades, zonas, importación OpenStreetMap y exportación de mundo.
- **Menú contextual estilo PC** del Editor de Mundo (copiar/cortar/pegar/duplicar/Propiedades + atajos).
- **Pin Tienda funcional** (ficha con catálogo local + simulador de compra).
- **Pin NPC funcional** con **diálogos como nodos conectados** (opciones + efectos),
  **misiones con pasos que apuntan a pines del mapa**, validación de referencias
  rotas, indicadores `!`/`?`/🛒 y previsualización que recorre el diálogo.
- **Pin Monstruo funcional** (doc 21): stats, distancias GPS, tabla de loot, spawn,
  IA de 4 estados y simuladores de IA y loot.
- **Pin Cofre/Loot funcional** (doc 22): tabla de loot compartida + monedas/experiencia,
  condiciones (radio, nivel, misión requerida, uso único/repetible) y simulador de apertura.
- **Pin Recurso funcional** (doc 23): cantidad, rareza, herramienta/nivel, radio, respawn,
  modo de disponibilidad y simulador de recolección.
- **Rutas de enemigos** (doc 14): dibujo de polilíneas rojas sobre el mapa, tabla propia
  en SQLite (`enemy_routes`, migración 008), inspector con lista ponderada de enemigos,
  modos de spawn y simulador de recorrido del jugador.
- **Validador del mundo** (doc 24): revisa pines, zonas y rutas; panel con resumen y lista
  filtrable, "ir al elemento", y bloqueo de exportación si hay errores críticos.
- **Capas, filtros y búsqueda** (doc 26): búsqueda global (nombre/tipo/ID) con navegación,
  panel de capas con contadores y bloqueo de arrastre por tipo.
- **Administrador de referencias y borrado seguro** (doc 19): "usado por" en el inspector,
  aviso ⚠ sobre pines con referencia rota, y borrado seguro que desvincula antes de eliminar.
- **Mejoras del mapa**: más zoom (overzoom hasta z22), escaneo OSM ampliado a 19 categorías
  (restaurantes, cafeterías, bancos, escuelas, hoteles, parques, agua…) con conteo por tipo
  y botones Todo/Ninguno para elegir qué crear.
- Script `actualizar.bat` para actualizar y verificar la copia local en Windows con un doble clic.

## Trabajo completado en esta sesión

### Prioridad 0 — parche de Claude: INTEGRADO ✅

- Parche `b10849d` aplicado: Armas (undo/redo + export), módulo Armaduras nuevo
  (migración `007_armor`) y Objetos migrado al framework de contenido genérico.
- Verificado en este entorno: `npm run typecheck` limpio, **61/61 pruebas Vitest**,
  y `electron-vite build` (main + preload + renderer) correcto.
- Pendiente en Windows: `electron-builder --win` (empaquetado `.exe`, requiere
  Windows/Wine) y la comprobación visual de que Armas/Armaduras/Objetos aparecen
  y funcionan en la app empaquetada.

### Prioridad 1 — Editor de Mundo

1. **Menú contextual corregido** ✅ (docs 25 y 28):
   - un clic derecho nuevo reemplaza al anterior y se reposiciona;
   - nunca queda cortado: voltea y además se fija dentro del panel, con scroll si es alto;
   - se cierra con clic fuera y con Escape;
   - acciones tipo PC: Copiar, Cortar, Pegar aquí, Duplicar, Activar/Desactivar,
     Eliminar y **Propiedades siempre al final**;
   - portapapeles interno del editor (copiar/cortar/pegar) con clon profundo y tests;
   - atajos: `Ctrl+C/X/V/D`, `Supr`, `Alt+Enter`; aviso efímero de copiado/pegado.
2. **Pin Tienda funcional** ✅ (doc 17, fase A): config en `properties.shop`
   (tipo, radio, estado, catálogo), `ShopModal` con pestañas Resumen/Catálogo/
   Probar, abrir desde menú/inspector/doble clic, simulador de compra. Con tests.
3. **Pin NPC funcional** ✅ (doc 20): config en `properties.npc` (identidad,
   acción, radio, diálogo, misión), `NpcModal` con pestañas Identidad/Diálogo/
   Misión/Probar, indicadores visuales sobre el marcador. Con tests.
4. **Diálogos como nodos conectados** ✅ (doc 20): grafo de nodos con opciones y
   efectos (iniciar/avanzar/completar misión, abrir tienda, entregar objeto,
   cerrar), migración desde líneas simples, validación de enlaces rotos, editor
   de grafo y previsualización que recorre el diálogo. En `content/dialogueGraph.ts`.
5. **Misiones con pasos conectados al mapa** ✅ (docs 08, 20): la misión del NPC
   tiene pasos ordenados; cada paso puede apuntar a un pin del mapa (`targetWorldId`)
   con selector, y se valida que el pin objetivo exista. En `content/npcConfig.ts`.
6. **Pin Monstruo funcional** ✅ (doc 21): config en `properties.enemy` (stats,
   distancias GPS, tabla de loot, spawn), `EnemyModal` con pestañas Estadísticas/
   GPS/Loot/Spawn/Probar, IA de 4 estados con tolerancia GPS y simulador de loot,
   validaciones (ataque>persecución, tiempos inválidos, etc.). En `content/enemyConfig.ts`.
7. **Pin Cofre/Loot funcional** ✅ (doc 22): primitivas de loot extraídas a
   `content/lootTable.ts` (compartidas con Monstruo, sin duplicar), config en
   `properties.chest` (loot + monedas + exp + radio + nivel + misión requerida +
   uso único/repetible + reparto personal/compartido), `ChestModal` con pestañas
   Recompensa/Loot/Condiciones/Probar y simulador de apertura (rango/nivel/doble
   apertura) + cálculo de recompensa. En `content/chestConfig.ts`.
8. **Pin Recurso funcional** ✅ (doc 23): config en `properties.resource` (nombre,
   categoría, rareza, cantidades, probabilidad, herramienta/nivel requeridos,
   tiempos, radio, máx usos, modo de disponibilidad), `ResourceModal` con pestañas
   Recurso/GPS y respawn/Probar, simulador de recolección (rango/nivel/herramienta/
   inventario/usos) y validaciones. En `content/resourceConfig.ts`.
9. **Rutas de enemigos** ✅ (doc 14, Fases A-C locales): tabla propia `enemy_routes`
   (migración 008) con repositorio, IPC, preload y servicio; se dibuja una polilínea
   roja con clic izquierdo (mín. 2 puntos), se cierra con doble clic / botón Finalizar
   o se cancela con Escape; `RouteModal` (Ruta/Enemigos/Activación/Simular) con lista
   ponderada de enemigos, modos de spawn y simulador de recorrido. Lógica pura en
   `content/enemyRoute.ts` (longitud, peso, validación, simulación) con tests.
10. **Validador del mundo** ✅ (doc 24, Fase A): `content/worldValidator.ts` reúne los
    avisos de todos los tipos (tienda sin catálogo, NPC sin diálogo, monstruo/cofre/
    recurso inválidos, ruta sin enemigos, zona inválida, coordenadas, duplicados) con
    severidad error/aviso/info; `WorldValidatorPanel` muestra resumen (%válido) y lista
    filtrable con "Ir al elemento"; **la exportación se bloquea si hay errores críticos**.
    Con tests. Pendiente (fases siguientes): corrección automática, versionado y rollback.
11. **Capas, filtros y búsqueda** ✅ (doc 26, parte): `content/mapSearch.ts` (búsqueda
    global por nombre/tipo/ID de pines, zonas y rutas, con tests) + `MapSearchBar`
    (dropdown de resultados que centra el mapa y abre la ficha); `LayersPanel` con
    contador por tipo y **bloqueo de capa** (impide arrastrar los marcadores de ese
    tipo). Pendiente: filtros combinables avanzados, aislamiento, clustering y
    selección múltiple con acciones masivas.
12. **Administrador de referencias y borrado seguro** ✅ (doc 19, Fase 1):
    `content/referenceService.ts` (lógica pura, con tests) resuelve "¿quién usa
    este pin?" (`getReferencesTo`), detecta referencias rotas y desvincula. El
    inspector muestra **"Usado por"**; los marcadores con referencia rota llevan
    un **⚠**; y **borrar un pin referenciado avisa y desvincula** las referencias
    (nunca las deja rotas). Relaciones actuales: pasos de misión de NPC y misión
    requerida de cofre (extensible). Pendiente: reemplazar referencia y undo/redo
    de la desvinculación.

> Nota de honestidad: todo lo anterior está implementado en código, persiste y
> pasa typecheck/tests/build en este entorno (74/74 pruebas). **Falta la
> verificación visual en el Windows del usuario** (arrastre real, apertura de
> modales, recorrido del diálogo, persistencia tras cerrar/abrir proyecto). No
> considerar 100% cerrado hasta esa prueba.

## Lo que falta realmente en código

### Prioridad 1 (resto) — Editor de Mundo

- Inspector unificado con pestañas (doc 27): hoy el inspector lateral es básico
  y las fichas de Tienda/NPC viven en modales; falta unificar en un panel de
  propiedades con pestañas General/Configuración/Interacciones/Referencias/Historial.
- Selección múltiple y "Pegar especial" del doc 28 (hoy: 1 elemento a la vez).

### Prioridad 2 — módulos necesarios para el mapa (siguiente foco)

1. ✅ Diálogos como nodos conectados (hecho: grafo con opciones/efectos).
2. ✅ Misiones con pasos conectados al mapa (hecho: pasos con pin objetivo).
   Pendiente de profundizar: cadenas de misiones entre varios NPC y persistencia
   del progreso (requiere módulo de misiones dedicado / servidor).
3. ✅ Monstruos: combate simple + loot desde el mapa (doc 21) (pin enemigo con IA
   local y loot; falta ruta roja de enemigos y combate compartido real → servidor).
4. ✅ Loot, recompensas y cofres (doc 22) (pin Cofre con loot/monedas/exp y
   simulador; falta módulo de tablas de loot reutilizables con "usado por" → doc 22 completo).
5. ✅ Recursos, recolección y respawn (doc 23) (pin Recurso con simulador; falta
   sugerencia desde OSM por etiquetas y catálogo central de recursos).
6. ✅ Rutas de enemigos y spawn por zona (doc 14, local) (polilíneas rojas +
   inspector + simulador; falta combate compartido real y validación geográfica → servidor).

### Prioridad 3 — sistemas de seguridad del editor

- ✅ Administrador de referencias y borrado seguro (doc 19, Fase 1) — "usado por",
  aviso de rotas y desvincular al borrar; falta reemplazar referencia y undo/redo.
- ✅ Validador del mundo antes de publicar (doc 24, Fase A) — hecho; falta corrección
  automática, versionado y rollback.
- ✅ Capas, filtros y búsqueda (doc 26, parte) — búsqueda global + capas con contador/
  bloqueo; falta filtros combinables, aislamiento, clustering y selección múltiple.
- Panel de propiedades unificado (doc 27).

## Criterio de terminado

Una función solo se marca como hecha cuando:

- está implementada en código;
- tiene persistencia;
- tiene undo/redo cuando corresponde;
- tiene pruebas;
- pasa typecheck y build;
- fue probada visualmente en el programa de Windows;
- se actualizó documentación y roadmap.

## Próxima tarea recomendada

**Con los pines y las rutas ya funcionales, la Prioridad 2 del mapa está esencialmente
cubierta en local; el validador (doc 24) y la búsqueda/capas (doc 26) ya están.**
Lo siguiente natural: el **panel de propiedades unificado (doc 27)** — un inspector
con pestañas (General/Configuración/Interacciones/Referencias/Historial) que agrupe
lo que hoy vive en modales separados. También queda profundizar el validador
(corrección automática, versionado, rollback), el doc 19 (reemplazar referencia +
undo/redo) y los filtros/aislamiento/clustering del doc 26. El patrón probado se
mantiene. Regla del proyecto:
no avanzar al siguiente pin hasta que el anterior tenga typecheck limpio, tests
verdes y build correcto. Antes de darlo por cerrado, pedir al usuario la
verificación visual en Windows.

## Cómo actualizar la copia local (Windows)

Ejecutar `actualizar.bat` (doble clic) en la carpeta del proyecto: hace
`git pull` de la rama de trabajo, `npm install`, `npm run typecheck`, `npm test`
y `npm run build`. Al terminar sin errores, abrir con `npm run dev`.

## Comandos de comprobación en el PC

```bash
npm run typecheck
npm test
npm run build   # el empaquetado .exe requiere Windows/Wine
```
