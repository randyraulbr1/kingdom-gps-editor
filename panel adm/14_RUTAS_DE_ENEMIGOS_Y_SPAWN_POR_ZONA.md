# Rutas de enemigos y spawn por zona

## Objetivo

Permitir crear rutas especiales de enemigos dentro del Editor de Mundo. Estas rutas se dibujan en rojo y representan corredores o caminos donde pueden aparecer enemigos cuando un jugador entra en la zona o avanza por la ruta.

## Concepto principal

Una ruta de enemigos es una polilínea formada por tantos puntos como el administrador necesite.

Ejemplo:

`Punto A → Punto B → Punto C → Punto D`

La ruta debe mostrarse en rojo por defecto, aunque el administrador puede cambiar el color.

## Creación desde el mapa

En el Editor de Mundo:

1. Hacer clic derecho sobre el mapa.
2. Elegir `Crear ruta de enemigos`.
3. Ir colocando puntos sobre el mapa.
4. Cada punto queda conectado con el anterior.
5. Mostrar distancia total mientras se dibuja.
6. Finalizar con:
   - doble clic,
   - botón `Finalizar ruta`,
   - o tecla Escape para cancelar.

La ruta debe quedar editable después:

- mover puntos,
- añadir puntos intermedios,
- eliminar puntos,
- dividir la ruta,
- invertir el sentido,
- duplicar,
- desactivar,
- eliminar.

## Activación por jugador

El sistema debe detectar cuándo el jugador entra en el radio de la ruta.

Configuración:

- radio de activación en metros,
- distancia máxima al trazado,
- nivel mínimo del jugador,
- nivel máximo opcional,
- horario activo,
- días activos,
- cooldown por jugador,
- cantidad máxima de enemigos simultáneos.

Cuando el jugador entra:

1. El servidor valida su posición.
2. Comprueba que la ruta está activa.
3. Comprueba cooldown y límites.
4. Selecciona enemigos de la lista de la ruta.
5. Calcula posiciones válidas sobre o cerca del trazado.
6. Crea los enemigos para ese jugador o grupo.

## Lista de enemigos de la ruta

Cada ruta debe tener una lista configurable.

Por cada enemigo:

- enemyId,
- nombre,
- peso o probabilidad,
- nivel fijo o rango de niveles,
- cantidad mínima,
- cantidad máxima,
- distancia mínima entre spawns,
- tiempo de respawn,
- horario opcional,
- loot especial opcional,
- si puede aparecer solo o en grupo.

Ejemplo:

```json
{
  "routeId": "enemy_route_forest_01",
  "entries": [
    {
      "enemyId": "wolf",
      "weight": 70,
      "levelMin": 3,
      "levelMax": 5,
      "minCount": 1,
      "maxCount": 3
    },
    {
      "enemyId": "alpha_wolf",
      "weight": 30,
      "levelMin": 6,
      "levelMax": 8,
      "minCount": 1,
      "maxCount": 1
    }
  ]
}
```

## Nivel de los enemigos

El Panel ADM debe permitir elegir entre:

- nivel fijo,
- rango aleatorio,
- nivel según el jugador,
- nivel según la zona,
- nivel según dificultad,
- nivel promedio del grupo.

Reglas recomendadas:

- limitar el escalado para evitar enemigos imposibles,
- aplicar mínimo y máximo,
- mostrar nivel estimado antes de publicar,
- guardar la regla usada para auditoría.

## Modos de aparición

### Al entrar en la ruta

Los enemigos aparecen una vez cuando el jugador entra.

### Por distancia recorrida

Ejemplo: cada 150 metros recorridos sobre la ruta.

### Por tiempo

Ejemplo: cada 3 minutos mientras el jugador permanezca dentro.

### Por puntos de control

El administrador coloca nodos de spawn específicos sobre la ruta.

### Oleadas

Ejemplo:

- oleada 1: 3 lobos,
- oleada 2: 2 lobos fuertes,
- oleada 3: 1 jefe.

## Respawn y control de abuso

Configurar:

- respawn global,
- respawn por jugador,
- respawn por grupo,
- cooldown después de completar la ruta,
- límite diario,
- máximo de recompensas,
- bloqueo de farming repetitivo.

El servidor debe ser la fuente de verdad.

## Posiciones seguras

Los enemigos no deben generarse:

- fuera del área permitida,
- dentro de agua,
- en carreteras peligrosas,
- en propiedades claramente inaccesibles,
- demasiado lejos del jugador,
- demasiado cerca unos de otros,
- fuera de la ruta configurada.

Las posiciones deben ajustarse a segmentos válidos de la polilínea.

## Vista previa en el Panel ADM

La ruta debe mostrar:

- línea roja,
- flechas de dirección,
- puntos editables,
- nodos de spawn,
- radio de activación,
- cantidad estimada de enemigos,
- nivel esperado,
- tiempo de respawn,
- estado activo o pausado.

Debe existir un modo `Simular jugador` para recorrer la ruta y ver cuándo aparecerían los enemigos.

## Inspector lateral

Al seleccionar una ruta:

- nombre,
- descripción,
- estado,
- color,
- grosor de línea,
- distancia total,
- radio,
- reglas de activación,
- lista de enemigos,
- niveles,
- respawn,
- horarios,
- límites,
- visibilidad,
- historial,
- errores de validación.

## Base de datos sugerida

### `enemy_routes`

- id
- name
- description
- geometry_json
- color
- status
- activation_radius_m
- spawn_mode
- spawn_interval_seconds
- spawn_distance_m
- cooldown_seconds
- min_player_level
- max_player_level
- max_active_enemies
- created_at
- updated_at

### `enemy_route_entries`

- id
- route_id
- enemy_id
- weight
- level_mode
- level_min
- level_max
- min_count
- max_count
- respawn_seconds
- config_json

### `enemy_route_sessions`

- id
- route_id
- player_id
- entered_at
- last_spawn_at
- distance_progress_m
- enemies_spawned
- cooldown_until
- status

## Estados

- draft
- active
- paused
- disabled
- invalid
- archived

## Seguridad y validación

- La posición del jugador debe validarse en servidor.
- El cliente no decide qué enemigo aparece.
- Cada spawn debe tener un `spawnEventId` único.
- Las recompensas deben ser idempotentes.
- Registrar rutas completadas, enemigos creados y enemigos derrotados.
- Detectar teletransporte o velocidad imposible antes de otorgar recompensas.

## Flujo de publicación

1. Dibujar ruta.
2. Añadir enemigos.
3. Configurar niveles y respawn.
4. Validar geometría.
5. Simular jugador.
6. Guardar localmente.
7. Publicar en staging.
8. Probar.
9. Activar en producción.
10. Mantener rollback.

## Fases

### Fase A

- Crear y editar polilíneas.
- Color rojo por defecto.
- Guardado local.
- Inspector básico.

### Fase B

- Lista de enemigos.
- Niveles.
- Modos de spawn.
- Vista previa.

### Fase C

- Simulador de jugador.
- Cooldowns.
- Respawn.
- Validaciones geográficas.

### Fase D

- Sincronización con servidor.
- Auditoría.
- Estadísticas por ruta.
- Eventos y oleadas.

## Regla principal

Una ruta nunca debe crear enemigos de forma infinita ni confiar en el cliente. El servidor valida entrada, cooldown, posición, cantidad y recompensa antes de generar cada spawn.
