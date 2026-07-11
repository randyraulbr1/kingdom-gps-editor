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
3. Monstruos: combate simple + loot desde el mapa (doc 21) — **siguiente**.
4. Loot, recompensas y cofres (doc 22).
5. Recursos, recolección y respawn (doc 23).
6. Rutas de enemigos y spawn por zona (doc 14).

### Prioridad 3 — sistemas de seguridad del editor

- Administrador de referencias y borrado seguro (doc 19).
- Validador del mundo antes de publicar (doc 24).
- Capas, filtros y búsqueda (doc 26).
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

**Continuar la Prioridad 2 por el pin Monstruo (doc 21) y luego Cofre/Loot (doc 22),**
reutilizando el mismo patrón ya probado con Tienda y NPC: modelo saneado en
`properties`, modal con pestañas, simulador local y tests. Regla del proyecto:
no avanzar al siguiente pin hasta que el anterior tenga typecheck limpio, tests
verdes y build correcto. Antes de darlo por cerrado, pedir al usuario la
verificación visual en Windows.

## Comandos de comprobación en el PC

```bash
npm run typecheck
npm test
npm run build   # el empaquetado .exe requiere Windows/Wine
```
