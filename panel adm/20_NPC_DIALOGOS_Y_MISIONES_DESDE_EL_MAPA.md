# NPC, diálogos y misiones desde el mapa

## Objetivo

Hacer que cada pin de tipo NPC abra una interacción real y configurable desde el Panel ADM. El pin no debe copiar datos del NPC: debe guardar referencias estables a contenido creado en los módulos NPC, Diálogos, Misiones y Tiendas.

## Flujo en el Editor de Mundo

1. Crear o seleccionar un pin.
2. Elegir `Tipo de pin: NPC`.
3. En el inspector mostrar selectores para:
   - NPC asignado.
   - Diálogo inicial.
   - Misión opcional.
   - Tienda opcional.
   - Radio de interacción GPS.
   - Condiciones de visibilidad.
4. Guardar las referencias.
5. Permitir `Probar interacción` sin publicar.

## Inspector del pin NPC

### Identidad

- NPC asignado.
- Nombre mostrado.
- Icono del pin.
- Estado activo/inactivo.

### Interacción

- Diálogo por defecto.
- Acción principal:
  - Hablar.
  - Entregar misión.
  - Continuar misión.
  - Completar misión.
  - Abrir tienda.
  - Curar.
  - Información.
- Acción secundaria opcional.

### GPS

- Radio para mostrar el pin.
- Radio para poder interactuar.
- Tolerancia GPS.
- Mensaje cuando el jugador está demasiado lejos.

### Condiciones

- Nivel mínimo y máximo.
- Misión previa requerida.
- Objeto requerido.
- Horario opcional.
- Visible solo para ciertos jugadores o zonas.

## Comportamiento en el juego

Al tocar el pin:

1. El cliente solicita la interacción al servidor.
2. El servidor valida distancia, estado del NPC y condiciones.
3. Devuelve la acción disponible.
4. El juego abre el diálogo, misión o tienda correspondiente.
5. Las recompensas y cambios de misión siempre se validan en servidor.

## Diálogos

Cada diálogo puede tener:

- Texto.
- Retrato o icono.
- Opciones de respuesta.
- Condiciones por opción.
- Efectos:
  - iniciar misión,
  - avanzar paso,
  - completar misión,
  - abrir tienda,
  - entregar objeto,
  - quitar objeto,
  - cambiar reputación,
  - cerrar diálogo.

Los diálogos deben ser nodos conectados. El editor mostrará líneas entre respuestas y siguientes nodos para evitar rutas rotas.

## Misiones

El NPC puede estar conectado a:

- Una misión principal.
- Varias misiones secundarias.
- Un paso específico de una cadena.

Estados visuales sugeridos sobre el pin:

- `!` misión disponible.
- `?` misión lista para entregar.
- punto gris: diálogo sin misión.
- carrito: NPC comerciante.

## Asignación rápida

Botón `Crear y asignar` para:

- Crear NPC nuevo.
- Crear diálogo nuevo.
- Crear misión nueva.
- Crear tienda nueva.

El contenido se guarda en su módulo correspondiente y queda seleccionado automáticamente en el pin.

## Validaciones

Bloquear publicación si:

- El pin NPC no tiene NPC asignado.
- El diálogo inicial no existe.
- Una opción de diálogo apunta a un nodo eliminado.
- La misión asignada no existe.
- Un paso de misión apunta a un pin inexistente.
- La tienda opcional no tiene catálogo.

## Historial y referencias

La pestaña `Usado por` debe mostrar todos los pines que usan un NPC, diálogo o misión. Al borrar contenido, ofrecer:

- Reemplazar referencia.
- Desvincular.
- Cancelar.

Todas las asignaciones deben soportar undo/redo.

## Pruebas mínimas

1. Crear NPC.
2. Crear diálogo.
3. Crear misión.
4. Crear pin NPC.
5. Asignar contenido.
6. Probar interacción local.
7. Mover el pin y comprobar persistencia.
8. Cerrar y abrir el proyecto.
9. Exportar y verificar referencias.
10. Eliminar una referencia y comprobar aviso de error.

## Prioridad de implementación

1. Selector de NPC en el inspector del pin.
2. Selector de diálogo.
3. Botón `Probar interacción`.
4. Selector de misión.
5. Indicadores visuales `!` y `?`.
6. Validación de referencias.
7. Tienda opcional para NPC comerciantes.
