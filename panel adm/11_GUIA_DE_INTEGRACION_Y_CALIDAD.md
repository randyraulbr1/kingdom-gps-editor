# Guía de integración y calidad

## Objetivo

Definir cómo debe implementarse cada módulo del Panel ADM y del juego para evitar errores, duplicados, incompatibilidades y conexiones rotas.

Esta guía debe aplicarse a inventario, mapa GPS, misiones, objetos, enemigos, chat, amigos, seguridad, economía, estilos, sincronización y cualquier módulo futuro.

## Regla principal

Ningún módulo se conecta directamente a otro mediante código improvisado.

Toda conexión debe pasar por uno de estos mecanismos:

- Contrato TypeScript
- Evento tipado
- Servicio
- Repository
- Adaptador
- API versionada
- IPC tipado

## Estructura obligatoria por módulo

Cada módulo debe tener, cuando aplique:

```text
module-name/
├── contracts/
├── models/
├── services/
├── repositories/
├── adapters/
├── components/
├── hooks/
├── styles/
├── validators/
├── tests/
├── migrations/
├── index.ts
└── README.md
```

## Registro del módulo

Cada módulo debe declarar:

- id
- nombre
- versión
- descripción
- punto de entrada
- archivos principales
- contratos públicos
- eventos que emite
- eventos que escucha
- APIs que consume
- APIs que expone
- tablas usadas
- permisos necesarios
- feature flags
- pruebas disponibles

## Contratos públicos

Antes de escribir una implementación, definir las interfaces públicas.

Ejemplo:

```ts
export interface InventoryService {
  addItem(itemId: string, quantity: number): Promise<void>
  removeItem(itemId: string, quantity: number): Promise<void>
  getItems(playerId: string): Promise<InventoryItem[]>
}
```

La interfaz no debe depender de detalles internos.

## Eventos tipados

Todos los eventos deben tener:

- Nombre único
- Payload tipado
- Versión
- Origen
- Timestamp
- Correlation ID

Ejemplo:

```ts
type InventoryItemAddedEvent = {
  type: 'inventory.item_added'
  version: 1
  playerId: string
  itemId: string
  quantity: number
  correlationId: string
  createdAt: string
}
```

## Datos y validación

Todo dato que entre o salga debe validarse.

Validar:

- IDs
- cantidades
- coordenadas
- tipos de entidad
- estados
- versiones
- permisos
- payloads JSON

No confiar en datos del cliente.

## Fuente de verdad

- El servidor confirma objetos, dinero, recompensas y progreso.
- SQLite local sirve para edición, borradores y cola offline.
- El cliente nunca asigna por sí solo recompensas finales.
- El Panel ADM nunca escribe producción sin pasar por la API autorizada.

## Versionado

Todo contrato, evento y API debe versionarse.

Ejemplo:

- `inventory.v1`
- `inventory.v2`
- `quest.created.v1`
- `/api/v1/world/entities`

Un cambio incompatible requiere:

- nueva versión
- migración
- adaptador
- pruebas de compatibilidad

## Migraciones

Toda modificación de base de datos debe incluir:

- migración adelante
- validación posterior
- backup previo
- rollback cuando sea posible
- registro de versión aplicada

Nunca modificar tablas manualmente en producción.

## Idempotencia

Operaciones sensibles deben usar `idempotencyKey`:

- recompensas
- compras
- creación de entidades
- sincronización
- retiros
- movimientos de inventario
- publicación masiva

Así se evita duplicar acciones por reintentos.

## Manejo de errores

Cada servicio debe diferenciar:

- error de validación
- error de red
- error temporal
- error permanente
- conflicto de versión
- error de permisos

Los errores deben contener:

- code
- message
- details seguras
- correlationId
- retryable
- timestamp

Nunca mostrar tokens, contraseñas o secretos.

## Logs

Los logs deben ser estructurados.

Ejemplo:

```json
{
  "level": "error",
  "module": "world-sync",
  "event": "entity_sync_failed",
  "entityId": "enemy_123",
  "correlationId": "corr_abc",
  "retryable": true,
  "timestamp": "..."
}
```

## Pruebas mínimas por módulo

Cada módulo debe incluir:

- pruebas unitarias
- pruebas de integración
- pruebas de contrato
- pruebas de migración
- pruebas de errores
- pruebas de permisos
- pruebas de compatibilidad

Para módulos críticos añadir:

- pruebas end-to-end
- pruebas de carga
- pruebas de recuperación

## Checklist antes de conectar un módulo al juego

- [ ] Contratos definidos
- [ ] Tipos compartidos definidos
- [ ] Validadores implementados
- [ ] Eventos documentados
- [ ] API/IPC documentada
- [ ] Pruebas verdes
- [ ] Migraciones probadas
- [ ] Logs añadidos
- [ ] Manejo de errores añadido
- [ ] Feature flag disponible
- [ ] Rollback definido
- [ ] Documentación actualizada

## Checklist antes de publicar

- [ ] Sin errores TypeScript
- [ ] Sin errores de lint
- [ ] Pruebas verdes
- [ ] Build correcto
- [ ] Backup creado
- [ ] Diff revisado
- [ ] Migraciones verificadas
- [ ] Staging probado
- [ ] Caché y Service Worker preparados
- [ ] Monitoreo activo
- [ ] Rollback listo

## Integración con el juego

Cada módulo debe integrarse mediante una capa estable.

Ejemplo:

```text
UI del Panel
↓
Servicio del Panel
↓
Repository / Provider
↓
API del servidor o SQLite local
↓
Juego
```

No permitir que componentes React llamen directamente a `fetch`, SQLite o filesystem.

## Feature flags

Todo módulo nuevo debe poder activarse en:

- local
- staging
- admin
- beta testers
- porcentaje de usuarios
- producción completa

## Compatibilidad

Antes de reemplazar una parte del juego, comprobar:

- formatos de datos
- eventos
- APIs
- estilos
- guardado
- sincronización
- Service Worker
- versiones antiguas del cliente

## Documentación obligatoria

Cada módulo debe incluir un `README.md` con:

- propósito
- arquitectura
- contratos
- eventos
- tablas
- configuración
- pruebas
- errores conocidos
- cómo activar
- cómo desactivar
- cómo hacer rollback

## Revisión automática del proyecto

Claude Code debe:

1. Leer esta guía.
2. Revisar lo existente.
3. Detectar implementaciones ya hechas.
4. Marcar como completado lo funcional.
5. Completar lo parcial.
6. Mejorar sin romper compatibilidad.
7. Ejecutar pruebas.
8. Actualizar documentación y roadmap.

## Criterio de finalización

Una función no se considera terminada solo porque “abre”.

Debe:

- funcionar
- estar conectada
- guardar correctamente
- manejar errores
- tener pruebas
- estar documentada
- poder desactivarse
- poder revertirse
