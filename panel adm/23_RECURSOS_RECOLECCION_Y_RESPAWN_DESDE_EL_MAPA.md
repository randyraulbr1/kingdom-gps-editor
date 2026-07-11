# Recursos, recolección y respawn desde el mapa

## Objetivo

Convertir los pines de recursos del Editor de Mundo en entidades funcionales, conectadas al módulo de Recursos y listas para usarse en el juego GPS.

## Flujo desde el mapa

1. Clic derecho en el mapa.
2. Seleccionar **Crear recurso**.
3. Colocar el pin.
4. En el inspector elegir:
   - recurso existente,
   - cantidad mínima y máxima,
   - radio GPS de interacción,
   - tiempo de respawn,
   - si es personal o compartido,
   - límite de recolecciones por jugador.
5. Guardar.
6. Usar **Probar interacción** para simular la recolección.

## Configuración del recurso

Cada recurso debe permitir:

- Nombre.
- Icono.
- Categoría.
- Rareza.
- Cantidad mínima.
- Cantidad máxima.
- Probabilidad de obtención.
- Herramienta requerida opcional.
- Nivel mínimo opcional.
- Tiempo de recolección.
- Tiempo de respawn.
- Radio de interacción en metros.
- Máximo de usos antes de agotarse.

## Modos de disponibilidad

- **Personal:** cada jugador tiene su propio estado.
- **Compartido:** si un jugador lo recoge, desaparece para todos hasta el respawn.
- **Por grupo cercano:** jugadores dentro del radio comparten el mismo nodo.
- **Uso único:** desaparece de forma permanente después de recogerlo.

## Estado visual del pin

- Disponible.
- En proceso de recolección.
- Agotado.
- En respawn.
- Error de sincronización.

El mapa debe mostrar un indicador visible cuando el recurso todavía no se haya sincronizado con el servidor.

## Recolección segura

El servidor debe validar:

- distancia real del jugador,
- disponibilidad del nodo,
- herramienta requerida,
- capacidad del inventario,
- nivel mínimo,
- que la misma operación no se procese dos veces.

## Lugares reales de OpenStreetMap

Dentro de una zona se podrán sugerir pines de recursos según etiquetas reales cuando tenga sentido, por ejemplo:

- `natural=wood` o parques -> madera y plantas,
- agua o fuentes -> recursos de agua,
- zonas agrícolas -> cultivos,
- canteras o minas registradas -> piedra o mineral.

Estas sugerencias nunca deben publicarse automáticamente. El administrador debe revisar y aprobar cada grupo antes de crear los pines.

## Inspector del pin

Debe mostrar:

- Recurso asignado.
- Cantidad.
- Radio.
- Respawn.
- Modo de disponibilidad.
- Estado de sincronización.
- Botones **Probar interacción**, **Mover**, **Duplicar**, **Desactivar** y **Eliminar**.

## Validaciones antes de publicar

Bloquear publicación si:

- el pin no tiene recurso asignado,
- el recurso referenciado fue eliminado,
- el respawn es inválido,
- la cantidad mínima supera la máxima,
- el radio es menor que la tolerancia GPS configurada.

## Historial y referencias

Cada recurso debe tener pestaña **Usado por** para listar:

- pines del mapa,
- recetas,
- tiendas,
- misiones,
- loot,
- eventos.

Toda modificación debe quedar registrada en el historial del proyecto y ser compatible con undo/redo.

## Pruebas mínimas

- Crear recurso desde clic derecho.
- Asignar un recurso existente.
- Recolectar dentro del radio.
- Bloquear fuera del radio.
- Validar inventario lleno.
- Comprobar respawn.
- Comprobar modo personal y compartido.
- Evitar doble entrega.
- Persistir al cerrar y abrir el editor.
