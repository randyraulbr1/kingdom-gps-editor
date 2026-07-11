# Monstruos, combate simple y loot desde el mapa

## Objetivo

Conectar los pines y rutas de enemigos del Editor de Mundo con enemigos reales creados en el panel, usando una IA simple basada en distancias GPS y recompensas configurables.

## Flujo principal

1. El administrador crea un enemigo en el módulo Monstruos.
2. Define sus estadísticas básicas.
3. Define sus distancias GPS.
4. Asigna una tabla de loot.
5. En el mapa crea un pin o una ruta roja.
6. Selecciona qué enemigos pueden aparecer.
7. El jugador entra en la zona.
8. Tras el tiempo configurado, aparecen enemigos compartidos para jugadores cercanos.
9. El enemigo detecta, persigue y ataca según distancias.
10. Al morir, el servidor calcula experiencia y recompensas.

## Datos mínimos del enemigo

- id estable
- nombre
- icono
- categoría
- nivel mínimo
- nivel máximo
- vida
- daño
- defensa
- velocidad
- experiencia otorgada
- lootTableId opcional
- activo/inactivo

## Distancias GPS

- visibleRadiusMeters: distancia a la que el jugador puede verlo.
- visionRadiusMeters: distancia a la que el enemigo detecta al jugador.
- pursuitRadiusMeters: distancia máxima de persecución.
- attackRadiusMeters: distancia para iniciar o mantener ataque.
- returnRadiusMeters: distancia a partir de la cual vuelve a su origen.
- gpsToleranceMeters: tolerancia para evitar saltos por imprecisión GPS.

Valores iniciales recomendados:

- visible: 150 m
- visión: 100 m
- persecución: 250 m
- ataque: 30–50 m
- regreso: 300 m
- tolerancia GPS: 15–25 m

Todos deben ser editables desde el inspector.

## IA inicial

Solo cuatro estados:

- idle
- chasing
- attacking
- returning

Reglas:

- Si un jugador entra en visión, pasa a chasing.
- Si entra en ataque, pasa a attacking.
- Si sale de persecución, pasa a returning.
- Cuando vuelve al origen, pasa a idle.

No implementar habilidades complejas todavía. Las habilidades serán un sistema separado más adelante.

## Combate compartido por proximidad

- Radio compartido configurable por zona, valor recomendado 500 m.
- Todos los jugadores dentro del mismo grupo de proximidad ven el mismo enemigo.
- Todos pueden dañarlo.
- El servidor mantiene vida, objetivo y estado.
- Cada jugador recibe recompensa según participación.
- Curación y apoyo pueden contar como participación en una fase futura.

## Spawn por tiempo

Cada jugador que entra a la zona recibe un tiempo aleatorio entre mínimo y máximo.

Cuando cualquier temporizador vence:

- si hay jugadores dentro del radio compartido, se crea un solo grupo de enemigos para todos;
- los demás temporizadores compatibles se cancelan o se reutilizan para evitar duplicados;
- la zona entra en cooldown tras limpiar el grupo.

Campos:

- spawnMinSeconds
- spawnMaxSeconds
- minEnemyCount
- maxEnemyCount
- maxActiveEnemies
- sharedRadiusMeters
- cooldownSeconds

## Inspector del pin o ruta

Para un pin enemigo:

- enemigo asignado
- nivel fijo o rango
- cantidad
- visión
- persecución
- ataque
- tiempo de aparición
- radio compartido
- loot
- botón Probar spawn

Para una ruta roja:

- lista ponderada de enemigos
- nivel por enemigo
- cantidad mínima/máxima
- tiempo mínimo/máximo
- máximo activo
- radio compartido
- cooldown
- botón Simular jugador

## Loot

Una tabla de loot debe permitir:

- objeto
- probabilidad
- cantidad mínima
- cantidad máxima
- condición opcional
- límite por jugador
- experiencia
- monedas del juego

La entrega debe ser idempotente y validada por servidor.

## Validaciones

Bloquear publicación si:

- una ruta no tiene enemigos;
- un enemigo no tiene nivel válido;
- ataque > persecución;
- visión > persecución sin confirmación;
- tiempos mínimo y máximo son inválidos;
- loot referencia objetos inexistentes;
- un pin enemigo no tiene enemigo asignado.

## Pruebas necesarias

- aparición entre mínimo y máximo;
- dos jugadores cercanos comparten enemigos;
- jugadores fuera del radio no comparten;
- persecución y regreso funcionan;
- GPS con tolerancia no cambia de estado constantemente;
- loot no se entrega dos veces;
- reiniciar la app conserva toda la configuración.

## Orden de implementación

1. Módulo Monstruos CRUD.
2. Tabla de loot simple.
3. Asignación a pin.
4. Asignación a ruta roja.
5. Simulación local en el editor.
6. Exportación JSON.
7. Integración con backend cuando exista.
