# Administrador de Referencias y Borrado Seguro

## Objetivo

Evitar que el Panel ADM rompa el juego cuando se elimina, reemplaza o modifica contenido que está siendo usado por otros módulos.

El sistema debe permitir saber, antes de borrar cualquier elemento, dónde se utiliza y ofrecer opciones seguras.

## Contenido que debe rastrearse

El Administrador de Referencias debe funcionar al menos con:

- Tiendas.
- NPC.
- Diálogos.
- Misiones.
- Enemigos.
- Objetos.
- Armas.
- Armaduras.
- Cofres.
- Tablas de loot.
- Recursos.
- Rutas de enemigos.
- Pines y zonas del mapa.

## Ejemplo

Si se intenta eliminar la tienda `Farmacia Central`, el panel debe mostrar:

- 12 pines del mapa la usan.
- 3 NPC comerciantes la usan.
- 2 misiones la usan.
- 1 evento la usa.

No se permite borrar directamente sin resolver esas referencias.

## Acciones disponibles

### Reemplazar referencias

Permite seleccionar otra tienda, NPC, misión, diálogo o recurso del mismo tipo.

Todas las referencias cambian al nuevo elemento en una sola operación.

### Desvincular referencias

Mantiene los pines o módulos, pero elimina la relación con el contenido borrado.

Los elementos desvinculados deben quedar marcados con estado `requiere_configuracion`.

### Eliminar referencias dependientes

Solo para operadores avanzados.

Debe mostrar exactamente qué elementos también serán eliminados antes de confirmar.

### Cancelar

No modifica nada.

## Inspector de referencias

Cada módulo tendrá una pestaña llamada `Usado por`.

Ejemplos:

- Una tienda muestra todos los pines y NPC que la usan.
- Un diálogo muestra todos los NPC y misiones que lo usan.
- Un enemigo muestra rutas, zonas y misiones donde aparece.
- Un objeto muestra tiendas, loot, recompensas y recetas donde se utiliza.

## Requisitos técnicos

- Las referencias deben usar identificadores estables, nunca nombres.
- El borrado debe ejecutarse dentro de una transacción.
- Antes de borrar, se ejecuta una consulta de impacto.
- Toda sustitución debe registrarse en el historial.
- Debe existir undo/redo para reemplazos y desvinculaciones.
- No debe permitirse dejar referencias rotas silenciosamente.

## Estados visuales

- Verde: referencia válida.
- Amarillo: contenido incompleto o sin publicar.
- Rojo: referencia rota.
- Gris: contenido desactivado.

## Integración con el mapa

Cuando un pin tenga una referencia rota:

- Mostrar un icono de advertencia sobre el marcador.
- Mostrar el motivo en el inspector.
- Deshabilitar `Publicar` hasta resolverlo.
- Permitir reasignar el contenido desde el mismo inspector del mapa.

## Validación antes de publicar

Antes de exportar o publicar el mundo, el Panel ADM debe comprobar:

- Pines sin contenido asignado.
- NPC sin diálogo ni acción.
- Tiendas sin catálogo.
- Misiones con pasos rotos.
- Enemigos inexistentes en rutas.
- Cofres sin tabla de recompensas.
- Referencias a elementos eliminados.

Si existen errores críticos, la publicación se bloquea y se muestra una lista navegable para corregirlos.

## Primera fase recomendada

1. Crear un servicio central `ReferenceService`.
2. Implementar consulta `getReferencesTo(type, id)`.
3. Añadir pestaña `Usado por` en Tiendas, NPC, Misiones y Enemigos.
4. Proteger primero el borrado de tiendas y NPC.
5. Integrar advertencias visuales en los pines del mapa.
6. Añadir validación de referencias antes de exportar `world.json`.
