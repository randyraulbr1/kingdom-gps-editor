# Editor de Mundo / Mapa

## Objetivo

Editar el mundo directamente sobre un mapa con el mismo estilo del juego y colocar entidades mediante clic derecho o pulsación larga.

## Entidades

- Objetos
- Enemigos
- NPC
- Cofres
- Tiendas
- Misiones
- Recursos
- Plantas
- Eventos
- Zonas
- Spawns
- Construcciones
- Teletransportes
- Marcadores

## Interacción

Al hacer clic derecho:

- Crear entidad aquí
- Copiar coordenadas
- Pegar entidad
- Abrir selector de la base de datos

Cada entidad debe poder seleccionarse, moverse, duplicarse, editarse, desactivarse y eliminarse. Al moverla se actualizan latitud y longitud y queda pendiente de sincronización.

## Estados de sincronización

- local
- pending
- syncing
- synced
- failed
- conflict
- deleted_pending
- deleting
- deleted
- offline

Los errores deben mostrarse encima del icono. La entidad permanece visible y puede reintentarse automática o manualmente.

## Persistencia local

Tabla `world_entities` con ID, tipo, referencia de entidad, posición, propiedades, versiones y estado.

Tabla `world_sync_jobs` para operaciones create, update, move, delete, enable y disable.

## Regla principal

Guardar primero en SQLite local, actualizar el mapa inmediatamente y sincronizar después sin bloquear la interfaz.

## Fases

1. Mapa, capas, marcadores y edición local.
2. SQLite, cola persistente y estados visuales.
3. Sincronización, reintentos y errores.
4. Conflictos, publicación masiva y previsualización en el juego.
