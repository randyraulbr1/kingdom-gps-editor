# 22 — Loot, recompensas y cofres desde el mapa

## Objetivo

Crear un sistema unificado para definir recompensas y conectarlas a monstruos, cofres, misiones, rutas rojas, eventos y tiendas sin duplicar datos ni romper referencias.

## Módulo de tablas de loot

Cada tabla de loot tendrá:

- id estable
- nombre
- descripción
- estado activo/inactivo
- monedas mínimas y máximas
- experiencia mínima y máxima
- lista de posibles recompensas
- condiciones opcionales
- versión e historial

Cada entrada de recompensa tendrá:

- tipo: objeto, arma, armadura, recurso, consumible, moneda, experiencia
- referencia al contenido real
- cantidad mínima
- cantidad máxima
- probabilidad
- rareza
- límite por jugador
- si es garantizada o aleatoria

## Formas de entrega

El panel permitirá seleccionar:

- recompensa personal: cada jugador recibe su propio resultado
- recompensa compartida: un único objeto visible para el grupo
- reparto por participación
- primera interacción
- todos los jugadores cercanos

Para monstruos compartidos por proximidad se recomienda recompensa personal validada por el servidor, para evitar robo de loot.

## Cofres en el mapa

Al seleccionar un pin de tipo cofre, el inspector mostrará:

- tabla de loot asignada
- radio de interacción GPS
- nivel mínimo
- misión requerida
- tiempo de reaparición
- uso único o repetible
- recompensa personal o compartida
- icono cerrado/abierto
- botón Probar apertura

Al tocar el pin en el juego:

1. validar distancia del jugador
2. validar condiciones
3. bloquear doble apertura
4. calcular recompensa en servidor
5. guardar historial
6. entregar inventario/monedas/experiencia
7. cambiar estado visual del cofre

## Loot de monstruos

Cada monstruo podrá tener:

- tabla de loot principal
- tabla rara opcional
- experiencia
- monedas
- bonificación por nivel
- recompensas por jefe

La ruta roja no copiará el loot: solo referencia los monstruos, y cada monstruo referencia sus tablas.

## Recompensas de misión

Cada misión podrá usar una o varias tablas:

- recompensa al aceptar
- recompensa por paso
- recompensa final
- recompensa opcional por objetivo adicional

## Seguridad

- el cliente nunca decide la recompensa final
- usar identificador único por transacción
- impedir doble entrega por reintentos
- registrar jugador, origen, tabla, resultado y fecha
- si falla la entrega después de confirmar, dejar estado pendiente y reintentar

## Inspector y referencias

Todas las tablas tendrán pestaña Usado por.

Antes de borrar una tabla se mostrará si la usan:

- monstruos
- cofres
- misiones
- eventos
- rutas

Opciones:

- reemplazar referencia
- desvincular
- cancelar

## Validaciones antes de publicar

Bloquear publicación si existe:

- cofre sin tabla
- tabla vacía
- probabilidad inválida
- referencia rota
- cantidad mínima mayor que máxima
- recompensa duplicada incompatible
- contenido eliminado aún referenciado

## Pruebas necesarias

- abrir cofre dentro y fuera de rango
- tocar dos veces rápidamente
- reconectar después de perder internet
- varios jugadores abriendo un cofre compartido
- monstruo compartido con recompensa personal
- tabla sin entradas válidas
- inventario lleno
- entrega pendiente y reintento

## Orden de implementación

1. tipos compartidos de RewardTable y RewardEntry
2. migración de base de datos
3. repositorio e IPC
4. panel genérico e inspector
5. asignación a cofres
6. asignación a monstruos
7. asignación a misiones
8. historial de entregas
9. exportación JSON
10. pruebas y validación de referencias
