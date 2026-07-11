# Tiendas y catálogos interactivos desde el mapa

## Objetivo

Permitir crear una tienda desde el Editor de Mundo, asociarla a un pin GPS y hacer que, al pulsar ese pin, se abra una interfaz funcional de comercio.

## Flujo de creación

1. Clic derecho en el mapa.
2. Seleccionar `Crear tienda`.
3. Elegir tipo de tienda:
   - Farmacia o pociones
   - Armas
   - Armaduras
   - Recursos
   - Comida
   - General
   - Personalizada
4. Elegir un lugar real de OpenStreetMap o colocar un punto manual.
5. Asignar nombre, icono y radio de interacción.
6. Seleccionar o crear un catálogo.
7. Guardar localmente.
8. Probar interacción.
9. Publicar.

## Comportamiento del pin

Al tocar el pin:

- Mostrar nombre y tipo de tienda.
- Mostrar distancia del jugador.
- Mostrar si está abierta o cerrada.
- Mostrar botón `Abrir tienda` si está dentro del radio.
- Si está fuera del radio, mostrar cuánto falta para acercarse.

El pin nunca debe quedarse como un marcador decorativo.

## Catálogo

Cada tienda puede tener:

- Productos disponibles
- Precio de compra
- Precio de venta
- Cantidad disponible
- Límite por jugador
- Nivel requerido
- Profesión requerida
- Horarios
- Fecha de inicio y fin
- Descuentos
- Productos destacados

## Tipos de inventario de tienda

- Ilimitado
- Limitado global
- Limitado por jugador
- Reposición por tiempo
- Reposición manual
- Catálogo por temporada

## Seguridad

- El servidor valida toda compra.
- El cliente nunca modifica dinero ni inventario directamente.
- Toda compra usa `idempotencyKey`.
- Toda operación registra:
  - playerId
  - shopId
  - itemId
  - cantidad
  - precio
  - moneda
  - timestamp
  - resultado
  - correlationId

## Panel ADM

Cada tienda debe tener pestañas:

- Resumen
- Ubicación
- Catálogo
- Precios
- Stock
- Horarios
- Requisitos
- Historial
- Vista previa
- Publicar

## Probar tienda

Añadir botón `Probar tienda` para:

- Abrir el catálogo sin publicar.
- Simular jugador dentro o fuera del radio.
- Simular dinero insuficiente.
- Simular inventario lleno.
- Simular compra correcta.
- Confirmar que el objeto se entrega una sola vez.

## OpenStreetMap

Al importar lugares reales dentro de una zona, permitir convertir:

- pharmacy → tienda de pociones
- hospital/clinic → tienda médica
- fuel → tienda de suministros
- supermarket/convenience → tienda general
- hardware → herramientas y recursos

La conversión debe ser sugerida, nunca obligatoria.

## Base de datos sugerida

### `shops`

- id
- world_entity_id
- name
- shop_type
- catalog_id
- interaction_radius_m
- status
- opens_at
- closes_at
- metadata_json
- created_at
- updated_at

### `shop_catalogs`

- id
- name
- version
- status
- created_at
- updated_at

### `shop_catalog_items`

- catalog_id
- item_id
- buy_price
- sell_price
- currency_type
- stock_mode
- stock_quantity
- per_player_limit
- required_level
- sort_order

## Estados

- draft
- active
- paused
- closed
- archived
- sync_error

## Fases

### Fase A
- Crear tienda desde mapa
- Abrir ficha al tocar pin
- Asociar catálogo local

### Fase B
- Compra y venta simulada
- Validaciones
- Historial local

### Fase C
- Sincronización con servidor
- Stock compartido
- Auditoría

## Regla principal

Crear una tienda en el mapa debe producir una entidad interactiva completa: pin, configuración, catálogo, validación y vista funcional. No debe crear solo un icono sin comportamiento.
