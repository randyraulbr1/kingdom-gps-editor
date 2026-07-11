# Asignación de contenido a pines del mapa

## Objetivo

Permitir que cada pin del Editor de Mundo se conecte fácilmente con contenido ya creado en otros módulos del Panel ADM.

El administrador no debe escribir IDs manualmente ni editar JSON para conectar una tienda, NPC, misión, diálogo, cofre, enemigo o recurso.

## Inspector del pin

Al seleccionar un pin en el mapa, el panel lateral debe mostrar:

- Nombre del pin
- Tipo de pin
- Icono
- Coordenadas
- Radio de interacción
- Estado
- Visibilidad
- Zona asignada
- Contenido conectado
- Botón de vista previa
- Botón de probar interacción

## Selector por tipo

El contenido disponible cambia automáticamente según el tipo de pin.

### Pin de tienda

Mostrar:

- Selector de tienda creada
- Tipo de tienda
- Catálogo asignado
- Horario
- Radio de interacción
- Comprar activado/desactivado
- Vender activado/desactivado

El selector debe listar todas las tiendas existentes con búsqueda y filtros.

### Pin de NPC

Mostrar:

- Selector de NPC
- Selector de diálogo inicial
- Selector de misión ofrecida
- Selector de tienda opcional
- Estado del NPC
- Requisitos para verlo

Un NPC puede tener una o varias funciones, pero el inspector debe mostrar claramente cuál es la principal.

### Pin de misión

Mostrar:

- Selector de misión
- Paso de misión relacionado
- Requisitos
- Recompensa
- Radio de activación
- Si inicia, actualiza o completa la misión

### Pin de enemigo

Mostrar:

- Selector de enemigo
- Nivel o rango de nivel
- Vida
- Daño
- Radio de visión
- Radio de persecución
- Radio de ataque
- Tiempo de respawn
- Ruta enemiga asignada

### Pin de cofre

Mostrar:

- Selector de tabla de recompensa
- Requisitos
- Tiempo de respawn
- Apertura única o repetible
- Nivel mínimo

### Pin de recurso

Mostrar:

- Selector de recurso
- Cantidad
- Tiempo de reaparición
- Herramienta requerida
- Profesión requerida

## Búsqueda y filtros

Todos los selectores deben incluir:

- Buscar por nombre
- Buscar por ID
- Filtrar por categoría
- Filtrar por nivel
- Filtrar por estado
- Mostrar solo activos
- Mostrar recientes
- Crear nuevo sin cerrar el inspector

## Crear contenido desde el pin

Añadir botón:

`Crear y asignar`

Ejemplo:

1. Seleccionar pin de tienda.
2. Pulsar `Crear y asignar`.
3. Crear una tienda nueva en una ventana o panel acoplado.
4. Guardar.
5. Volver automáticamente al pin.
6. Asignar la tienda recién creada.

## Referencias seguras

El pin debe guardar referencias estables:

- `entityType`
- `entityId`
- `entityVersion`
- `interactionType`

Nunca copiar el contenido completo dentro del pin.

Así, si se cambia el catálogo de una tienda o el diálogo de un NPC, todos los pines conectados se actualizan sin duplicar datos.

## Validación

Antes de guardar o publicar, comprobar:

- El contenido asignado existe
- Está activo
- Es compatible con el tipo de pin
- Tiene los datos obligatorios
- No tiene referencias rotas
- No apunta a una versión eliminada

Si falla, mostrar:

- Error claro
- Campo afectado
- Botón para reparar
- Botón para seleccionar otro contenido

## Estado visual del pin

- Verde: conectado y válido
- Amarillo: incompleto
- Rojo: referencia rota
- Gris: desactivado
- Azul: seleccionado

## Vista previa

El botón `Probar interacción` debe simular:

- Abrir tienda
- Abrir diálogo
- Mostrar misión
- Abrir cofre
- Iniciar encuentro enemigo
- Recolectar recurso

La vista previa no debe modificar producción.

## Uso inverso

Desde cada tienda, NPC, misión o enemigo, debe existir una pestaña:

`Usado en el mapa`

Mostrar:

- Lista de pines donde se utiliza
- Zona
- Coordenadas
- Estado
- Botón para centrar el mapa

## Base de datos sugerida

### `world_entity_links`

- id
- world_entity_id
- target_type
- target_id
- target_version
- interaction_type
- is_primary
- created_at
- updated_at

## Historial

Registrar:

- Contenido anterior
- Contenido nuevo
- Usuario administrador
- Fecha
- Motivo opcional

Toda reasignación debe poder deshacerse.

## Fases

### Fase A
- Selector de contenido por tipo
- Guardado de referencias
- Validación básica

### Fase B
- Crear y asignar
- Vista previa
- Estados visuales

### Fase C
- Uso inverso
- Reparación de referencias
- Historial y undo/redo

## Regla principal

Un pin representa una ubicación y una interacción. El contenido real pertenece a su módulo correspondiente y se conecta mediante una referencia estable.
