# Seguridad, auditoría y revisión de jugadores

## Objetivo

El Panel ADM debe incluir una sección de seguridad que permita revisar la actividad completa de cada jugador, detectar anomalías y exportar un expediente técnico para análisis.

## Perfil de jugador

Cada jugador debe mostrar:

- ID de cuenta
- Nombre visible
- Fecha de creación
- Último acceso
- Tiempo total jugado
- Dispositivos usados
- Versiones del juego usadas
- IP aproximada o región, si se registra legalmente
- Estado de la cuenta
- Sanciones
- Riesgo actual

## Historial completo

Registrar eventos importantes:

- Inicio y cierre de sesión
- Cambios de dispositivo
- Cambios de ubicación GPS relevantes
- Objetos obtenidos
- Objetos gastados
- Objetos equipados
- Recompensas recibidas
- Compras
- Moneda ganada y gastada
- Misiones iniciadas y completadas
- Enemigos derrotados
- Intercambios entre jugadores
- Cambios de inventario
- Cambios de estadísticas
- Intentos fallidos de API
- Errores de sincronización
- Acciones de administrador

## Libro contable de objetos y dinero

No depender solo de un campo de balance.

Cada cambio debe crear una entrada auditable con:

- eventId
- playerId
- actionType
- itemId o currencyType
- amountBefore
- amountChanged
- amountAfter
- source
- relatedEntityId
- serverTimestamp
- clientTimestamp
- deviceId
- requestId
- idempotencyKey
- validationResult

Ejemplos de `source`:

- quest_reward
- enemy_loot
- admin_grant
- purchase
- trade
- crafting
- pickup_gps
- migration
- rollback

## Detección de anomalías

El sistema debe marcar, no declarar automáticamente como culpable, comportamientos como:

- Objetos que aparecen sin evento de origen
- Incrementos imposibles de moneda
- Cantidades superiores a límites razonables
- Misiones completadas demasiado rápido
- Distancias GPS imposibles
- Teletransportes frecuentes
- Velocidad de movimiento incompatible con caminar
- Recompensas duplicadas
- Reutilización de requestId
- Varias cuentas con el mismo dispositivo
- Versiones modificadas del cliente
- Llamadas directas a endpoints sensibles
- Cambios de inventario no confirmados por servidor

## Puntuación de riesgo

Cada señal suma riesgo:

- Bajo
- Medio
- Alto
- Crítico

La puntuación debe ser explicable. El panel debe indicar qué eventos generaron la alerta.

## Línea de tiempo visual

Mostrar una cronología filtrable por:

- Fecha
- Tipo de evento
- Objetos
- Moneda
- GPS
- Misiones
- Seguridad
- Errores

Cada entrada debe poder abrirse para ver su payload completo.

## Comparador de inventario

Permitir comparar:

- Inventario esperado según eventos
- Inventario almacenado actualmente
- Diferencias
- Objetos sin origen
- Objetos faltantes
- Duplicados

## Acciones administrativas

- Marcar para revisión
- Congelar intercambios
- Congelar recompensas
- Bloquear temporalmente
- Solicitar verificación
- Restaurar inventario desde historial
- Eliminar objeto ilegítimo con registro
- Recalcular balance
- Añadir nota interna
- Cerrar investigación

Toda acción administrativa también debe quedar auditada.

## Exportar expediente

Añadir botón:

`Descargar expediente de seguridad`

Formatos:

- JSON completo
- CSV resumido
- ZIP con logs y metadatos
- Informe Markdown legible

El archivo debe incluir:

- Resumen de cuenta
- Línea de tiempo
- Inventario
- Dinero
- Misiones
- GPS
- Dispositivos
- Alertas
- Diferencias detectadas
- Acciones administrativas
- Checksums de integridad

Este archivo podrá subirse posteriormente a ChatGPT para revisarlo, resumir anomalías y explicar posibles causas. El análisis debe tratar las alertas como indicios, no como prueba definitiva de trampa.

## Integridad

Los eventos críticos deben:

- Generarse en servidor
- Usar IDs únicos
- Tener timestamp del servidor
- Ser idempotentes
- No poder editarse desde el cliente
- Mantener historial inmutable
- Incluir hash o firma cuando sea viable

## Privacidad

- Exportar solo datos necesarios
- Ocultar tokens, contraseñas y secretos
- Permitir anonimizar identificadores
- Definir retención de logs
- Restringir acceso por roles

## Fases

### Fase A
- Registro de eventos
- Historial de objetos y moneda
- Vista de jugador

### Fase B
- Línea de tiempo
- Comparador de inventario
- Alertas básicas

### Fase C
- Puntuación de riesgo
- Detección GPS
- Detección de duplicados y recompensas imposibles

### Fase D
- Exportación de expediente
- Herramientas de restauración
- Revisión asistida

## Regla principal

El servidor debe ser la fuente de verdad. El cliente puede solicitar acciones, pero nunca decidir por sí solo que ganó dinero, obtuvo objetos o completó una misión.
