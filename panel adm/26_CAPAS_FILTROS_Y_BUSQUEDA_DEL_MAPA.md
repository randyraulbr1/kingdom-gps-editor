# 26 — Capas, filtros y búsqueda del mapa

## Objetivo

Mantener el Editor del Mundo legible y rápido aunque tenga miles de pines, rutas y zonas.

## Panel de capas

El mapa tendrá un panel lateral o desplegable con grupos activables:

- Tiendas
- NPC
- Misiones
- Monstruos
- Rutas de enemigos
- Cofres
- Recursos
- Zonas
- Eventos
- Lugares importados desde OpenStreetMap
- Errores de validación

Cada grupo permite:

- Mostrar u ocultar.
- Bloquear para evitar mover elementos por accidente.
- Cambiar opacidad.
- Seleccionar todos los elementos visibles.
- Mostrar contador.

## Filtros rápidos

Los filtros podrán combinarse:

- Tipo de entidad.
- Activo o desactivado.
- Publicado o borrador.
- Con contenido asignado o sin asignar.
- Con errores o sin errores.
- Nivel mínimo y máximo.
- Zona.
- Etiquetas.
- Fecha de modificación.
- Autor del cambio.

Ejemplo:

```text
Mostrar solo:
- Tiendas
- Sin catálogo
- Dentro de Zona Centro
```

## Búsqueda global del mapa

Barra de búsqueda para localizar por:

- Nombre.
- ID interno.
- Tipo.
- Contenido asignado.
- Dirección o lugar real.
- Zona o ruta.
- Etiqueta.

Al seleccionar un resultado:

1. Centrar el mapa.
2. Ajustar zoom.
3. Resaltar el elemento.
4. Abrir el inspector.

## Modo aislamiento

Acción `Aislar selección`:

- Oculta temporalmente todo lo demás.
- Mantiene visibles dependencias relacionadas.
- Permite volver con `Salir de aislamiento`.

Ejemplo: aislar una ruta roja y mostrar únicamente sus enemigos, zonas y pines asociados.

## Agrupación visual

Con zoom lejano, los pines se agrupan en clusters para evitar saturación.

Cada grupo muestra:

- Cantidad total.
- Desglose por tipo.
- Indicador de errores críticos.

Al acercar el zoom, el grupo se separa automáticamente.

## Selección múltiple

El editor permitirá:

- Shift + clic.
- Arrastrar rectángulo de selección.
- Seleccionar por zona.
- Seleccionar todos los filtrados.

Acciones masivas:

- Activar o desactivar.
- Cambiar icono.
- Cambiar etiqueta.
- Mover a otra zona.
- Asignar contenido compatible.
- Eliminar con confirmación.

## Leyenda del mapa

Mostrar una leyenda configurable con colores e iconos de:

- Tipos de pin.
- Estados.
- Niveles de peligro.
- Errores.
- Elementos no publicados.

## Rendimiento

- Renderizar solo elementos dentro del área visible.
- Usar clustering y virtualización.
- Evitar recalcular todos los pines en cada movimiento.
- Cargar detalles completos únicamente al seleccionar.
- Mantener filtros y capas en el estado del proyecto.

## Persistencia

El editor recordará por proyecto:

- Capas visibles.
- Filtros activos.
- Zoom y centro.
- Elemento seleccionado.
- Modo aislamiento.

## Validaciones

No permitir:

- Filtros que apunten a campos inexistentes.
- Acciones masivas incompatibles con tipos mezclados.
- Eliminar elementos bloqueados sin confirmación adicional.

## Pruebas mínimas

- Mostrar y ocultar cada capa.
- Aplicar varios filtros juntos.
- Buscar por nombre e ID.
- Centrar y abrir inspector desde resultados.
- Agrupar pines al alejar zoom.
- Selección múltiple y acciones masivas.
- Restaurar estado al cerrar y abrir el proyecto.
