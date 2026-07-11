# SIGUIENTE PASO — Punto de retorno de Kingdom GPS Editor

> Documento de continuidad. Léelo primero al retomar el proyecto y mantenlo actualizado al final de cada sesión.
> Última actualización: 2026-07-11.

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
- Módulo Objetos.
- Módulo Armas base.
- Editor de Mundo con Leaflet, entidades, zonas, importación OpenStreetMap y exportación de mundo.

## Trabajo de Claude pendiente de integrar

Claude informó un commit local `b10849d` con:

- Armas: undo/redo, exportación y pruebas.
- Armaduras: módulo nuevo y migración `007_armor`.
- Objetos migrado al framework genérico.
- 37 pruebas verdes y typecheck limpio.

Ese trabajo llegó como archivo `.patch`, pero el commit todavía no aparece integrado en `main`. No duplicar esas modificaciones antes de comprobar o aplicar el parche.

## Lo que falta realmente en código

### Prioridad 0 — integrar y verificar

1. Integrar el parche de Claude.
2. Ejecutar `npm run typecheck`, `npm test` y `npm run build` en Windows.
3. Confirmar que Armas, Armaduras y Objetos aparecen y funcionan.

### Prioridad 1 — Editor de Mundo

1. Corregir el menú de clic derecho:
   - un clic derecho nuevo reemplaza al anterior;
   - nunca queda cortado en los bordes;
   - se cierra con clic fuera y Escape;
   - muestra acciones según el elemento seleccionado.
2. Añadir acciones tipo PC: copiar, cortar, pegar aquí, duplicar y Propiedades.
3. Conectar el inspector de cada pin con contenido real.
4. Hacer funcional primero el pin Tienda.
5. Hacer funcional después el pin NPC.

### Prioridad 2 — módulos necesarios para el mapa

1. Tiendas y catálogos.
2. NPC.
3. Diálogos.
4. Misiones.
5. Monstruos.
6. Loot y cofres.
7. Recursos.

### Prioridad 3 — sistemas de seguridad del editor

- Administrador de referencias.
- Validador del mundo antes de publicar.
- Capas, filtros y búsqueda.
- Panel de propiedades unificado.

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

**Primero integrar el parche de Claude. Después corregir el menú contextual del Editor de Mundo y hacer que un pin de Tienda abra una tienda real.**

## Comandos de comprobación en el PC

```bash
npm run typecheck
npm test
npm run build
```
