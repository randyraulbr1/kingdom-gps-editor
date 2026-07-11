# Zonas de juego por jugador y cobertura del mundo

## Objetivo

Permitir que cada jugador defina una zona segura de juego mediante varios pines sobre el mapa. El Panel ADM debe recibir esa zona y permitir crear dentro de ella misiones, enemigos, recursos, NPC, cofres, eventos y cadenas completas.

También debe existir un modo de cobertura general para pueblos pequeños o regiones donde los jugadores todavía no hayan definido una zona personal.

## Flujo del jugador

El jugador pulsa:

`Definir mi zona de juego`

Después:

1. Se abre el mapa.
2. Coloca varios pines formando un área.
3. Ve el polígono resultante.
4. Puede mover o eliminar pines.
5. El juego calcula superficie, perímetro y distancia aproximada.
6. Confirma que la zona es segura y accesible.
7. Envía la solicitud al Panel ADM.

La zona nunca debe mostrar públicamente la ubicación exacta del domicilio del jugador.

## Vista del Panel ADM

Crear una sección:

`Áreas de juego`

Con dos modos:

### Por jugador

Mostrar:

- Jugadores con zona definida
- Jugadores sin zona
- Estado de aprobación
- Cantidad de contenido dentro del área
- Fecha de última actualización
- Alertas de seguridad o accesibilidad

Al seleccionar un jugador:

- Centrar el mapa en su zona
- Resaltar el polígono
- Mostrar los pines que lo forman
- Mostrar todo el contenido dentro
- Crear nuevas entidades dentro del área
- Importar cadenas de misiones
- Generar rutas conectadas
- Publicar contenido privado para ese jugador

### Cobertura pública

Para pueblos pequeños o zonas sin áreas personales:

- Dibujar un área pública sobre el mapa
- Asignarla a una ciudad, pueblo o región
- Crear contenido compartido
- Permitir que cualquier jugador dentro del área lo use
- Ver cobertura y densidad de contenido

## Tipos de zona

- Privada del jugador
- Amigos
- Grupo
- Pueblo
- Ciudad
- Región
- Pública
- Evento temporal

## Restricciones

Toda entidad creada debe quedar dentro del polígono permitido.

Validar:

- Punto dentro del área
- Separación mínima entre pines
- Ruta caminable
- Evitar agua
- Evitar autopistas
- Evitar zonas claramente inaccesibles
- Respetar radio máximo definido

Si una entidad queda fuera, el panel debe impedir publicar o marcarla como error.

## Herramientas del mapa

- Dibujar polígono
- Editar vértices
- Añadir o quitar pines
- Dividir área
- Fusionar áreas
- Copiar área
- Crear plantilla de contenido
- Ver densidad
- Ver zonas vacías
- Ver solapamientos

## Contenido por área

Cada zona debe poder contener:

- Misiones
- Cadenas de misiones
- Enemigos
- NPC
- Recursos
- Cofres
- Eventos
- Recompensas
- Spawns

## Estados

- draft
- pending_review
- approved
- active
- paused
- rejected
- expired
- archived

## Base de datos sugerida

### `play_areas`

- id
- owner_type
- owner_id
- name
- area_type
- polygon_json
- status
- is_public
- created_at
- updated_at

### `play_area_entities`

- id
- play_area_id
- world_entity_id
- visibility
- created_at

## Privacidad

- No mostrar públicamente el nombre real del jugador
- No guardar una etiqueta como “casa”
- Permitir anonimizar coordenadas en exportaciones
- Restringir acceso del Panel ADM por roles
- Registrar quién abrió o modificó una zona

## Cobertura mundial

El mapa global debe mostrar:

- Áreas personales
- Áreas públicas
- Pueblos sin cobertura
- Ciudades con contenido
- Zonas saturadas
- Zonas vacías
- Solicitudes pendientes

## Flujo de creación

1. Seleccionar área.
2. Crear o importar contenido.
3. Validar que todo esté dentro.
4. Mostrar rutas y conexiones.
5. Probar localmente.
6. Aprobar.
7. Sincronizar con servidor.
8. Activar para el jugador o público correspondiente.

## Fases

### Fase A
- Crear y editar polígonos
- Guardar zonas localmente
- Listado por jugador

### Fase B
- Asignar contenido a zonas
- Validar puntos dentro del polígono
- Vista de cobertura pública

### Fase C
- Solicitud desde el juego
- Aprobación desde Panel ADM
- Sincronización con servidor

### Fase D
- Plantillas automáticas por área
- Estadísticas de cobertura
- Detección de zonas vacías o saturadas

## Regla principal

El contenido privado solo debe estar disponible para el jugador, grupo o región asignada. El contenido público debe pasar revisión antes de activarse para todos.
