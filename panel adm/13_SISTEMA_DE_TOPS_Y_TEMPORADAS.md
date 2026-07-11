# Sistema de tops, clasificaciones y temporadas

## Objetivo

Crear clasificaciones configurables para Kingdom GPS, administradas desde el Panel ADM, con tops permanentes y tops por temporada.

## Tipos de top

### Permanentes

No se reinician automáticamente.

Ejemplos:

- Nivel más alto
- Experiencia total
- Tiempo jugado
- Misiones completadas históricas

### Temporales

Se reinician según una temporada configurada.

Ejemplos:

- Enemigos eliminados este mes
- Distancia caminada este mes
- Misiones completadas este mes
- Recursos recogidos este mes
- Eventos ganados

## Top de nivel

Reglas:

- Ordenar de mayor a menor nivel.
- En empate, usar experiencia actual.
- Si continúa el empate, usar la fecha en la que alcanzó el nivel.
- No reiniciar mientras la carrera al nivel máximo siga activa.
- Cuando varios jugadores lleguen al nivel máximo, el administrador puede cerrar esa clasificación.
- Al cerrarla, guardar una fotografía histórica del ranking.
- Después puede ocultarse a los jugadores sin eliminar sus datos.

Estados:

- active
- closed
- hidden
- archived

## Top de enemigos eliminados

- Contar solo eliminaciones confirmadas por el servidor.
- Permitir reinicio mensual, semanal o manual.
- Guardar el resultado final antes de reiniciar.
- Crear una temporada nueva con contador en cero.
- Conservar historial de ganadores.

## Panel ADM

Crear una sección:

`Clasificaciones`

Opciones:

- Crear top
- Editar top
- Activar
- Pausar
- Ocultar
- Cerrar temporada
- Reiniciar temporada
- Ver ranking actual
- Ver históricos
- Exportar resultados
- Descalificar entradas fraudulentas con registro
- Recalcular clasificación

## Configuración de cada top

- id
- nombre
- descripción
- métrica
- tipo permanente o temporal
- fecha de inicio
- fecha de cierre
- frecuencia de reinicio
- cantidad de posiciones visibles
- filtros por región
- filtros por grupo o servidor
- reglas de desempate
- recompensas
- visibilidad

## Guardado histórico

Antes de reiniciar una clasificación temporal, guardar:

- temporada
- posiciones finales
- puntuaciones
- jugadores
- fecha de cierre
- recompensas entregadas
- checksum

Nunca borrar el ranking anterior.

## Base de datos sugerida

### `leaderboards`

- id
- name
- metric
- type
- status
- reset_policy
- max_visible_positions
- visibility
- starts_at
- ends_at
- created_at
- updated_at

### `leaderboard_scores`

- leaderboard_id
- player_id
- score
- secondary_score
- reached_at
- updated_at

### `leaderboard_seasons`

- id
- leaderboard_id
- season_number
- starts_at
- ends_at
- status
- snapshot_path

### `leaderboard_snapshots`

- season_id
- rank
- player_id
- score
- metadata_json

## Seguridad

- El cliente nunca envía directamente su puntuación final.
- Las métricas se calculan desde eventos confirmados por el servidor.
- Las eliminaciones, niveles y recompensas deben ser auditables.
- Si un jugador es marcado por trampas, su entrada puede quedar en revisión sin modificar todavía el histórico.
- Toda exclusión o corrección administrativa debe dejar registro.

## Caché y rendimiento

- Mantener rankings precalculados.
- Actualizar por eventos o intervalos.
- No recalcular toda la tabla en cada consulta.
- Permitir paginación.
- Mostrar siempre la posición del jugador aunque no esté en el top visible.

## Experiencia del jugador

Mostrar:

- Posición
- Nombre
- Nivel o puntuación
- Cambio respecto al periodo anterior
- Tiempo restante de temporada
- Recompensas
- Posición personal

## Recompensas opcionales

- Moneda del juego
- Objetos
- Títulos
- Insignias
- Cosméticos
- Reconocimiento histórico

La entrega debe ser idempotente para evitar premios duplicados.

## Exportación

Permitir exportar:

- JSON
- CSV
- Markdown
- Snapshot firmado

## Fases

### Fase A
- Top permanente de nivel
- Top mensual de enemigos
- Panel básico de administración

### Fase B
- Temporadas
- Históricos
- Cierre y reinicio seguro

### Fase C
- Recompensas
- Filtros regionales
- Detección de anomalías

### Fase D
- Más métricas
- Comparación entre temporadas
- Estadísticas visuales

## Regla principal

Reiniciar una clasificación nunca debe borrar su historia. Primero se guarda un snapshot final, luego se crea la nueva temporada.
